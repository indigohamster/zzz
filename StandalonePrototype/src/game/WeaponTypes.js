export const WEAPON_TYPE_ALIASES = {
  sword: "sword",
  blade: "sword",
  sketch_sword: "sword",

  spear: "spear",
  lance: "spear",
  pike: "spear",
  ink_spear: "spear",

  axe: "axe",
  hammer: "axe",
  maul: "axe",
  charcoal_hammer: "axe",

  bow: "bow",
  boomerang: "bow",
  paper_boomerang: "bow",

  staff: "staff",
  magicstaff: "staff",
  magic_staff: "staff",
  wand: "staff",
  brush_wave: "staff",

  dagger: "dagger",
  knife: "dagger",
  dirk: "dagger",

  shield: "shield",
  buckler: "shield",

  whip: "whip",
  line_whip: "whip",
};

export function normalizeWeaponType(value = "sword", fallback = "sword") {
  const key = String(value || fallback).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return WEAPON_TYPE_ALIASES[key] ?? fallback;
}

export function weaponTypeToArchetypeId(weaponType = "sword") {
  const normalized = normalizeWeaponType(weaponType);
  if (normalized === "axe") return "hammer";
  return normalized;
}

export function getWeaponTypeFromAny(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return normalizeWeaponType(value);
  }
  return "sword";
}
