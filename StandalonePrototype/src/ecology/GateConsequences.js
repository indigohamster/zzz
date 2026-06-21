const CONSEQUENCE_RULES = {
  paper_boat_route: {
    message: "纸船在主地图边缘画出回流，今晚的下潜压力下降。",
    pressureDelta: -10,
    ink: 10,
    hp: 4,
    timeFrames: 14 * 60,
    spawnBase: 0,
    roomType: "resource",
  },
  runaway_sun: {
    message: "会跑的太阳把你的位置照亮了，奖励更亮，追来的东西也更多。",
    pressureDelta: 16,
    ink: 12,
    hp: -4,
    timeFrames: 8 * 60,
    spawnBase: 1,
    roomType: "rift",
  },
  sealed_blank: {
    message: "留白被封住，恐惧没有跟出来，身体和墨水都稳了一点。",
    pressureDelta: -8,
    ink: 6,
    hp: 10,
    timeFrames: 8 * 60,
    spawnBase: 0,
    roomType: "resource",
  },
  door_eye_pursuit: {
    message: "门缝记住了你，主地图里会出现追视和额外敌意。",
    pressureDelta: 20,
    ink: -4,
    hp: -8,
    timeFrames: 0,
    spawnBase: 2,
    roomType: "danger",
  },
  crooked_grid: {
    message: "歪掉的网格给你留出捷径，模板规则暂时慢了半拍。",
    pressureDelta: -6,
    ink: 8,
    hp: 0,
    timeFrames: 10 * 60,
    spawnBase: 0,
    roomType: "resource",
  },
  template_desync: {
    message: "模板反同步泄露到墨境，武器更快，但地图开始纠错你。",
    pressureDelta: 18,
    ink: -6,
    hp: -3,
    timeFrames: 0,
    spawnBase: 1,
    roomType: "rift",
    attackSpeed: 0.04,
  },
};

export function applyGateConsequence({
  outcome = null,
  gateType = "warm_doodle",
  nearGate = null,
  player,
  weapon,
  run,
  npcManager,
  addTimeFrames,
}) {
  const profile = outcome?.profile ?? fallbackProfile(gateType);
  const rule = CONSEQUENCE_RULES[profile.id] ?? CONSEQUENCE_RULES.paper_boat_route;
  const intensity = clamp(outcome?.intensity ?? 1, 1, 4);
  const pressureDelta = scalePressure(rule.pressureDelta, intensity);
  const spawnCount = Math.max(0, rule.spawnBase + Math.max(0, intensity - 2));

  run.canvasPressure = clamp((run.canvasPressure ?? 0) + pressureDelta, 0, 100);
  run.canvasConsequences = Array.isArray(run.canvasConsequences) ? run.canvasConsequences : [];

  if (rule.ink) {
    const maxInk = 100 + (player.maxInkBonus ?? 0);
    player.ink = clamp(player.ink + rule.ink * intensity, 0, maxInk);
  }
  if (rule.hp) {
    player.hp = clamp(player.hp + rule.hp * intensity, 1, 100);
  }
  if (rule.timeFrames && typeof addTimeFrames === "function") {
    addTimeFrames(Math.round(rule.timeFrames * (0.75 + intensity * 0.15)));
  }
  if (rule.attackSpeed) {
    multiplyWeaponStat(weapon, "attackSpeed", 1 + rule.attackSpeed * intensity);
  }

  const spawned = spawnCount > 0 && npcManager?.spawnGateHunters
    ? npcManager.spawnGateHunters({
        sourceX: nearGate?.x,
        sourceY: nearGate?.y,
        count: spawnCount,
        hp: 34 + intensity * 8,
        roomType: rule.roomType,
        color: profile.color,
        label: profile.name,
      })
    : 0;

  const record = {
    id: profile.id,
    gateType,
    name: profile.name,
    color: profile.color,
    message: rule.message,
    intensity,
    pressureDelta,
    pressure: run.canvasPressure,
    spawned,
    contractName: outcome?.contractName ?? "",
    completedRooms: outcome?.completedRooms ?? 0,
    requiredRooms: outcome?.requiredRooms ?? 0,
    riskScore: outcome?.riskScore ?? 0,
    careScore: outcome?.careScore ?? 0,
  };
  run.canvasConsequences.push(record);
  run.latestGateConsequence = record;
  return record;
}

export function formatGateConsequenceLine(run) {
  const entries = Array.isArray(run?.canvasConsequences) ? run.canvasConsequences : [];
  if (entries.length === 0) return "";
  const latest = entries[entries.length - 1];
  const names = [...new Set(entries.map((item) => item.name).filter(Boolean))].slice(0, 3).join(" / ");
  return `Canvas consequence: ${names || latest.name} pressure ${latest.pressure ?? 0}%`;
}

function fallbackProfile(gateType) {
  if (gateType === "horror_sketch") return { id: "sealed_blank", name: "封住的留白", color: "#f5efe0" };
  if (gateType === "ai_template") return { id: "crooked_grid", name: "歪掉的网格", color: "#d0d8e0" };
  return { id: "paper_boat_route", name: "纸船捷径", color: "#7dd3fc" };
}

function scalePressure(delta, intensity) {
  if (delta < 0) return Math.round(delta * (0.8 + intensity * 0.08));
  return Math.round(delta * (0.7 + intensity * 0.12));
}

function multiplyWeaponStat(weapon, stat, factor) {
  if (!weapon || !Number.isFinite(factor) || factor <= 0) return;
  if (!weapon.finalStats) weapon.finalStats = {};
  if (!weapon.combat) weapon.combat = {};
  const current = weapon.finalStats[stat] ?? weapon.combat?.[stat] ?? 1;
  const next = Math.max(0.2, Math.round(current * factor * 1000) / 1000);
  weapon.finalStats[stat] = next;
  weapon.combat[stat] = next;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
