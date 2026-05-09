import Phaser from 'phaser';
import { TEX } from '../textures';
import { ENEMY } from '../config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = ENEMY.baseHp;
  maxHp = ENEMY.baseHp;
  speed = ENEMY.baseSpeed;
  damage = ENEMY.baseDamage;
  coinValue = ENEMY.coinDrop;
  lastContactAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.enemy);
  }

  spawn(opts: { x: number; y: number; hp: number; speed: number; damage: number; coinValue: number }): void {
    this.enableBody(true, opts.x, opts.y, true, true);
    this.setActive(true).setVisible(true);
    this.hp = opts.hp;
    this.maxHp = opts.hp;
    this.speed = opts.speed;
    this.damage = opts.damage;
    this.coinValue = opts.coinValue;
    this.lastContactAt = 0;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(ENEMY.radius, this.width / 2 - ENEMY.radius, this.height / 2 - ENEMY.radius);
    this.setTint(0xffffff);
  }

  hit(damage: number): boolean {
    this.hp -= damage;
    this.setTint(0xffaaaa);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.setTint(0xffffff);
    });
    if (this.hp <= 0) {
      this.kill();
      return true;
    }
    return false;
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }

  trackTarget(targetX: number, targetY: number): void {
    if (!this.active) return;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.setVelocity((dx / len) * this.speed, (dy / len) * this.speed);
    this.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
  }
}

export class EnemyGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    super(scene.physics.world, scene, {
      classType: Enemy,
      maxSize: 128,
      runChildUpdate: false,
    });
  }

  spawnAt(opts: { x: number; y: number; hp: number; speed: number; damage: number; coinValue: number }): Enemy | null {
    const e = this.get(opts.x, opts.y) as Enemy | null;
    if (!e) return null;
    e.spawn(opts);
    return e;
  }

  countAlive(): number {
    let n = 0;
    this.children.each((c) => {
      if ((c as Enemy).active) n++;
      return true;
    });
    return n;
  }

  trackAll(x: number, y: number): void {
    this.children.each((c) => {
      const e = c as Enemy;
      if (e.active) e.trackTarget(x, y);
      return true;
    });
  }

  findNearest(x: number, y: number): { x: number; y: number } | null {
    let bx = 0;
    let by = 0;
    let bestD = Infinity;
    let found = false;
    this.children.each((c) => {
      const e = c as Enemy;
      if (!e.active) return true;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        bx = e.x;
        by = e.y;
        found = true;
      }
      return true;
    });
    return found ? { x: bx, y: by } : null;
  }
}
