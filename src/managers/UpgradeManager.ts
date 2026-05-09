import Phaser from 'phaser';
import { PlayerStats } from '../PlayerStats';

export type UpgradeKind = 'weapon' | 'bomb' | 'stat';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  kind: UpgradeKind;
  cost: number;
  apply: (stats: PlayerStats) => void;
  available?: (stats: PlayerStats) => boolean;
}

export const ALL_UPGRADES: Upgrade[] = [
  {
    id: 'damage',
    name: 'Sharper Rounds',
    description: '+25% bullet damage',
    kind: 'stat',
    cost: 8,
    apply: (s) => {
      s.bulletDamage = Math.round(s.bulletDamage * 1.25);
    },
  },
  {
    id: 'firerate',
    name: 'Rapid Fire',
    description: '-15% fire interval',
    kind: 'stat',
    cost: 10,
    apply: (s) => {
      s.fireRateMs = Math.max(60, Math.round(s.fireRateMs * 0.85));
    },
  },
  {
    id: 'speed',
    name: 'Booster Thrusters',
    description: '+15% move speed',
    kind: 'stat',
    cost: 6,
    apply: (s) => {
      s.speed = Math.round(s.speed * 1.15);
    },
  },
  {
    id: 'maxhp',
    name: 'Reinforced Hull',
    description: '+25 max HP, full heal',
    kind: 'stat',
    cost: 8,
    apply: (s) => {
      s.maxHp += 25;
      s.hp = s.maxHp;
    },
  },
  {
    id: 'multishot',
    name: 'Multi-Shot',
    description: '+1 projectile per shot',
    kind: 'stat',
    cost: 18,
    apply: (s) => {
      s.bulletCount += 1;
    },
  },
  {
    id: 'pierce',
    name: 'Piercing Rounds',
    description: '+1 enemy pierce',
    kind: 'stat',
    cost: 14,
    apply: (s) => {
      s.pierce += 1;
    },
  },
  {
    id: 'velocity',
    name: 'Hyper Velocity',
    description: '+25% projectile speed',
    kind: 'stat',
    cost: 6,
    apply: (s) => {
      s.bulletSpeed = Math.round(s.bulletSpeed * 1.25);
    },
  },
  {
    id: 'regen',
    name: 'Nano Repair',
    description: '+1 HP/sec regen',
    kind: 'stat',
    cost: 12,
    apply: (s) => {
      s.regenPerSec += 1;
    },
  },
  {
    id: 'greed',
    name: 'Magnet Greed',
    description: '+50% coin gain',
    kind: 'stat',
    cost: 10,
    apply: (s) => {
      s.coinMultiplier += 0.5;
    },
  },
  {
    id: 'tightspread',
    name: 'Focused Spread',
    description: '-30% spread angle',
    kind: 'stat',
    cost: 6,
    apply: (s) => {
      s.bulletSpread = Math.max(0.04, s.bulletSpread * 0.7);
    },
  },
  {
    id: 'shield',
    name: 'Kinetic Shield',
    description: '+50 max HP, +0.5 HP/s regen',
    kind: 'stat',
    cost: 16,
    apply: (s) => {
      s.maxHp += 50;
      s.hp = Math.min(s.maxHp, s.hp + 50);
      s.regenPerSec += 0.5;
    },
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    description: '+40% damage, +10% fire interval',
    kind: 'stat',
    cost: 12,
    apply: (s) => {
      s.bulletDamage = Math.round(s.bulletDamage * 1.4);
      s.fireRateMs = Math.round(s.fireRateMs * 1.1);
    },
  },
  {
    id: 'weapon-laser',
    name: 'Laser Cannon',
    description: 'Unlock laser: fast, piercing, lower damage. Switch with 1-4',
    kind: 'weapon',
    cost: 25,
    available: (s) => !s.ownedWeapons.includes('laser'),
    apply: (s) => {
      if (!s.ownedWeapons.includes('laser')) s.ownedWeapons.push('laser');
      s.weaponType = 'laser';
    },
  },
  {
    id: 'weapon-plasma',
    name: 'Plasma Lance',
    description: 'Unlock plasma: slow heavy bolts, high damage. Switch with 1-4',
    kind: 'weapon',
    cost: 30,
    available: (s) => !s.ownedWeapons.includes('plasma'),
    apply: (s) => {
      if (!s.ownedWeapons.includes('plasma')) s.ownedWeapons.push('plasma');
      s.weaponType = 'plasma';
    },
  },
  {
    id: 'weapon-seeker',
    name: 'Seeker Missiles',
    description: 'Unlock homing missiles. Auto-track nearest enemy',
    kind: 'weapon',
    cost: 35,
    available: (s) => !s.ownedWeapons.includes('seeker'),
    apply: (s) => {
      if (!s.ownedWeapons.includes('seeker')) s.ownedWeapons.push('seeker');
      s.weaponType = 'seeker';
    },
  },
  {
    id: 'bomb-bay',
    name: 'Bomb Bay',
    description: 'Auto-launch AOE bombs every few seconds',
    kind: 'bomb',
    cost: 30,
    available: (s) => !s.bombEnabled,
    apply: (s) => {
      s.bombEnabled = true;
    },
  },
  {
    id: 'bomb-damage',
    name: 'Heavy Ordnance',
    description: '+50% bomb damage',
    kind: 'bomb',
    cost: 14,
    available: (s) => s.bombEnabled,
    apply: (s) => {
      s.bombDamage = Math.round(s.bombDamage * 1.5);
    },
  },
  {
    id: 'bomb-radius',
    name: 'Cluster Charge',
    description: '+30% bomb radius',
    kind: 'bomb',
    cost: 12,
    available: (s) => s.bombEnabled,
    apply: (s) => {
      s.bombRadius = Math.round(s.bombRadius * 1.3);
    },
  },
  {
    id: 'bomb-cooldown',
    name: 'Quick Fuse',
    description: '-25% bomb cooldown',
    kind: 'bomb',
    cost: 14,
    available: (s) => s.bombEnabled,
    apply: (s) => {
      s.bombCooldownMs = Math.max(800, Math.round(s.bombCooldownMs * 0.75));
    },
  },
  {
    id: 'bomb-fuse',
    name: 'Long Fuse',
    description: '+50% bomb travel time',
    kind: 'bomb',
    cost: 8,
    available: (s) => s.bombEnabled,
    apply: (s) => {
      s.bombFuseMs = Math.round(s.bombFuseMs * 1.5);
    },
  },
];

export class UpgradeManager {
  private rng: Phaser.Math.RandomDataGenerator;

  constructor(seed?: string) {
    this.rng = new Phaser.Math.RandomDataGenerator(seed ? [seed] : undefined);
  }

  pickThree(stats: PlayerStats): Upgrade[] {
    const pool = ALL_UPGRADES.filter((u) => !u.available || u.available(stats));
    const out: Upgrade[] = [];
    const n = Math.min(3, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = this.rng.between(0, pool.length - 1);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  apply(upgrade: Upgrade, stats: PlayerStats): void {
    upgrade.apply(stats);
  }
}
