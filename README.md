# Job Shooter

Browser arcade space shooter. Phaser 3 + TypeScript + Vite. Placeholder shapes only.

## Run

```bash
npm install
npm run dev      # dev server on port 5175 (rolls forward if taken)
```

Build / preview:

```bash
npm run build
npm run preview  # static preview on port 5176
```

Optional high-score API:

```bash
npm run server   # node http server on :3001, persists JSON
```

Point the frontend at the API by setting `VITE_SCORES_API` at build time:

```bash
VITE_SCORES_API=http://your-host:3001 npm run build
```

When set, the game POSTs scores to that URL and reads the global leaderboard on game-over. Without it, scores fall back to `localStorage` (per-browser).

## Controls

- Move: `WASD` / arrows
- Aim: mouse / touch
- Rotate: `Q` / `E`
- Fire: auto
- Bombs: auto when unlocked
- Switch weapon: `1` / `2` / `3` / `4`, `Tab`, mouse wheel
- Upgrade: click card or `1` / `2` / `3`, `S` / `0` to skip
- `H` toggles help panel

## Gameplay

- Waves of enemies: grunts, runners, tanks, shooters. After last minion dies, **boss** spawns.
- Coins drop on kill, auto-collected on contact + swept at wave end.
- Between waves: pick from 3 upgrades. Each costs coins. Skip is free. Player heals on every wave clear.
- Game over: top-10 board shown. Qualifying scores prompt for a name.

Score = `wavesCleared * 100 + totalCoinsEarned`.

## Code layout

```
src/
  main.ts                  Phaser bootstrap
  config.ts                tunables
  textures.ts              runtime placeholder shape textures
  weapons.ts               weapon profiles (bullet/laser/plasma/seeker)
  HighScores.ts            local + remote score storage
  PlayerStats.ts           stat shape + defaults
  entities/
    Player.ts              ship, input, weapon switching, firing, bombs
    Enemy.ts               type-driven AI, per-enemy variation, boss
    Bullet.ts              pooled bullets w/ optional homing
    Bomb.ts                AOE projectile, fuse + on-hit explode
    Coin.ts                pickup
  managers/
    WaveManager.ts         minion queue + boss-after-clear flow
    UpgradeManager.ts      cost-gated upgrade pool, kind filtering
  scenes/
    GameScene.ts           main loop, collisions, HUD, boss bar, game-over
    UpgradeScene.ts        between-wave shop with cost + skip
server/
  index.mjs                zero-dep Node high-score API
  Dockerfile               container for the API
Dockerfile                 multi-stage build → nginx static
docker-compose.yml         web + scores together
```

## Where does the deployed code run?

The game is **client-side**. `npm run build` outputs static `dist/` (HTML + JS bundle). Any static host serves it; Phaser runs in the browser via Canvas/WebGL. No server runtime required for gameplay.

The optional `server/` API is the only piece that needs Node. It stores high scores in a JSON file (`./data/scores.json` by default).

## Deploy with global high scores

The score API URL is baked into the frontend bundle at build time via `VITE_SCORES_API`. Without it, the game falls back to per-browser `localStorage`. To get a shared leaderboard you need to run **both** the static frontend AND the Node API, with `VITE_SCORES_API` pointing at the API URL.

### Path A — Docker compose on a VPS (simplest)

On a Linux box with Docker installed:

```bash
git clone <your repo> jobshooter
cd jobshooter
# point the bundle at where your API will be reachable from the player's browser
echo "VITE_SCORES_API=https://api.your-domain.com" > .env
docker compose up --build -d
```

`docker-compose.yml` brings up:

- `web` — nginx serving the built `dist/` on host port `8080`
- `scores` — Node API on host port `3001`, persisting `data/scores.json` in a named volume

Put a reverse proxy (Caddy / nginx / Traefik) in front to terminate TLS and route:

- `your-domain.com` → `localhost:8080`
- `api.your-domain.com` → `localhost:3001`

The `VITE_SCORES_API` value is the URL the **player's browser** uses to reach the API, not the internal Docker hostname.

### Path B — static host + small API server

Cheaper for a hobby deploy:

1. Frontend on any static host (GitHub Pages, Netlify, Vercel, S3, your shared hosting).

   ```bash
   VITE_SCORES_API=https://api.example.com npm run build
   # upload dist/ contents
   ```

2. API on a small VPS / Pi / Fly.io / Render free tier.

   ```bash
   PORT=3001 DATA_FILE=./data/scores.json npm run server
   ```

   Use systemd / pm2 to keep it alive, and a reverse proxy for HTTPS + CORS (the API already sets permissive CORS headers; tighten in production).

### Path C — static only, no global scores

Skip the API entirely. Scores live in each player's browser via `localStorage`. Just `npm run build` + upload `dist/`.

## Why Docker?

For the **frontend alone**, Docker is overkill — `dist/` is static files. Any web host serves it.

Docker pays off **once you add the score API**, because then you have two services + a persistent volume and `docker compose up` is the cleanest one-liner deploy. The provided files:

- `Dockerfile` — multi-stage Node build → nginx static on `:80`
- `server/Dockerfile` — Node API on `:3001`, `/data` volume
- `docker-compose.yml` — both together

So: skip Docker if static-only; use Docker once you want shared high scores.
