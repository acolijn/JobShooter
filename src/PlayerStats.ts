import { PLAYER } from './config';

export type WeaponType = 'bullet' | 'laser' | 'plasma' | 'seeker';

export interface PlayerStats {
  maxHp: number;
  hp: number;
  // weapon tier: 0=single, 1=double, 2=triple per weapon type
  weaponTiers: Record<string, number>;
  speed: number;
  fireRateMs: number;
  bulletSpeed: number;
  bulletDamage: number;
  bulletCount: number;
  bulletSpread: number;
  pierce: number;
  coinMultiplier: number;
  regenPerSec: number;
  weaponType: WeaponType;
  ownedWeapons: WeaponType[];
  bombEnabled: boolean;
  bombDamage: number;
  bombRadius: number;
  bombCooldownMs: number;
  bombSpeed: number;
  bombFuseMs: number;
}

export function defaultStats(): PlayerStats {
  return {
    maxHp: PLAYER.maxHp,
    hp: PLAYER.maxHp,
    speed: PLAYER.speed,
    fireRateMs: PLAYER.fireRateMs,
    bulletSpeed: PLAYER.bulletSpeed,
    bulletDamage: PLAYER.bulletDamage,
    bulletCount: 1,
    bulletSpread: 0.18,
    pierce: 0,
    coinMultiplier: 1,
    regenPerSec: 0,
    weaponType: 'bullet',
    ownedWeapons: ['bullet'],
    weaponTiers: { bullet: 0, laser: 0, plasma: 0, seeker: 0 },
    bombEnabled: false,
    bombDamage: 60,
    bombRadius: 110,
    bombCooldownMs: 4000,
    bombSpeed: 360,
    bombFuseMs: 900,
  };
}
