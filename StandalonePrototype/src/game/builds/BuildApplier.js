import { getInkRelic } from "./InkRelics.js";
import { getWeaponEvolution } from "./WeaponEvolutions.js";

export function applyBuildModifiers(baseStats, buildState, context = {}) {
  const finalStats = { ...baseStats };
  const flags = [];

  // Apply relic modifiers.
  const relicIds = Array.isArray(buildState?.relics) ? buildState.relics : [];
  for (const relicId of relicIds) {
    const relic = getInkRelic(relicId);
    if (!relic) continue;
    for (const modifier of relic.modifiers ?? []) {
      if (!conditionMatches(modifier.condition, context)) continue;
      applyModifier(finalStats, modifier);
    }
  }

  // Apply weapon evolution modifiers and collect flags.
  const evoState = buildState?.weaponEvolutions;
  if (evoState && typeof evoState === "object") {
    for (const evoId of Object.keys(evoState)) {
      if (!evoState[evoId]) continue;
      const evo = getWeaponEvolution(evoId);
      if (!evo) continue;
      for (const modifier of evo.modifiers ?? []) {
        if (!conditionMatches(modifier.condition, context)) continue;
        applyModifier(finalStats, modifier);
      }
      if (Array.isArray(evo.flags)) {
        for (const flag of evo.flags) {
          if (!flags.includes(flag)) flags.push(flag);
        }
      }
    }
  }

  const normalized = normalizeFinalStats(finalStats);
  if (flags.length > 0) {
    normalized.flags = flags;
    console.log("[BuildEvolutionFlags]", { flags, weaponType: context.weaponType });
  }

  return normalized;
}

function applyModifier(stats, modifier) {
  const stat = modifier.stat;
  if (!stat) return;
  const type = modifier.type ?? modifier.op;
  const value = modifier.value;
  if (type === "add") stats[stat] = numberOr(stats[stat], 0) + numberOr(value, 0);
  if (type === "mul") stats[stat] = numberOr(stats[stat], 0) * numberOr(value, 1);
  if (type === "set") stats[stat] = value;
}

function conditionMatches(condition, context) {
  if (!condition) return true;
  if (condition === "lowHp") return numberOr(context.player?.hp, 100) <= numberOr(context.player?.maxHp, 100) * 0.35;
  if (condition === "fullHp") return numberOr(context.player?.hp, 0) >= numberOr(context.player?.maxHp, 100);
  if (condition === "lowInk") {
    const maxInk = numberOr(context.player?.maxInk, 100 + numberOr(context.player?.maxInkBonus, 0));
    return numberOr(context.player?.ink, maxInk) <= maxInk * 0.3;
  }
  if (condition === "bossRoom") return Boolean(context.bossRoom ?? context.isBossRoom);
  return false;
}

function normalizeFinalStats(stats) {
  const critChance = clamp(numberOr(stats.critChance ?? stats.criticalChance ?? stats.crit, 0), 0, 1);
  return {
    ...stats,
    damage: Math.max(1, Math.round(numberOr(stats.damage, 1))),
    range: Math.max(1, Math.round(numberOr(stats.range, 1))),
    attackSpeed: Math.max(0.1, numberOr(stats.attackSpeed, 1)),
    critChance,
    criticalChance: critChance,
    pierce: Math.max(1, Math.round(numberOr(stats.pierce, 1))),
    knockback: Math.max(0, numberOr(stats.knockback, 0)),
  };
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
