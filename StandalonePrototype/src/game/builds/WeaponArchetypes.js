import { getWeaponTypeFromAny, normalizeWeaponType } from "../WeaponTypes.js?v=32";

export const BUILD_WEAPON_ARCHETYPES = {
  dagger: {
    weaponType: "dagger",
    attackPattern: "daggerSlash",
    damage: 8,
    range: 38,
    attackSpeed: 4.0,
    critChance: 0.09,
    pierce: 1,
    knockback: 2.4,
  },
  sword: {
    weaponType: "sword",
    attackPattern: "arcSlash",
    damage: 12,
    range: 56,
    attackSpeed: 3.75,
    critChance: 0.04,
    pierce: 1,
    knockback: 3.2,
  },
  spear: {
    weaponType: "spear",
    attackPattern: "thrust",
    damage: 10,
    range: 86,
    attackSpeed: 3.35,
    critChance: 0.07,
    pierce: 1,
    knockback: 3,
  },
  axe: {
    weaponType: "axe",
    attackPattern: "heavySmash",
    damage: 17,
    range: 48,
    attackSpeed: 2.15,
    critChance: 0.03,
    pierce: 1,
    knockback: 7,
  },
  bow: {
    weaponType: "bow",
    attackPattern: "thrust",
    damage: 9,
    range: 92,
    attackSpeed: 2.8,
    critChance: 0.09,
    pierce: 1,
    knockback: 2,
  },
  shield: {
    weaponType: "shield",
    attackPattern: "guardBash",
    damage: 8,
    range: 38,
    attackSpeed: 3.35,
    critChance: 0.02,
    pierce: 1,
    knockback: 4.5,
  },
  staff: {
    weaponType: "staff",
    attackPattern: "arcSlash",
    damage: 11,
    range: 70,
    attackSpeed: 3.0,
    critChance: 0.06,
    pierce: 1,
    knockback: 2.8,
  },
};

export function getBuildWeaponArchetype(weaponType = "sword") {
  const normalized = normalizeWeaponType(weaponType);
  return BUILD_WEAPON_ARCHETYPES[normalized] ?? BUILD_WEAPON_ARCHETYPES.sword;
}

export { normalizeWeaponType };

export function getWeaponTypeFromProfile(weapon = null) {
  return getWeaponTypeFromAny(
    weapon?.weaponType,
    weapon?.weaponArchetype,
    weapon?.archetype?.id,
    weapon?.combat?.weaponArchetype,
    weapon?.combat?.type,
    "sword"
  );
}

