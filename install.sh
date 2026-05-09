#!/usr/bin/env bash
# Install / update Job Shooter on the server.
# Usage:  ./install.sh <ssh-host>
# Example: ./install.sh do
#
# Requires locally: node, npm
# Requires on server: pm2  (install once with: npm install -g pm2)

set -euo pipefail

HOST=${1:?Usage: ./install.sh <ssh-host>}
REMOTE_DIR=/root/jobshooter

echo "==> Building app"
npm ci --silent
VITE_SCORES_API="https://logit-xams.nl/jobshooter-scores" npm run build

echo "==> Syncing dist/ to ${HOST}:${REMOTE_DIR}"
ssh "$HOST" "mkdir -p ${REMOTE_DIR}"
rsync -az --delete dist/ "${HOST}:${REMOTE_DIR}/"

echo "==> Syncing scores server to ${HOST}:${REMOTE_DIR}/server"
rsync -az server/ "${HOST}:${REMOTE_DIR}/server/"

echo "==> Starting / restarting scores API on server"
ssh "$HOST" "
  if ! command -v pm2 &>/dev/null; then
    echo 'Installing pm2...'
    npm install -g pm2
  fi
  cd ${REMOTE_DIR}
  if pm2 list | grep -q jobshooter-scores; then
    pm2 restart jobshooter-scores
  else
    pm2 start server/index.mjs --name jobshooter-scores && pm2 save
  fi
"

echo ""
echo "Done."
echo "  Game:   https://logit-xams.nl/jobshooter/"
echo "  Scores: https://logit-xams.nl/jobshooter-scores/scores"
