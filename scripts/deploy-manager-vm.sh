#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AZ_BIN="${AZ_BIN:-/home/pak/.venvs/azcli/bin/az}"
AZURE_CONFIG_DIR="${AZURE_CONFIG_DIR:-/home/pak/.azure-wsl}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-manager}"
VM_NAME="${VM_NAME:-manager-vm}"
DOMAIN="${DOMAIN:-manager.pakagent.dpdns.org}"
VM_TUNNEL_ID="${VM_TUNNEL_ID:-}"
SERVICE_NAME="${SERVICE_NAME:-manager-site.service}"
TUNNEL_SERVICE_NAME="${TUNNEL_SERVICE_NAME:-cloudflared-manager.service}"
APP_REF="${APP_REF:-$(git -C "$ROOT_DIR" rev-parse --short HEAD)}"
ARTIFACT_PATH="${ARTIFACT_PATH:-/tmp/manager-site-static-${APP_REF}.tar.gz}"
PREVIEW_PORT="${PREVIEW_PORT:-38123}"
ROUTE_DOMAIN_TO_VM="${ROUTE_DOMAIN_TO_VM:-0}"

cd "$ROOT_DIR"

if [[ ! -x "$AZ_BIN" ]]; then
  echo "Azure CLI not found at $AZ_BIN" >&2
  exit 1
fi

echo "Building static site locally for ref $APP_REF"
npm ci
npm run build

tar -C "$ROOT_DIR/out" -czf "$ARTIFACT_PATH" .
ARTIFACT_B64="$(base64 -w0 "$ARTIFACT_PATH")"

read -r -d '' REMOTE_SCRIPT <<'EOF' || true
set -eu

RELEASE_DIR="/srv/manager-site-releases/__APP_REF__"
BACKUP_DIR="/srv/manager-site-backups/$(date +%Y%m%d%H%M%S)"
LIVE_DIR="/srv/manager-site"
PREVIEW_PORT="__PREVIEW_PORT__"
SERVICE_NAME="__SERVICE_NAME__"
TUNNEL_SERVICE_NAME="__TUNNEL_SERVICE_NAME__"

mkdir -p /srv/manager-site-releases /srv/manager-site-backups "$RELEASE_DIR"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

printf '%s' '__ARTIFACT_B64__' | base64 -d > /tmp/manager-site-static.tar.gz
tar -xzf /tmp/manager-site-static.tar.gz -C "$RELEASE_DIR"

test -f "$RELEASE_DIR/index.html"
test -f "$RELEASE_DIR/quote.html"
test -f "$RELEASE_DIR/contact.html"
test -f "$RELEASE_DIR/admin.html"
test -f "$RELEASE_DIR/health.html"

python3 -m http.server "$PREVIEW_PORT" -d "$RELEASE_DIR" >/tmp/manager-site-preview.log 2>&1 &
PREVIEW_PID="$!"
trap 'kill "$PREVIEW_PID" 2>/dev/null || true' EXIT
sleep 2
curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/quote" >/dev/null
curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/contact" >/dev/null
curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/health" >/dev/null
kill "$PREVIEW_PID" 2>/dev/null || true
wait "$PREVIEW_PID" 2>/dev/null || true
trap - EXIT

if [ -e "$LIVE_DIR" ] || [ -L "$LIVE_DIR" ]; then
  mv "$LIVE_DIR" "$BACKUP_DIR"
fi

ln -sfn "$RELEASE_DIR" "$LIVE_DIR"
chown -h azureuser:azureuser "$LIVE_DIR" || true
chown -R azureuser:azureuser "$RELEASE_DIR"

systemctl restart "$SERVICE_NAME"
systemctl is-active "$SERVICE_NAME"
systemctl is-active "$TUNNEL_SERVICE_NAME"
curl -fsS --max-time 15 http://127.0.0.1:3000/health >/dev/null
EOF

REMOTE_SCRIPT="${REMOTE_SCRIPT//__APP_REF__/$APP_REF}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__PREVIEW_PORT__/$PREVIEW_PORT}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__SERVICE_NAME__/$SERVICE_NAME}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__TUNNEL_SERVICE_NAME__/$TUNNEL_SERVICE_NAME}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__ARTIFACT_B64__/$ARTIFACT_B64}"

export AZURE_CONFIG_DIR

"$AZ_BIN" vm run-command invoke \
  -g "$RESOURCE_GROUP" \
  -n "$VM_NAME" \
  --command-id RunShellScript \
  --scripts "$REMOTE_SCRIPT" \
  -o json >/tmp/manager-vm-static-deploy.json

python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("/tmp/manager-vm-static-deploy.json").read_text())
message = payload["value"][0]["message"]
stderr = message.split("[stderr]\n", 1)[1].strip() if "[stderr]\n" in message else ""

if stderr:
    raise SystemExit(f"Remote deploy reported stderr:\n{stderr}")
PY

if [[ "$ROUTE_DOMAIN_TO_VM" == "1" && -n "$VM_TUNNEL_ID" ]] && command -v cloudflared >/dev/null 2>&1; then
  cloudflared tunnel route dns --overwrite-dns "$VM_TUNNEL_ID" "$DOMAIN" >/tmp/manager-vm-dns-route.log
fi

echo "Static artifact deployed to $VM_NAME using ref $APP_REF"
echo "Artifact path: $ARTIFACT_PATH"
