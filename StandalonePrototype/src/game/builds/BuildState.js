import { getInkRelic } from "./InkRelics.js";

// XP thresholds for each weapon level (cumulative).
const WEAPON_XP_THRESHOLDS = [0, 2, 4, 7];

export function createBuildState(seed = {}) {
  const state = {
    relics: normalizeRelicIds(seed.relics),
    weaponXp: normalizeWeaponXp(seed.weaponXp),
    weaponLevel: normalizeWeaponLevel(seed.weaponLevel),
    weaponEvolutions: normalizeWeaponEvolutions(seed.weaponEvolutions),
    addRelic,
    hasRelic,
    removeRelic,
    addWeaponXp,
    canLevelUpWeapon,
    levelUpWeapon,
    addWeaponEvolution,
    hasWeaponEvolution,
    serialize,
  };

  function addRelic(relic) {
    const id = normalizeRelicId(relic);
    if (!id || state.relics.includes(id)) return false;
    state.relics.push(id);
    return true;
  }

  function hasRelic(relic) {
    const id = normalizeRelicId(relic);
    return Boolean(id) && state.relics.includes(id);
  }

  function removeRelic(relic) {
    const id = normalizeRelicId(relic);
    const index = state.relics.indexOf(id);
    if (index < 0) return false;
    state.relics.splice(index, 1);
    return true;
  }

  // ©¤©¤ Weapon XP / Level / Evolution ©¤©¤

  function addWeaponXp(amount = 1) {
    state.weaponXp += Math.max(0, Number.isFinite(amount) ? amount : 1);
  }

  function canLevelUpWeapon() {
    const nextLevel = state.weaponLevel + 1;
    const threshold = WEAPON_XP_THRESHOLDS[nextLevel];
    return threshold !== undefined && state.weaponXp >= threshold;
  }

  function levelUpWeapon() {
    if (!canLevelUpWeapon()) return false;
    state.weaponLevel++;
    console.log("[WeaponLeveled]", { level: state.weaponLevel, xp: state.weaponXp });
    return true;
  }

  function addWeaponEvolution(evolution) {
    const id = typeof evolution === "string" ? evolution : evolution?.id;
    if (!id) return false;
    if (state.weaponEvolutions[id]) return false;
    state.weaponEvolutions[id] = true;
    return true;
  }

  function hasWeaponEvolution(id) {
    return Boolean(state.weaponEvolutions[id]);
  }

  function serialize() {
    return {
      relics: [...state.relics],
      weaponXp: state.weaponXp,
      weaponLevel: state.weaponLevel,
      weaponEvolutions: { ...state.weaponEvolutions },
    };
  }

  return state;
}

export function deserializeBuildState(payload = {}) {
  if (typeof payload === "string") {
    try {
      return createBuildState(JSON.parse(payload));
    } catch {
      return createBuildState();
    }
  }
  return createBuildState(payload);
}

export const BuildState = {
  create: createBuildState,
  deserialize: deserializeBuildState,
};

function normalizeRelicIds(relics) {
  if (!Array.isArray(relics)) return [];
  const ids = [];
  for (const relic of relics) {
    const id = normalizeRelicId(relic);
    if (id && !ids.includes(id) && getInkRelic(id)) ids.push(id);
  }
  return ids;
}

function normalizeRelicId(relic) {
  if (typeof relic === "string") return relic;
  if (typeof relic?.id === "string") return relic.id;
  return "";
}

function normalizeWeaponLevel(level) {
  const number = Number(level);
  return Number.isFinite(number) ? Math.max(1, Math.floor(number)) : 1;
}

function normalizeWeaponXp(xp) {
  const number = Number(xp);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function normalizeWeaponEvolutions(evolutions) {
  if (!evolutions || typeof evolutions !== "object" || Array.isArray(evolutions)) return {};
  return { ...evolutions };
}
