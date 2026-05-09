import Phaser from 'phaser';
import { WAVE } from '../config';
import { EnemyGroup, EnemyType } from '../entities/Enemy';

export type WaveState =
  | 'idle'
  | 'spawning'
  | 'minions'
  | 'boss-pending'
  | 'boss'
  | 'cleared';

export interface WaveEvents {
  onWaveStart: (wave: number) => void;
  onWaveCleared: (wave: number) => void;
  onBossSpawn?: (wave: number) => void;
}

const BOSS_DELAY_MS = 1400;

export class WaveManager {
  private scene: Phaser.Scene;
  private enemies: EnemyGroup;
  private events: WaveEvents;
  wave = 0;
  state: WaveState = 'idle';
  private queue: EnemyType[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, enemies: EnemyGroup, events: WaveEvents) {
    this.scene = scene;
    this.enemies = enemies;
    this.events = events;
  }

  startNextWave(): void {
    this.wave += 1;
    this.state = 'spawning';
    this.queue = this.composeQueue(this.wave);
    this.events.onWaveStart(this.wave);
    this.spawnTimer?.remove(false);
    this.spawnTimer = this.scene.time.addEvent({
      delay: WAVE.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnOne(),
    });
  }

  private composeQueue(wave: number): EnemyType[] {
    const list: EnemyType[] = [];
    const grunts = WAVE.baseCount + WAVE.countPerWave * (wave - 1);
    const runners = Math.floor(wave / 2);
    const tanks = Math.floor((wave - 1) / 3);
    const shooters = Math.floor(wave / 2);
    for (let i = 0; i < grunts; i++) list.push('grunt');
    for (let i = 0; i < runners; i++) list.push('runner');
    for (let i = 0; i < tanks; i++) list.push('tank');
    for (let i = 0; i < shooters; i++) list.push('shooter');
    Phaser.Utils.Array.Shuffle(list);
    return list;
  }

  private spawnOne(): void {
    if (this.queue.length === 0) {
      this.spawnTimer?.remove(false);
      this.state = 'minions';
      return;
    }
    this.spawnEnemy(this.queue.shift()!);
  }

  private spawnEnemy(type: EnemyType): void {
    const cam = this.scene.cameras.main;
    const edge = Phaser.Math.Between(0, 3);
    let x = 0;
    let y = 0;
    const margin = 40;
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

    const wf = this.wave - 1;
    const hpMul = type === 'boss' ? 1 + 0.50 * wf : 1 + 0.28 * wf;
    const speedAdd = WAVE.speedPerWave * wf;
    const damageMul = 1 + 0.14 * wf;
    const coinMul = 1 + 0.1 * wf;
    this.enemies.spawnAt({ x, y, type, hpMul, speedAdd, damageMul, coinMul, wave: this.wave });
  }

  update(): void {
    if (this.state === 'minions' && this.enemies.countAlive() === 0) {
      this.state = 'boss-pending';
      this.events.onBossSpawn?.(this.wave);
      this.scene.time.delayedCall(BOSS_DELAY_MS, () => {
        if (this.state !== 'boss-pending') return;
        this.spawnEnemy('boss');
        this.state = 'boss';
      });
      return;
    }
    if (this.state === 'boss' && this.enemies.countAlive() === 0) {
      this.state = 'cleared';
      this.events.onWaveCleared(this.wave);
    }
  }

  reset(): void {
    this.wave = 0;
    this.state = 'idle';
    this.queue = [];
    this.spawnTimer?.remove(false);
  }
}
