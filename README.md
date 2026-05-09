# Job Shooter

Browser arcade space shooter. Phaser 3 + TypeScript + Vite. Placeholder shapes only.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Controls

- Move: `WASD` or arrow keys
- Aim: mouse / touch
- Fire: hold left mouse / touch / `Space`
- Pick upgrade: click card or `1` / `2` / `3`
- Restart on game over: click or `Space`

## Gameplay

- Aliens spawn from screen edges in waves and chase you.
- Shoot them. Each kill drops a coin (auto-collected on contact, plus full sweep at wave end).
- After every wave, pick 1 of 3 random upgrades. Player heals to full.
- Difficulty: each wave adds enemy count, HP, and speed.

## Code layout

```
src/
  main.ts                  Phaser bootstrap
  config.ts                tunables
  textures.ts              runtime placeholder shape textures
  PlayerStats.ts           stat shape + defaults
  entities/
    Player.ts              ship, input, firing
    Enemy.ts               chaser + group
    Bullet.ts              pooled bullets (player + enemy capable)
    Coin.ts                pickup
  managers/
    WaveManager.ts         wave spawning + state machine
    UpgradeManager.ts      upgrade pool + picker
  scenes/
    GameScene.ts           main loop, collisions, HUD
    UpgradeScene.ts        between-wave upgrade picker
```
