import Phaser from 'phaser';
import { TEX } from '../textures';
import { ENEMY } from '../config';

export type EnemyType = 'grunt' | 'runner' | 'tank' | 'shooter' | 'boss';

export interface EnemyShootProfile {
  intervalMs: number;
  bulletSpeed: number;
  bulletDamage: number;
  preferredDistance?: number;
}

export interface EnemyProfile {
  hp: number;
  speed: number;
  damage: number;
  coinValue: number;
  scale: number;
  bodyRadius: number;
  texKey: string;
  label: string;
  shoots?: EnemyShootProfile;
}

export const ENEMY_PROFILES: Record<EnemyType, EnemyProfile> = {
  grunt: {
    hp: ENEMY.baseHp,
    speed: ENEMY.baseSpeed,
    damage: ENEMY.baseDamage,
    coinValue: 1,
    scale: 1,
    bodyRadius: 16,
    texKey: TEX.enemy,
    label: 'Grunt',
  },
  runner: {
    hp: 12,
    speed: 180,
    damage: 8,
    coinValue: 1,
    scale: 1,
    bodyRadius: 12,
    texKey: TEX.enemyRunner,
    label: 'Runner',
  },
  tank: {
    hp: 90,
    speed: 55,
    damage: 18,
    coinValue: 3,
    scale: 1,
    bodyRadius: 22,
    texKey: TEX.enemyTank,
    label: 'Tank',
  },
  shooter: {
    hp: 28,
    speed: 70,
    damage: 8,
    coinValue: 2,
    scale: 1,
    bodyRadius: 16,
    texKey: TEX.enemyShooter,
    label: 'Shooter',
    shoots: { intervalMs: 1500, bulletSpeed: 280, bulletDamage: 10, preferredDistance: 280 },
  },
  boss: {
    hp: 180,
    speed: 60,
    damage: 14,
    coinValue: 12,
    scale: 1,
    bodyRadius: 36,
    texKey: TEX.enemyBoss,
    label: 'Boss',
    shoots: { intervalMs: 1100, bulletSpeed: 300, bulletDamage: 10, preferredDistance: 320 },
  },
};

export interface EnemySpawnOpts {
  x: number;
  y: number;
  type: EnemyType;
  hpMul: number;
  speedAdd: number;
  damageMul: number;
  coinMul: number;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  type: EnemyType = 'grunt';
  hp = ENEMY.baseHp;
  maxHp = ENEMY.baseHp;
  speed = ENEMY.baseSpeed;
  damage = ENEMY.baseDamage;
  coinValue = 1;
  lastContactAt = 0;
  private profile: EnemyProfile = ENEMY_PROFILES.grunt;
  private lastShotAt = 0;
  private wobble = 0;
  private offsetAngle = 0;
  private offsetRadius = 0;
  private wobbleFreq = 1;
  private wobbleAmp = 0;
  private speedJitter = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.enemy);
  }

  spawn(opts: EnemySpawnOpts): void {
    this.type = opts.type;
    const prof = ENEMY_PROFILES[opts.type];
    this.profile = prof;
    this.setTexture(prof.texKey);
    this.enableBody(true, opts.x, opts.y, true, true);
    this.setActive(true).setVisible(true);
    this.setScale(prof.scale);
    this.setTint(0xffffff);
    this.hp = Math.round(prof.hp * opts.hpMul);
    this.maxHp = this.hp;
    this.speed = prof.speed + opts.speedAdd;
    this.damage = Math.round(prof.damage * opts.damageMul);
    this.coinValue = Math.max(1, Math.round(prof.coinValue * opts.coinMul));
    this.lastContactAt = 0;
    this.lastShotAt = this.scene.time.now + Phaser.Math.Between(200, 800);
    this.wobble = Math.random() * Math.PI * 2;
    this.offsetAngle = Math.random() * Math.PI * 2;
    this.offsetRadius = opts.type === 'boss' ? 0 : 30 + Math.random() * 50;
    this.wobbleFreq = 0.6 + Math.random() * 1.2;
    this.wobbleAmp = opts.type === 'boss' ? 0.15 : 0.45 + Math.random() * 0.35;
    this.speedJitter = 0.85 + Math.random() * 0.3;
    const r = prof.bodyRadius;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);
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

  tickAI(time: number, delta: number, targetX: number, targetY: number): void {
    if (!this.active) return;

    const distToPlayer = Math.hypot(targetX - this.x, targetY - this.y) || 1;
    const offsetScale = Phaser.Math.Clamp((distToPlayer - 60) / 200, 0, 1);
    const aimX = targetX + Math.cos(this.offsetAngle) * this.offsetRadius * offsetScale;
    const aimY = targetY + Math.sin(this.offsetAngle) * this.offsetRadius * offsetScale;
    const dx = aimX - this.x;
    const dy = aimY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angToTarget = Math.atan2(targetY - this.y, targetX - this.x);
    const speed = this.speed * this.speedJitter;
    let vx = (dx / dist) * speed;
    let vy = (dy / dist) * speed;

    this.wobble += (delta / 1000) * this.wobbleFreq;
    const px = -dy / dist;
    const py = dx / dist;
    const wob = Math.sin(this.wobble) * this.wobbleAmp * offsetScale;

    if (this.profile.shoots?.preferredDistance) {
      const pref = this.profile.shoots.preferredDistance;
      const diff = distToPlayer - pref;
      const sign = diff > 0 ? 1 : -1;
      const kite = Phaser.Math.Clamp(Math.abs(diff) / 80, 0, 1);
      const txd = (targetX - this.x) / distToPlayer;
      const tyd = (targetY - this.y) / distToPlayer;
      vx = txd * speed * sign * kite;
      vy = tyd * speed * sign * kite;
      const ppx = -tyd;
      const ppy = txd;
      vx += ppx * Math.sin(this.wobble) * speed * 0.5;
      vy += ppy * Math.sin(this.wobble) * speed * 0.5;
    } else {
      vx += px * wob * speed;
      vy += py * wob * speed;
    }

    this.setVelocity(vx, vy);
    this.setRotation(angToTarget + Math.PI / 2);

    if (this.profile.shoots && time >= this.lastShotAt + this.profile.shoots.intervalMs) {
      this.lastShotAt = time;
      const sp = this.profile.shoots;
      this.scene.events.emit('enemy-fire', {
        x: this.x,
        y: this.y,
        angle: angToTarget,
        speed: sp.bulletSpeed,
        damage: sp.bulletDamage,
      });
      if (this.type === 'boss') {
        this.scene.events.emit('enemy-fire', {
          x: this.x,
          y: this.y,
          angle: angToTarget + 0.3,
          speed: sp.bulletSpeed,
          damage: sp.bulletDamage,
        });
        this.scene.events.emit('enemy-fire', {
          x: this.x,
          y: this.y,
          angle: angToTarget - 0.3,
          speed: sp.bulletSpeed,
          damage: sp.bulletDamage,
        });
      }
    }
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

  spawnAt(opts: EnemySpawnOpts): Enemy | null {
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

  updateAll(time: number, delta: number, x: number, y: number): void {
    this.children.each((c) => {
      const e = c as Enemy;
      if (e.active) e.tickAI(time, delta, x, y);
      return true;
    });
  }

  findBoss(): Enemy | null {
    let result: Enemy | null = null;
    this.children.each((c) => {
      const e = c as Enemy;
      if (e.active && e.type === 'boss') {
        result = e;
        return false;
      }
      return true;
    });
    return result;
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
