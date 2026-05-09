import Phaser from 'phaser';

export const TEX = {
  player: 'tex_player',
  enemy: 'tex_enemy',
  enemyRunner: 'tex_enemy_runner',
  enemyTank: 'tex_enemy_tank',
  enemyShooter: 'tex_enemy_shooter',
  enemyBoss: 'tex_enemy_boss',
  bullet: 'tex_bullet',
  laser: 'tex_laser',
  plasma: 'tex_plasma',
  enemyBullet: 'tex_enemy_bullet',
  coin: 'tex_coin',
  bomb: 'tex_bomb',
  missile: 'tex_missile',
} as const;

export function generateTextures(scene: Phaser.Scene): void {
  makePlayer(scene);
  makeEnemy(scene);
  makeEnemyRunner(scene);
  makeEnemyTank(scene);
  makeEnemyShooter(scene);
  makeEnemyBoss(scene);
  makeBullet(scene, TEX.bullet, 0x9ef7ff, 4, 14);
  makeBullet(scene, TEX.laser, 0x66ff88, 3, 22);
  makePlasma(scene);
  makeBullet(scene, TEX.enemyBullet, 0xff6b6b, 5, 5);
  makeCoin(scene);
  makeBomb(scene);
  makeMissile(scene);
}

function makePlayer(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.player)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x4cd7ff, 1);
  g.beginPath();
  g.moveTo(20, 0);
  g.lineTo(0, 36);
  g.lineTo(40, 36);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xffffff, 1);
  g.fillRect(18, 14, 4, 12);
  g.lineStyle(2, 0x0a2a3a, 1);
  g.strokePath();
  g.generateTexture(TEX.player, 40, 36);
  g.destroy();
}

function makeEnemy(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.enemy)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xe14b4b, 1);
  g.fillRect(2, 2, 32, 32);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(11, 14, 3);
  g.fillCircle(25, 14, 3);
  g.fillStyle(0x000000, 1);
  g.fillCircle(11, 14, 1.5);
  g.fillCircle(25, 14, 1.5);
  g.fillStyle(0x2a0000, 1);
  g.fillRect(8, 24, 20, 3);
  g.generateTexture(TEX.enemy, 36, 36);
  g.destroy();
}

function makeBullet(scene: Phaser.Scene, key: string, color: number, w: number, h: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRoundedRect(0, 0, w, h, Math.min(w, h) / 2);
  g.generateTexture(key, w, h);
  g.destroy();
}

function makeEnemyRunner(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.enemyRunner)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xff66aa, 1);
  g.fillTriangle(14, 0, 0, 24, 28, 24);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(10, 14, 2);
  g.fillCircle(18, 14, 2);
  g.generateTexture(TEX.enemyRunner, 28, 28);
  g.destroy();
}

function makeEnemyTank(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.enemyTank)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x447733, 1);
  g.fillRect(0, 0, 48, 48);
  g.lineStyle(3, 0x88ff88, 1);
  g.strokeRect(2, 2, 44, 44);
  g.fillStyle(0x222233, 1);
  g.fillRect(8, 12, 32, 8);
  g.fillRect(8, 28, 32, 8);
  g.fillStyle(0xff4444, 1);
  g.fillRect(20, 20, 8, 8);
  g.generateTexture(TEX.enemyTank, 48, 48);
  g.destroy();
}

function makeEnemyShooter(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.enemyShooter)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x3388dd, 1);
  g.fillCircle(18, 18, 16);
  g.fillStyle(0x88ddff, 1);
  g.fillCircle(18, 18, 10);
  g.fillStyle(0x000022, 1);
  g.fillCircle(18, 18, 5);
  g.fillStyle(0xffaa00, 1);
  g.fillRect(16, 0, 4, 8);
  g.fillRect(16, 28, 4, 8);
  g.generateTexture(TEX.enemyShooter, 36, 36);
  g.destroy();
}

function makeEnemyBoss(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.enemyBoss)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x661144, 1);
  g.fillCircle(40, 40, 38);
  g.fillStyle(0xff3366, 1);
  g.fillCircle(40, 40, 30);
  g.fillStyle(0x220011, 1);
  g.fillCircle(28, 34, 6);
  g.fillCircle(52, 34, 6);
  g.fillStyle(0xff8800, 1);
  g.fillCircle(28, 34, 3);
  g.fillCircle(52, 34, 3);
  g.fillStyle(0x111111, 1);
  g.fillRect(20, 50, 40, 6);
  g.fillStyle(0xff3366, 1);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    g.fillTriangle(
      40 + Math.cos(ang) * 38,
      40 + Math.sin(ang) * 38,
      40 + Math.cos(ang + 0.2) * 46,
      40 + Math.sin(ang + 0.2) * 46,
      40 + Math.cos(ang - 0.2) * 46,
      40 + Math.sin(ang - 0.2) * 46,
    );
  }
  g.generateTexture(TEX.enemyBoss, 80, 80);
  g.destroy();
}

function makePlasma(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.plasma)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(10, 10, 4);
  g.fillStyle(0xff66ff, 0.9);
  g.fillCircle(10, 10, 8);
  g.fillStyle(0xaa00aa, 0.5);
  g.fillCircle(10, 10, 10);
  g.generateTexture(TEX.plasma, 20, 20);
  g.destroy();
}

function makeBomb(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.bomb)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x202028, 1);
  g.fillCircle(10, 10, 8);
  g.fillStyle(0xff8833, 1);
  g.fillCircle(10, 10, 3);
  g.lineStyle(2, 0x555560, 1);
  g.strokeCircle(10, 10, 8);
  g.generateTexture(TEX.bomb, 20, 20);
  g.destroy();
}

function makeMissile(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.missile)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffaa44, 1);
  g.fillTriangle(5, 0, 0, 5, 10, 5);
  g.fillStyle(0xdddddd, 1);
  g.fillRect(2, 5, 6, 11);
  g.fillStyle(0xff5522, 1);
  g.fillTriangle(5, 22, 1, 16, 9, 16);
  g.fillStyle(0xffee88, 1);
  g.fillTriangle(5, 19, 3, 16, 7, 16);
  g.generateTexture(TEX.missile, 10, 22);
  g.destroy();
}

function makeCoin(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.coin)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffd23f, 1);
  g.fillCircle(8, 8, 7);
  g.fillStyle(0xa07a00, 1);
  g.fillCircle(8, 8, 3);
  g.generateTexture(TEX.coin, 16, 16);
  g.destroy();
}
