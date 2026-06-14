import { INK_RELICS } from "./InkRelics.js";
import { normalizeWeaponType } from "./WeaponArchetypes.js?v=32";
import { listEvolutionsForWeaponType } from "./WeaponEvolutions.js";

export function generateRelicChoices(buildState, currentWeaponType, count = 3) {
  const weaponType = normalizeWeaponType(currentWeaponType);
  const owned = new Set(Array.isArray(buildState?.relics) ? buildState.relics : []);
  const available = INK_RELICS.filter((relic) => !owned.has(relic.id));
  const relevant = available.filter((relic) => relic.tags.includes(weaponType));
  const common = available.filter((relic) => relic.tags.includes("common"));
  const fallback = available.filter((relic) => !relic.tags.includes(weaponType) && !relic.tags.includes("common"));
  const choices = [];

  pushRandomChoices(choices, relevant, Math.min(count, 2));
  pushRandomChoices(choices, common, count);
  pushRandomChoices(choices, fallback, count);

  return choices.slice(0, count);
}

export function generateEvolutionChoices(buildState, currentWeaponType, count = 3) {
  const weaponType = normalizeWeaponType(currentWeaponType);
  const owned = buildState && typeof buildState.hasWeaponEvolution === "function"
    ? Object.keys(buildState.weaponEvolutions ?? {}).filter((id) => buildState.weaponEvolutions[id])
    : [];
  const ownedSet = new Set(owned);
  const pool = listEvolutionsForWeaponType(weaponType).filter(
    (evo) => !ownedSet.has(evo.id) && (evo.levelRequired ?? 1) <= (buildState?.weaponLevel ?? 1)
  );
  const choices = [];
  while (choices.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}

function pushRandomChoices(choices, pool, targetCount) {
  const candidates = pool.filter((relic) => !choices.some((choice) => choice.id === relic.id));
  while (choices.length < targetCount && candidates.length > 0) {
    const index = Math.floor(Math.random() * candidates.length);
    choices.push(candidates.splice(index, 1)[0]);
  }
}

