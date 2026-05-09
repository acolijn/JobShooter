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
  lightning: 'tex_lightning',
  turd: 'tex_turd',
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
  makeLightning(scene);
  makeTurd(scene);
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
  // Grunt: compact wedge-shaped alien fighter
  if (scene.textures.exists(TEX.enemy)) return;
  const g = scene.add.graphics();
  // Main hull
  g.fillStyle(0xcc2222, 1);
  g.beginPath();
  g.moveTo(18, 0);
  g.lineTo(36, 28);
  g.lineTo(28, 22);
  g.lineTo(18, 36);
  g.lineTo(8, 22);
  g.lineTo(0, 28);
  g.closePath();
  g.fillPath();
  // Cockpit
  g.fillStyle(0xff6666, 1);
  g.fillTriangle(18, 4, 10, 20, 26, 20);
  // Engine glow
  g.fillStyle(0xff4400, 1);
  g.fillRect(10, 26, 6, 5);
  g.fillRect(20, 26, 6, 5);
  g.fillStyle(0xffaa44, 0.8);
  g.fillRect(11, 29, 4, 3);
  g.fillRect(21, 29, 4, 3);
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
  // Runner: slim dart-shaped fast ship
  if (scene.textures.exists(TEX.enemyRunner)) return;
  const g = scene.add.graphics();
  // Sleek narrow hull
  g.fillStyle(0xdd2288, 1);
  g.beginPath();
  g.moveTo(14, 0);
  g.lineTo(22, 8);
  g.lineTo(20, 28);
  g.lineTo(14, 24);
  g.lineTo(8, 28);
  g.lineTo(6, 8);
  g.closePath();
  g.fillPath();
  // Swept wings
  g.fillStyle(0xaa1166, 1);
  g.fillTriangle(6, 10, 0, 26, 10, 20);
  g.fillTriangle(22, 10, 28, 26, 18, 20);
  // Engine streak
  g.fillStyle(0xff88cc, 1);
  g.fillRect(11, 2, 6, 10);
  g.fillStyle(0xffccee, 0.7);
  g.fillRect(12, 22, 4, 6);
  g.generateTexture(TEX.enemyRunner, 28, 28);
  g.destroy();
}

function makeEnemyTank(scene: Phaser.Scene): void {
  // Tank: wide heavy armored cruiser
  if (scene.textures.exists(TEX.enemyTank)) return;
  const g = scene.add.graphics();
  // Wide hull body
  g.fillStyle(0x336622, 1);
  g.fillRect(4, 8, 40, 32);
  // Armored side wings
  g.fillStyle(0x224411, 1);
  g.fillRect(0, 14, 6, 20);
  g.fillRect(42, 14, 6, 20);
  // Top ridge
  g.fillStyle(0x558833, 1);
  g.fillRect(8, 4, 32, 10);
  // Nose
  g.fillStyle(0x44aa33, 1);
  g.fillTriangle(24, 0, 10, 8, 38, 8);
  // Dual cannons
  g.fillStyle(0x88ff44, 1);
  g.fillRect(10, 0, 5, 8);
  g.fillRect(33, 0, 5, 8);
  // Engine glow (back)
  g.fillStyle(0xff6600, 1);
  g.fillRect(10, 36, 8, 8);
  g.fillRect(30, 36, 8, 8);
  g.fillStyle(0xffcc44, 0.8);
  g.fillRect(12, 38, 4, 5);
  g.fillRect(32, 38, 4, 5);
  g.generateTexture(TEX.enemyTank, 48, 48);
  g.destroy();
}

function makeEnemyShooter(scene: Phaser.Scene): void {
  // Shooter: saucer-style ship with visible gun
  if (scene.textures.exists(TEX.enemyShooter)) return;
  const g = scene.add.graphics();
  // Saucer body
  g.fillStyle(0x1155cc, 1);
  g.fillEllipse(18, 20, 36, 18);
  // Top dome
  g.fillStyle(0x3388ff, 1);
  g.fillEllipse(18, 14, 22, 14);
  // Cockpit glass
  g.fillStyle(0x88ccff, 0.9);
  g.fillEllipse(18, 13, 12, 8);
  // Central gun barrel
  g.fillStyle(0x6699ff, 1);
  g.fillRect(15, 2, 6, 10);
  g.fillStyle(0x99bbff, 1);
  g.fillRect(16, 0, 4, 4);
  // Engine ring
  g.fillStyle(0x0033aa, 1);
  g.fillEllipse(18, 24, 28, 8);
  g.fillStyle(0x4466ff, 0.6);
  g.fillEllipse(18, 26, 20, 5);
  g.generateTexture(TEX.enemyShooter, 36, 36);
  g.destroy();
}

function makeEnemyBoss(scene: Phaser.Scene): void {
  // Boss: massive dreadnought with swept wings and triple cannon
  if (scene.textures.exists(TEX.enemyBoss)) return;
  const g = scene.add.graphics();
  // Main hull
  g.fillStyle(0x550033, 1);
  g.beginPath();
  g.moveTo(40, 0);
  g.lineTo(56, 20);
  g.lineTo(72, 60);
  g.lineTo(56, 52);
  g.lineTo(40, 80);
  g.lineTo(24, 52);
  g.lineTo(8, 60);
  g.lineTo(24, 20);
  g.closePath();
  g.fillPath();
  // Swept wings
  g.fillStyle(0x880044, 1);
  g.fillTriangle(24, 24, 0, 60, 20, 44);
  g.fillTriangle(56, 24, 80, 60, 60, 44);
  // Wing stripe
  g.fillStyle(0xff2266, 1);
  g.fillTriangle(24, 28, 4, 56, 18, 42);
  g.fillTriangle(56, 28, 76, 56, 62, 42);
  // Center cockpit/bridge
  g.fillStyle(0xcc1155, 1);
  g.fillEllipse(40, 32, 28, 36);
  // Cockpit glass
  g.fillStyle(0xff4488, 1);
  g.fillEllipse(40, 28, 16, 18);
  g.fillStyle(0xff88aa, 0.5);
  g.fillEllipse(40, 26, 9, 10);
  // Triple cannons
  g.fillStyle(0xff3366, 1);
  g.fillRect(28, 0, 6, 16);
  g.fillRect(37, 0, 6, 20);
  g.fillRect(46, 0, 6, 16);
  g.fillStyle(0xff88bb, 1);
  g.fillRect(29, 0, 4, 4);
  g.fillRect(38, 0, 4, 6);
  g.fillRect(47, 0, 4, 4);
  // Engine exhausts (back)
  g.fillStyle(0x330022, 1);
  g.fillRect(24, 66, 10, 12);
  g.fillRect(46, 66, 10, 12);
  g.fillStyle(0xff4400, 1);
  g.fillRect(26, 68, 6, 8);
  g.fillRect(48, 68, 6, 8);
  g.fillStyle(0xffcc44, 0.9);
  g.fillRect(27, 70, 4, 5);
  g.fillRect(49, 70, 4, 5);
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

function makeLightning(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.lightning)) return;
  const g = scene.add.graphics();
  // White outer glow
  g.fillStyle(0xffffff, 0.35);
  g.fillRoundedRect(0, 0, 8, 20, 3);
  // Yellow bolt body (jagged lightning shape)
  g.fillStyle(0xffee22, 1);
  g.beginPath();
  g.moveTo(4, 0);
  g.lineTo(8, 9);
  g.lineTo(5, 9);
  g.lineTo(8, 20);
  g.lineTo(0, 11);
  g.lineTo(3, 11);
  g.lineTo(0, 0);
  g.closePath();
  g.fillPath();
  // White-hot core
  g.fillStyle(0xffffff, 0.85);
  g.beginPath();
  g.moveTo(3.5, 1);
  g.lineTo(6, 8);
  g.lineTo(4, 8);
  g.lineTo(6.5, 18);
  g.lineTo(1.5, 11);
  g.lineTo(3.5, 11);
  g.lineTo(1.5, 1);
  g.closePath();
  g.fillPath();
  g.generateTexture(TEX.lightning, 8, 20);
  g.destroy();
}

function makeTurd(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.turd)) return;
  const g = scene.add.graphics();
  // Dark brown base blob
  g.fillStyle(0x4a2209, 1);
  g.fillCircle(8, 11, 7);
  // Mid-tier coil
  g.fillCircle(8, 6, 5);
  // Top nub
  g.fillCircle(8, 2, 3);
  // Lighter brown sheen / highlight
  g.fillStyle(0x7a3d12, 1);
  g.fillCircle(6, 9, 3.5);
  g.fillCircle(6.5, 5, 2.5);
  // Pea-green stink spot
  g.fillStyle(0x66aa22, 0.7);
  g.fillCircle(11, 4, 1.5);
  g.fillCircle(3, 11, 1.2);
  g.generateTexture(TEX.turd, 16, 18);
  g.destroy();
}

