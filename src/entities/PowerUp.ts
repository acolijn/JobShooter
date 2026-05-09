import Phaser from 'phaser';
import { PlayerStats, WeaponType } from '../PlayerStats';

export type PowerUpType =
  | 'freeze'
  | 'shield'
  | 'double_damage'
  | 'super_jobboss'
  | 'stat_damage'
  | 'stat_firerate'
  | 'stat_speed'
  | 'stat_hp'
  | 'stat_pierce'
  | 'tier_bullet'
  | 'tier_laser'
  | 'tier_plasma'
  | 'tier_seeker';

export interface PowerUpDef {
  type: PowerUpType;
  label: string;
  color: number;
  glowColor: number;
  durationMs?: number; // undefined = instant
  apply?: (stats: PlayerStats) => void; // for instant stat/tier drops
  available?: (stats: PlayerStats) => boolean; // for context-aware drops
}

export const POWER_UP_DEFS: Record<PowerUpType, PowerUpDef> = {
  freeze: {
    type: 'freeze',
    label: 'FREEZE',
    color: 0x88ddff,
    glowColor: 0x00aaff,
    durationMs: 3000,
  },
  shield: {
    type: 'shield',
    label: 'SHIELD',
    color: 0xaaffaa,
    glowColor: 0x00ff88,
    durationMs: 5000,
  },
  double_damage: {
    type: 'double_damage',
    label: 'DOUBLE DMG',
    color: 0xff8833,
    glowColor: 0xff4400,
    durationMs: 5000,
  },
  super_jobboss: {
    type: 'super_jobboss',
    label: '★ SUPER JOBBOSS ★',
    color: 0xffdd00,
    glowColor: 0xff8800,
    durationMs: 8000,
  },
  stat_damage: {
    type: 'stat_damage',
    label: '+DMG',
    color: 0xff6666,
    glowColor: 0xff2222,
    apply: (s) => { s.bulletDamage = Math.round(s.bulletDamage * 1.15); },
  },
  stat_firerate: {
    type: 'stat_firerate',
    label: '+ROF',
    color: 0xffaa44,
    glowColor: 0xff8800,
    apply: (s) => { s.fireRateMs = Math.max(60, Math.round(s.fireRateMs * 0.9)); },
  },
  stat_speed: {
    type: 'stat_speed',
    label: '+SPD',
    color: 0x88ff88,
    glowColor: 0x00cc44,
    apply: (s) => { s.speed = Math.round(s.speed * 1.1); },
  },
  stat_hp: {
    type: 'stat_hp',
    label: '+HP',
    color: 0xff88cc,
    glowColor: 0xff44aa,
    apply: (s) => { s.maxHp += 15; s.hp = Math.min(s.maxHp, s.hp + 15); },
  },
  stat_pierce: {
    type: 'stat_pierce',
    label: '+PIERCE',
    color: 0xccaaff,
    glowColor: 0x9944ff,
    apply: (s) => { s.pierce += 1; },
  },
  tier_bullet: {
    type: 'tier_bullet',
    label: 'BULLET UPGRADE',
    color: 0x9ef7ff,
    glowColor: 0x44aaff,
    apply: (s) => {
      const t = (s.weaponTiers['bullet'] ?? 0);
      if (t < 2) s.weaponTiers['bullet'] = t + 1;
    },
    available: (s) => s.ownedWeapons.includes('bullet') && (s.weaponTiers['bullet'] ?? 0) < 2,
  },
  tier_laser: {
    type: 'tier_laser',
    label: 'LASER UPGRADE',
    color: 0x66ff88,
    glowColor: 0x00cc44,
    apply: (s) => {
      const t = (s.weaponTiers['laser'] ?? 0);
      if (t < 2) s.weaponTiers['laser'] = t + 1;
    },
    available: (s) => s.ownedWeapons.includes('laser') && (s.weaponTiers['laser'] ?? 0) < 2,
  },
  tier_plasma: {
    type: 'tier_plasma',
    label: 'PLASMA UPGRADE',
    color: 0xff66ff,
    glowColor: 0xaa00aa,
    apply: (s) => {
      const t = (s.weaponTiers['plasma'] ?? 0);
      if (t < 2) s.weaponTiers['plasma'] = t + 1;
    },
    available: (s) => s.ownedWeapons.includes('plasma') && (s.weaponTiers['plasma'] ?? 0) < 2,
  },
  tier_seeker: {
    type: 'tier_seeker',
    label: 'MISSILE UPGRADE',
    color: 0xffaa44,
    glowColor: 0xff6600,
    apply: (s) => {
      const t = (s.weaponTiers['seeker'] ?? 0);
      if (t < 2) s.weaponTiers['seeker'] = t + 1;
    },
    available: (s) => s.ownedWeapons.includes('seeker') && (s.weaponTiers['seeker'] ?? 0) < 2,
  },
};

// Drop chances (0–1). Sum of special powers <= 1 total chance pool.
// stat drops are slightly more common
export const SPECIAL_DROP_CHANCE = 0.04; // 1 in 25 kills drops a special power-up
export const STAT_DROP_CHANCE = 0.06;    // 1 in 17 kills drops a stat boost

export const SPECIAL_WEIGHTS: { type: PowerUpType; weight: number }[] = [
  { type: 'freeze',       weight: 30 },
  { type: 'shield',       weight: 25 },
  { type: 'double_damage',weight: 25 },
  { type: 'super_jobboss',weight: 5  }, // rare!
];

export const STAT_TYPES: PowerUpType[] = [
  'stat_damage',
  'stat_firerate',
  'stat_speed',
  'stat_hp',
  'stat_pierce',
];

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  powerType: PowerUpType = 'freeze';
  def!: PowerUpDef;
  private bornAt = 0;
  private label!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '__DEFAULT');
  }

  spawn(x: number, y: number, type: PowerUpType): void {
    this.powerType = type;
    this.def = POWER_UP_DEFS[type];
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.bornAt = this.scene.time.now;

    // Draw the pickup as a colored circle
    const key = `powerup_${type}`;
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.add.graphics();
      g.fillStyle(this.def.glowColor, 0.35);
      g.fillCircle(16, 16, 16);
      g.fillStyle(this.def.color, 1);
      g.fillCircle(16, 16, 10);
      g.lineStyle(2, 0xffffff, 0.7);
      g.strokeCircle(16, 16, 10);
      g.generateTexture(key, 32, 32);
      g.destroy();
    }
    this.setTexture(key);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(12, 4, 4);
    body.setAllowGravity(false);

    // Float label
    if (this.label) {
      this.label.destroy();
    }
    this.label = this.scene.add
      .text(x, y - 20, this.def.label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(60);

    // Pulse
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
    if (this.label) {
      this.label.destroy();
    }
    this.scene.tweens.killTweensOf(this);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.label && this.active) {
      this.label.setPosition(this.x, this.y - 22);
    }
    // Expire after 10 seconds
    if (this.active && time - this.bornAt > 10000) this.kill();
  }
}

export class PowerUpGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    super(scene.physics.world, scene, {
      classType: PowerUp,
      maxSize: 32,
      runChildUpdate: true,
    });
  }

  drop(x: number, y: number, type: PowerUpType): PowerUp | null {
    const p = this.get(x, y) as PowerUp | null;
    if (!p) return null;
    p.spawn(x, y, type);
    return p;
  }

  /** Randomly pick what to drop when an enemy dies. Returns null for no drop. */
  static rollDrop(isBoss: boolean, stats?: PlayerStats): PowerUpType | null {
    // Boss always drops something good
    if (isBoss) {
      // Try weapon tier first (if any available), else special, else stat
      const tierDrop = stats ? rollWeaponTier(stats) : null;
      if (tierDrop) return tierDrop;
      return rollSpecial() ?? rollStat();
    }

    // Special power-up
    if (Math.random() < SPECIAL_DROP_CHANCE) {
      return rollSpecial();
    }
    // Weapon tier upgrade (rare, context-aware)
    if (stats && Math.random() < 0.05) {
      const tier = rollWeaponTier(stats);
      if (tier) return tier;
    }
    // Stat drop
    if (Math.random() < STAT_DROP_CHANCE) {
      return rollStat();
    }
    return null;
  }
}

function rollSpecial(): PowerUpType {
  const total = SPECIAL_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of SPECIAL_WEIGHTS) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return SPECIAL_WEIGHTS[0].type;
}

function rollStat(): PowerUpType {
  return STAT_TYPES[Math.floor(Math.random() * STAT_TYPES.length)];
}

function rollWeaponTier(stats: PlayerStats): PowerUpType | null {
  const TIER_TYPES: PowerUpType[] = ['tier_bullet', 'tier_laser', 'tier_plasma', 'tier_seeker'];
  const upgradeable = TIER_TYPES.filter((t) => {
    const def = POWER_UP_DEFS[t];
    return def.available?.(stats) ?? false;
  });
  if (upgradeable.length === 0) return null;
  return upgradeable[Math.floor(Math.random() * upgradeable.length)];
}
