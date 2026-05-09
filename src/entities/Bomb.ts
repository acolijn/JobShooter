import Phaser from 'phaser';
import { TEX } from '../textures';

export type BombExplodeFn = (x: number, y: number, radius: number, damage: number) => void;

export class Bomb extends Phaser.Physics.Arcade.Sprite {
  damage = 60;
  radius = 100;
  fuseAt = 0;
  onExplode?: BombExplodeFn;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.bomb);
  }

  fire(opts: {
    x: number;
    y: number;
    angle: number;
    speed: number;
    damage: number;
    radius: number;
    fuseMs: number;
    onExplode: BombExplodeFn;
  }): void {
    this.enableBody(true, opts.x, opts.y, true, true);
    this.setActive(true).setVisible(true);
    this.damage = opts.damage;
    this.radius = opts.radius;
    this.fuseAt = this.scene.time.now + opts.fuseMs;
    this.onExplode = opts.onExplode;
    this.setRotation(opts.angle);
    this.setScale(1);
    this.setVelocity(Math.cos(opts.angle) * opts.speed, Math.sin(opts.angle) * opts.speed);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(8, this.width / 2 - 8, this.height / 2 - 8);
    body.setDrag(80, 80);
    this.scene.tweens.add({
      targets: this,
      angle: { from: 0, to: 360 },
      duration: 600,
      repeat: -1,
    });
  }

  explode(): void {
    if (!this.active) return;
    const x = this.x;
    const y = this.y;
    const r = this.radius;
    const dmg = this.damage;
    this.kill();
    this.onExplode?.(x, y, r, dmg);
  }

  kill(): void {
    this.scene.tweens.killTweensOf(this);
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (time >= this.fuseAt) this.explode();
  }
}

export class BombGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    super(scene.physics.world, scene, {
      classType: Bomb,
      maxSize: 32,
      runChildUpdate: true,
    });
  }

  spawn(opts: {
    x: number;
    y: number;
    angle: number;
    speed: number;
    damage: number;
    radius: number;
    fuseMs: number;
    onExplode: BombExplodeFn;
  }): Bomb | null {
    const b = this.get(opts.x, opts.y) as Bomb | null;
    if (!b) return null;
    b.fire(opts);
    return b;
  }
}
