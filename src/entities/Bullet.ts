import Phaser from 'phaser';
import { TEX } from '../textures';

export type FindTargetFn = (x: number, y: number) => { x: number; y: number } | null;

export interface BulletFireOpts {
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  pierce: number;
  fromPlayer: boolean;
  texKey?: string;
  scale?: number;
  bodyRadius?: number;
  homing?: boolean;
  turnRate?: number;
  findTarget?: FindTargetFn;
}

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage = 10;
  pierce = 0;
  fromPlayer = true;
  homing = false;
  turnRate = 0;
  findTarget?: FindTargetFn;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.bullet);
  }

  fire(opts: BulletFireOpts): void {
    this.fromPlayer = opts.fromPlayer;
    this.damage = opts.damage;
    this.pierce = opts.pierce;
    this.homing = opts.homing ?? false;
    this.turnRate = opts.turnRate ?? 0;
    this.findTarget = opts.findTarget;
    const tex = opts.texKey ?? (opts.fromPlayer ? TEX.bullet : TEX.enemyBullet);
    this.setTexture(tex);
    this.enableBody(true, opts.x, opts.y, true, true);
    this.setActive(true).setVisible(true);
    this.setRotation(opts.angle - Math.PI / 2);
    this.setScale(opts.scale ?? 1);
    const vx = Math.cos(opts.angle) * opts.speed;
    const vy = Math.sin(opts.angle) * opts.speed;
    this.setVelocity(vx, vy);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const r = opts.bodyRadius ?? (this.fromPlayer ? 3 : 4);
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);
  }

  kill(): void {
    this.findTarget = undefined;
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.active && this.homing && this.findTarget) {
      const t = this.findTarget(this.x, this.y);
      if (t) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const cur = Math.atan2(body.velocity.y, body.velocity.x);
        const desired = Math.atan2(t.y - this.y, t.x - this.x);
        const diff = Phaser.Math.Angle.Wrap(desired - cur);
        const max = (this.turnRate * delta) / 1000;
        const step = Phaser.Math.Clamp(diff, -max, max);
        const speed = body.velocity.length();
        const next = cur + step;
        body.setVelocity(Math.cos(next) * speed, Math.sin(next) * speed);
        this.setRotation(next - Math.PI / 2);
      }
    }
    const cam = this.scene.cameras.main;
    if (
      this.x < -20 ||
      this.x > cam.width + 20 ||
      this.y < -20 ||
      this.y > cam.height + 20
    ) {
      this.kill();
    }
  }
}

export class BulletGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    super(scene.physics.world, scene, {
      classType: Bullet,
      maxSize: 256,
      runChildUpdate: true,
    });
  }

  spawn(opts: BulletFireOpts): Bullet | null {
    const b = this.get(opts.x, opts.y) as Bullet | null;
    if (!b) return null;
    b.fire(opts);
    return b;
  }
}
