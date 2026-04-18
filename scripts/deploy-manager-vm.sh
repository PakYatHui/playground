#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AZ_BIN="${AZ_BIN:-/home/pak/.venvs/azcli/bin/az}"
AZURE_CONFIG_DIR="${AZURE_CONFIG_DIR:-/home/pak/.azure-wsl}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-manager}"
VM_NAME="${VM_NAME:-manager-vm}"
DOMAIN="${DOMAIN:-manager.pakagent.dpdns.org}"
VM_TUNNEL_ID="${VM_TUNNEL_ID:-3bfe311d-2ecd-44d3-be4b-1ee363981f17}"
ENV_FILE="${ENV_FILE:-/home/pak/.config/melbourne-manager/manager-site.env}"
APP_REPO="${APP_REPO:-https://github.com/PakYatHui/playground.git}"
APP_REF="${APP_REF:-$(git -C "$ROOT_DIR" rev-parse HEAD)}"
APP_DIR="${APP_DIR:-/opt/manager-site/app}"
SERVICE_NAME="${SERVICE_NAME:-manager-site.service}"
TUNNEL_SERVICE_NAME="${TUNNEL_SERVICE_NAME:-cloudflared-manager.service}"

if [[ ! -x "$AZ_BIN" ]]; then
  echo "Azure CLI not found at $AZ_BIN" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found at $ENV_FILE" >&2
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is required on the local machine." >&2
  exit 1
fi

ENV_B64="$(base64 -w0 "$ENV_FILE")"

read -r -d '' REMOTE_SCRIPT <<'EOF' || true
set -eu

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y git curl ca-certificates nodejs npm

install -d -m 0755 /opt/manager-site

if [ ! -d "__APP_DIR__/.git" ]; then
  rm -rf "__APP_DIR__"
  git clone "__APP_REPO__" "__APP_DIR__"
fi

git -C "__APP_DIR__" fetch --all --tags --prune
git -C "__APP_DIR__" checkout -f "__APP_REF__"

printf '%s' '__ENV_B64__' | base64 -d > /etc/manager-site.env
chmod 600 /etc/manager-site.env

cd "__APP_DIR__"
npm ci
npm run build

cat > /etc/systemd/system/__SERVICE_NAME__ <<'SERVICE'
[Unit]
Description=Manager Site Next.js Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=azureuser
Group=azureuser
WorkingDirectory=__APP_DIR__
EnvironmentFile=/etc/manager-site.env
Environment=HOME=/home/azureuser
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- -H 127.0.0.1 -p 3000
Restart=always
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable __SERVICE_NAME__
systemctl restart __SERVICE_NAME__
systemctl restart __TUNNEL_SERVICE_NAME__
systemctl is-active __SERVICE_NAME__
systemctl is-active __TUNNEL_SERVICE_NAME__
curl -fsS --max-time 15 http://127.0.0.1:3000/api/health
EOF

REMOTE_SCRIPT="${REMOTE_SCRIPT//__APP_DIR__/$APP_DIR}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__APP_REPO__/$APP_REPO}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__APP_REF__/$APP_REF}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__ENV_B64__/$ENV_B64}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__SERVICE_NAME__/$SERVICE_NAME}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__TUNNEL_SERVICE_NAME__/$TUNNEL_SERVICE_NAME}"

export AZURE_CONFIG_DIR

"$AZ_BIN" vm run-command invoke \
  -g "$RESOURCE_GROUP" \
  -n "$VM_NAME" \
  --command-id RunShellScript \
  --scripts "$REMOTE_SCRIPT" \
  -o json >/tmp/manager-vm-deploy.json

python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("/tmp/manager-vm-deploy.json").read_text())
message = payload["value"][0]["message"]
stderr = message.split("[stderr]\n", 1)[1].strip() if "[stderr]\n" in message else ""

if stderr:
    raise SystemExit(f"Remote deploy reported stderr:\n{stderr}")
PY

cloudflared tunnel route dns --overwrite-dns "$VM_TUNNEL_ID" "$DOMAIN" >/tmp/manager-vm-dns-route.log

curl -fsS --max-time 20 "https://$DOMAIN/api/health" >/tmp/manager-vm-public-health.json
curl -I -fsS --max-time 20 "https://$DOMAIN/quote" >/tmp/manager-vm-quote.headers
curl -I -fsS --max-time 20 "https://$DOMAIN/contact" >/tmp/manager-vm-contact.headers

echo "Deployment completed for $DOMAIN using ref $APP_REF"
