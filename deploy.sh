#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but not installed." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required but not available." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo ".env not found. Copy .env.example to .env and fill in the values first." >&2
  exit 1
fi

cd "${ROOT_DIR}"

docker compose --env-file "${ENV_FILE}" up -d --build

echo "Deployment completed."
echo "Use 'docker compose ps' to inspect containers."
echo "Use 'docker compose logs -f app' to stream app logs."
