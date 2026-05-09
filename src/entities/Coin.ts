import Phaser from 'phaser';
import { TEX } from '../textures';

export class Coin extends Phaser.Physics.Arcade.Sprite {
  value = 1;
  private bornAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.coin);
  }

  spawn(x: number, y: number, value: number): void {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.value = value;
    this.bornAt = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(7);
    body.setDrag(120, 120);
    const ang = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 40;
    this.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (time - this.bornAt > 12000) this.kill();
  }
}

export class CoinGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    super(scene.physics.world, scene, {
      classType: Coin,
      maxSize: 256,
      runChildUpdate: true,
    });
  }

  drop(x: number, y: number, value: number): Coin | null {
    const c = this.get(x, y) as Coin | null;
    if (!c) return null;
    c.spawn(x, y, value);
    return c;
  }
}
