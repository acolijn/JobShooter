import { PlayerStats, WeaponType } from './PlayerStats';
import { TEX } from './textures';

export interface WeaponProfile {
  texKey: string;
  speedMul: number;
  damageMul: number;
  pierceBonus: number;
  fireRateMul: number;
  spreadMul: number;
  scale: number;
  bodyRadius: number;
  countDelta: number;
  label: string;
  homing?: boolean;
  turnRate?: number;
}

export const WEAPON_PROFILES: Record<WeaponType, WeaponProfile> = {
  bullet: {
    texKey: TEX.bullet,
    speedMul: 1,
    damageMul: 1,
    pierceBonus: 0,
    fireRateMul: 1,
    spreadMul: 1,
    scale: 1,
    bodyRadius: 3,
    countDelta: 0,
    label: 'Bullets',
  },
  laser: {
    texKey: TEX.laser,
    speedMul: 1.7,
    damageMul: 0.65,
    pierceBonus: 2,
    fireRateMul: 0.7,
    spreadMul: 0.5,
    scale: 1,
    bodyRadius: 3,
    countDelta: 0,
    label: 'Laser',
  },
  plasma: {
    texKey: TEX.plasma,
    speedMul: 0.55,
    damageMul: 1.85,
    pierceBonus: 0,
    fireRateMul: 1.4,
    spreadMul: 0.6,
    scale: 1.4,
    bodyRadius: 9,
    countDelta: 0,
    label: 'Plasma',
  },
  seeker: {
    texKey: TEX.missile,
    speedMul: 0.7,
    damageMul: 0.85,
    pierceBonus: 0,
    fireRateMul: 1.9,
    spreadMul: 0.4,
    scale: 1,
    bodyRadius: 4,
    countDelta: 0,
    label: 'Seeker',
    homing: true,
    turnRate: 3.0,
  },
};

export function profileFor(stats: PlayerStats): WeaponProfile {
  const base = WEAPON_PROFILES[stats.weaponType];
  const tier = stats.weaponTiers?.[stats.weaponType] ?? 0;
  if (tier === 0) return base;
  // Tiers add extra projectiles via countDelta
  return { ...base, countDelta: base.countDelta + tier };
}
