// DiscoveryEffects.js — effects applied when canvas-gate discoveries return to the main inkwell run.

const GATE_EFFECTS = {
  warm_doodle: {
    name: "温暖回响",
    color: "#f2b84b",
    stat: "range",
    message: "线条变稳，恢复墨水并增加武器触及",
  },
  horror_sketch: {
    name: "恐惧锋口",
    color: "#b23b48",
    stat: "damage",
    message: "恐惧被压进武器，伤害提升但身体承压",
  },
  ai_template: {
    name: "越界模板",
    color: "#7dd3fc",
    stat: "attackSpeed",
    message: "模板规则被偷走，攻击更快但更不稳定",
  },
};

export function applyDiscoveryEffects({ gateType, discoveries = [], player, weapon, run }) {
  const effect = GATE_EFFECTS[gateType] ?? GATE_EFFECTS.warm_doodle;
  const realDiscoveries = discoveries.filter((item) => item && !item.isContractEvidence);
  const count = Math.max(1, realDiscoveries.length || discoveries.length || 1);
  const jackpotCount = realDiscoveries.filter((item) => item.isJackpot || item.rarity === "legendary").length;
  const power = count + jackpotCount * 2;

  if (!run.discoveryInfusions) run.discoveryInfusions = [];
  if (!weapon.discoveryInfusions) weapon.discoveryInfusions = [];

  const infusion = {
    gateType,
    name: effect.name,
    count,
    power,
    color: effect.color,
  };
  run.discoveryInfusions.push(infusion);
  weapon.discoveryInfusions.push(infusion);

  if (gateType === "warm_doodle") {
    const inkGain = 10 + power * 3;
    const hpGain = 3 + power;
    player.ink = Math.min(100 + (player.maxInkBonus ?? 0), player.ink + inkGain);
    player.hp = Math.min(100, player.hp + hpGain);
    addWeaponStat(weapon, "range", Math.min(12, 2 + power));
  } else if (gateType === "horror_sketch") {
    addWeaponStat(weapon, "damage", Math.min(10, 1 + Math.ceil(power * 0.8)));
    addWeaponStat(weapon, "criticalChance", Math.min(0.12, 0.02 + power * 0.01));
    player.hp = Math.max(1, player.hp - Math.min(12, 3 + power));
  } else if (gateType === "ai_template") {
    multiplyWeaponStat(weapon, "attackSpeed", 1 + Math.min(0.18, 0.035 * power));
    addWeaponStat(weapon, "damageVariance", Math.min(0.35, 0.06 + power * 0.025));
    addWeaponStat(weapon, "range", Math.min(8, power));
  }

  run.artworkDiscoveryPower = (run.artworkDiscoveryPower ?? 0) + power;

  return {
    ...infusion,
    message: `${effect.name}：${effect.message}`,
  };
}

function addWeaponStat(weapon, stat, amount) {
  if (!weapon || !Number.isFinite(amount) || amount === 0) return;
  ensureWeaponStats(weapon);
  weapon.finalStats[stat] = normalizeStat(stat, (weapon.finalStats[stat] ?? 0) + amount);
  if (weapon.combat) {
    const combatStat = stat === "criticalChance" ? "crit" : stat;
    weapon.combat[combatStat] = normalizeStat(stat, (weapon.combat[combatStat] ?? 0) + amount);
  }
  if (stat === "damage") weapon.damage = weapon.finalStats.damage;
  if (stat === "range") weapon.reach = weapon.finalStats.range;
}

function multiplyWeaponStat(weapon, stat, factor) {
  if (!weapon || !Number.isFinite(factor) || factor <= 0) return;
  ensureWeaponStats(weapon);
  const current = weapon.finalStats[stat] ?? weapon.combat?.[stat] ?? 1;
  const next = normalizeStat(stat, current * factor);
  weapon.finalStats[stat] = next;
  if (weapon.combat) weapon.combat[stat] = next;
}

function ensureWeaponStats(weapon) {
  if (!weapon.finalStats) weapon.finalStats = {};
  if (!weapon.combat) weapon.combat = {};
}

function normalizeStat(stat, value) {
  if (!Number.isFinite(value)) return 0;
  if (stat === "criticalChance" || stat === "damageVariance") {
    return Math.max(0, Math.min(0.85, Math.round(value * 1000) / 1000));
  }
  if (stat === "attackSpeed") {
    return Math.max(0.2, Math.round(value * 1000) / 1000);
  }
  return Math.max(0, Math.round(value));
}
