export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 720;

export const PLAYER = {
  speed: 320,
  radius: 16,
  maxHp: 100,
  fireRateMs: 280,
  bulletSpeed: 700,
  bulletDamage: 10,
  invulnMs: 600,
};

export const ENEMY = {
  baseHp: 20,
  baseSpeed: 90,
  baseDamage: 10,
  contactCooldownMs: 600,
  radius: 16,
  coinDrop: 1,
};

export const WAVE = {
  baseCount: 6,
  countPerWave: 3,
  hpPerWave: 6,
  speedPerWave: 8,
  spawnIntervalMs: 700,
  interWaveDelayMs: 1200,
};
