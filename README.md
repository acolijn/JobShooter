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
  index.mjs                zero-dep Node high-score API (port 3001)
deploy/
  nginx-snippet.conf       nginx blocks to add to the server config
install.sh                 build + deploy script
```

## Server installation

Requires: **Node**, **npm**, **pm2** (`npm install -g pm2`), and **nginx** already running on the server.

### 1. Clone the repo on the server

```bash
git clone https://github.com/acolijn/JobShooter /root/jobshooter
cd /root/jobshooter
```

### 2. Add the nginx config

Append the contents of [`deploy/nginx-snippet.conf`](deploy/nginx-snippet.conf) to your existing nginx server block (before the `listen 443 ssl;` line), then reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

This adds:
- `https://logit-xams.nl/jobshooter/` — game (static files served by nginx)
- `https://logit-xams.nl/jobshooter-scores/` — scores API (proxied from localhost:3001)

### 3. Build and deploy

From your **local machine**, run:

```bash
./install.sh do   # 'do' = your SSH host alias, or use user@ip
```

This will:
1. Build the frontend with the correct API URL baked in
2. Rsync `dist/` to `/root/jobshooter/` on the server
3. Rsync `server/` to `/root/jobshooter/server/` on the server
4. Start (or restart) the scores API with pm2

### 4. Updates

Same command:

```bash
./install.sh do
```

pm2 keeps the API running across reboots. After first install, run on the server:

```bash
pm2 startup   # follow the printed command
pm2 save
```
