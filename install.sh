#!/usr/bin/env bash
# Install / update Job Shooter on the server.
# Usage:  ./install.sh <server-address>
# Example: ./install.sh 192.168.1.100
#
# Requires: node, npm, pm2  (install pm2 once with: npm install -g pm2)

set -euo pipefail

SERVER=${1:?Usage: ./install.sh <server-address>}

echo "==> Building app (API at http://${SERVER}:5176)"
VITE_SCORES_API="http://${SERVER}:5176" npm ci --silent
VITE_SCORES_API="http://${SERVER}:5176" npm run build

echo "==> Starting / restarting scores API"
if pm2 list | grep -q jobshooter-scores; then
    pm2 restart jobshooter-scores
else
    pm2 start server/index.mjs --name jobshooter-scores
    pm2 save
fi

echo ""
echo "Done. Game served from dist/ on port 5175 (via nginx)."
echo "Scores API running on internal port 3001, exposed via nginx on port 5176."
