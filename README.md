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

## Why Docker (or not)?

For the **frontend alone**, Docker is overkill — `dist/` works on any static host (GitHub Pages, Netlify, Vercel, S3, plain nginx, your home server). No reason to ship a container.

Docker pays off **once you add the score API**, because then you have two pieces (static frontend + Node service + persistent volume) and `docker-compose up` becomes the cleanest way to deploy the bundle on any Linux host.

Provided:

- `Dockerfile` — multi-stage build → nginx serves `dist/` on port 80.
- `server/Dockerfile` — Node API on port 3001, mounts `/data` for persistence.
- `docker-compose.yml` — both together (web on `:8080`, api on `:3001`).

Run:

```bash
docker compose up --build
# game on http://localhost:8080
```

Override the API URL baked into the frontend bundle:

```bash
docker compose build --build-arg VITE_SCORES_API=https://scores.example.com
```

If you only want static hosting (no global high scores), skip Docker entirely — just `npm run build` and copy `dist/` to your web root.
