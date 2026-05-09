import Phaser from 'phaser';
import { TEX } from '../textures';
import { PLAYER } from '../config';
import { defaultStats, PlayerStats } from '../PlayerStats';
import { BulletGroup } from './Bullet';
import { BombGroup, BombExplodeFn } from './Bomb';
import { EnemyGroup } from './Enemy';
import { profileFor } from '../weapons';

const ROTATE_SPEED = 4.5;

export class Player extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats = defaultStats();
  private enemies?: EnemyGroup;
  private lastFireAt = 0;
  private lastBombAt = 0;
  private invulnUntil = 0;
  private regenAccum = 0;
  private aimHeading = -Math.PI / 2;
  private pointerMoved = false;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    q: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(PLAYER.radius, this.width / 2 - PLAYER.radius, this.height / 2 - PLAYER.radius);
    body.setCollideWorldBounds(true);
    this.setDepth(10);
    this.installInput();
  }

  private installInput(): void {
    const kb = this.scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      q: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      e: kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
    this.scene.input.on('pointermove', () => {
      this.pointerMoved = true;
    });
    this.scene.input.on('pointerdown', () => {
      this.pointerMoved = true;
    });

    kb.addCapture(['TAB', 'ONE', 'TWO', 'THREE', 'FOUR']);
    kb.on('keydown-ONE', () => this.equipByIndex(0));
    kb.on('keydown-TWO', () => this.equipByIndex(1));
    kb.on('keydown-THREE', () => this.equipByIndex(2));
    kb.on('keydown-FOUR', () => this.equipByIndex(3));
    kb.on('keydown-TAB', () => this.cycleWeapon(1));
    this.scene.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (!this.scene.scene.isActive()) return;
      this.cycleWeapon(dy > 0 ? 1 : -1);
    });
  }

  private equipByIndex(i: number): void {
    if (!this.scene.scene.isActive()) return;
    const w = this.stats.ownedWeapons[i];
    if (w) this.stats.weaponType = w;
  }

  private cycleWeapon(dir: number): void {
    if (!this.scene.scene.isActive()) return;
    const list = this.stats.ownedWeapons;
    if (list.length < 2) return;
    const i = list.indexOf(this.stats.weaponType);
    const n = list.length;
    const next = ((i + dir) % n + n) % n;
    this.stats.weaponType = list[next];
  }

  update(
    time: number,
    delta: number,
    bullets: BulletGroup,
    bombs: BombGroup,
    onExplode: BombExplodeFn,
  ): void {
    this.handleMove();
    this.handleAim(delta);
    this.handleFire(time, bullets);
    this.handleBomb(time, bombs, onExplode);
    this.handleRegen(delta);
  }

  private handleMove(): void {
    const k = this.keys;
    let vx = 0;
    let vy = 0;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;
    const len = Math.hypot(vx, vy);
    if (len > 0) {
      vx /= len;
      vy /= len;
    }
    this.setVelocity(vx * this.stats.speed, vy * this.stats.speed);
  }

  private handleAim(delta: number): void {
    const k = this.keys;
    const manualRotate = k.q.isDown || k.e.isDown;
    if (manualRotate) {
      const dir = (k.e.isDown ? 1 : 0) - (k.q.isDown ? 1 : 0);
      this.aimHeading += dir * ROTATE_SPEED * (delta / 1000);
    } else if (this.pointerMoved) {
      const p = this.scene.input.activePointer;
      const cam = this.scene.cameras.main;
      const wx = p.worldX || p.x + cam.scrollX;
      const wy = p.worldY || p.y + cam.scrollY;
      this.aimHeading = Math.atan2(wy - this.y, wx - this.x);
    }
    this.setRotation(this.aimHeading + Math.PI / 2);
  }

  getAimHeading(): number {
    return this.aimHeading;
  }

  setEnemies(enemies: EnemyGroup): void {
    this.enemies = enemies;
  }

  private handleFire(time: number, bullets: BulletGroup): void {
    const prof = profileFor(this.stats);
    const interval = this.stats.fireRateMs * prof.fireRateMul;
    if (time < this.lastFireAt + interval) return;
    this.lastFireAt = time;

    const aim = this.aimHeading;
    const count = Math.max(1, this.stats.bulletCount + prof.countDelta);
    const spread = this.stats.bulletSpread * prof.spreadMul;
    const start = aim - (spread * (count - 1)) / 2;

    const enemies = this.enemies;
    const findTarget = prof.homing && enemies
      ? (bx: number, by: number) => enemies.findNearest(bx, by)
      : undefined;

    for (let i = 0; i < count; i++) {
      const a = count === 1 ? aim : start + spread * i;
      bullets.spawn({
        x: this.x + Math.cos(a) * 20,
        y: this.y + Math.sin(a) * 20,
        angle: a,
        speed: this.stats.bulletSpeed * prof.speedMul,
        damage: Math.round(this.stats.bulletDamage * prof.damageMul),
        pierce: this.stats.pierce + prof.pierceBonus,
        fromPlayer: true,
        texKey: prof.texKey,
        scale: prof.scale,
        bodyRadius: prof.bodyRadius,
        homing: prof.homing,
        turnRate: prof.turnRate,
        findTarget,
      });
    }
  }

  private handleBomb(time: number, bombs: BombGroup, onExplode: BombExplodeFn): void {
    if (!this.stats.bombEnabled) return;
    if (time < this.lastBombAt + this.stats.bombCooldownMs) return;
    this.lastBombAt = time;
    const a = this.aimHeading;
    bombs.spawn({
      x: this.x + Math.cos(a) * 22,
      y: this.y + Math.sin(a) * 22,
      angle: a,
      speed: this.stats.bombSpeed,
      damage: this.stats.bombDamage,
      radius: this.stats.bombRadius,
      fuseMs: this.stats.bombFuseMs,
      onExplode,
    });
  }

  bombCooldownRatio(time: number): number {
    if (!this.stats.bombEnabled) return 0;
    const elapsed = time - this.lastBombAt;
    return Phaser.Math.Clamp(elapsed / this.stats.bombCooldownMs, 0, 1);
  }

  private handleRegen(delta: number): void {
    if (this.stats.regenPerSec <= 0 || this.stats.hp >= this.stats.maxHp) return;
    this.regenAccum += (this.stats.regenPerSec * delta) / 1000;
    if (this.regenAccum >= 1) {
      const heal = Math.floor(this.regenAccum);
      this.regenAccum -= heal;
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + heal);
    }
  }

  takeDamage(amount: number, time: number): boolean {
    if (time < this.invulnUntil) return false;
    this.stats.hp -= amount;
    this.invulnUntil = time + PLAYER.invulnMs;
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.2, to: 1 },
      duration: PLAYER.invulnMs,
      ease: 'Sine.easeOut',
    });
    return true;
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }

  fullHeal(): void {
    this.stats.hp = this.stats.maxHp;
  }
}
