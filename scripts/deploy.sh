#!/usr/bin/env bash
set -euo pipefail

# deploy.sh - simple deploy helper for Ubuntu Server
# Usage:
#   ./scripts/deploy.sh [pull|build]
#   - pull : pull images from registry (default if REGISTRY is set)
#   - build: build images on the server (requires source present)

COMPOSE_FILE="docker-compose.prod.yml"
WORKDIR="/opt/jiraboard"

MODE="pull"
if [[ ${1-} == "build" ]]; then
  MODE="build"
fi

echo "Deploy mode: $MODE"

cd "$WORKDIR"

# Ensure docker/compose exist
if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found. Install docker first." >&2
  exit 1
fi

echo "Stopping any existing compose-managed services..."
if systemctl is-active --quiet jiraboard.service; then
  echo "Stopping systemd jiraboard.service"
  sudo systemctl stop jiraboard.service || true
fi

echo "Bringing down current compose stack (if any)..."
docker compose -f "$COMPOSE_FILE" down || true

if [[ "$MODE" == "pull" ]]; then
  echo "Pulling images from registry (if images configured in compose)..."
  docker compose -f "$COMPOSE_FILE" pull || true
else
  echo "Building images on server..."
  docker compose -f "$COMPOSE_FILE" build --pull
fi

echo "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Running database migrations (Prisma)..."
# allow a short wait for DB to become healthy
echo "Waiting 5 seconds for DB to accept connections..."
sleep 5
docker compose -f "$COMPOSE_FILE" run --rm api npx prisma migrate deploy || {
  echo "Migration command failed. Check logs." >&2
}

echo "Enabling and starting systemd service to auto-start on reboot..."
if [[ -f "/etc/systemd/system/jiraboard.service" ]]; then
  sudo systemctl daemon-reload
  sudo systemctl enable --now jiraboard.service
fi

echo "Deployment finished. Showing status and last logs for api:"
docker compose -f "$COMPOSE_FILE" ps
docker compose -f "$COMPOSE_FILE" logs --tail=200 api || true

echo "Done."
