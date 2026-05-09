import Phaser from 'phaser';
import { ENEMY, WAVE } from '../config';
import { EnemyGroup } from '../entities/Enemy';

export type WaveState = 'idle' | 'spawning' | 'fighting' | 'cleared';

export interface WaveEvents {
  onWaveStart: (wave: number) => void;
  onWaveCleared: (wave: number) => void;
}

export class WaveManager {
  private scene: Phaser.Scene;
  private enemies: EnemyGroup;
  private events: WaveEvents;
  wave = 0;
  state: WaveState = 'idle';
  private toSpawn = 0;
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, enemies: EnemyGroup, events: WaveEvents) {
    this.scene = scene;
    this.enemies = enemies;
    this.events = events;
  }

  startNextWave(): void {
    this.wave += 1;
    this.state = 'spawning';
    this.toSpawn = WAVE.baseCount + WAVE.countPerWave * (this.wave - 1);
    this.events.onWaveStart(this.wave);
    this.spawnTimer?.remove(false);
    this.spawnTimer = this.scene.time.addEvent({
      delay: WAVE.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnOne(),
    });
  }

  private spawnOne(): void {
    if (this.toSpawn <= 0) {
      this.spawnTimer?.remove(false);
      this.state = 'fighting';
      return;
    }
    this.toSpawn -= 1;
    const cam = this.scene.cameras.main;
    const edge = Phaser.Math.Between(0, 3);
    let x = 0;
    let y = 0;
    const margin = 30;
    if (edge === 0) {
      x = Phaser.Math.Between(0, cam.width);
      y = -margin;
    } else if (edge === 1) {
      x = cam.width + margin;
      y = Phaser.Math.Between(0, cam.height);
    } else if (edge === 2) {
      x = Phaser.Math.Between(0, cam.width);
      y = cam.height + margin;
    } else {
      x = -margin;
      y = Phaser.Math.Between(0, cam.height);
    }

    const hp = ENEMY.baseHp + WAVE.hpPerWave * (this.wave - 1);
    const speed = ENEMY.baseSpeed + WAVE.speedPerWave * (this.wave - 1);
    this.enemies.spawnAt({
      x,
      y,
      hp,
      speed,
      damage: ENEMY.baseDamage,
      coinValue: ENEMY.coinDrop,
    });
  }

  update(): void {
    if (this.state === 'fighting' && this.toSpawn <= 0 && this.enemies.countAlive() === 0) {
      this.state = 'cleared';
      this.events.onWaveCleared(this.wave);
    }
  }

  reset(): void {
    this.wave = 0;
    this.state = 'idle';
    this.toSpawn = 0;
    this.spawnTimer?.remove(false);
  }
}
