// NightObjectives.js — compact nightly goals for the main inkwell run.

const LAYER_RANK = {
  shallow: 0,
  middle: 1,
  deep: 2,
};

const OBJECTIVES = [
  {
    id: "bring_back_gate",
    title: "带回门内发现物",
    shortTitle: "画布门",
    desc: "完成 1 个画布门委托并返回主地图",
    target: 1,
    color: "#f2b84b",
    reward: "墨水 +15，发现物 +1",
  },
  {
    id: "clear_threats",
    title: "清理夜里的麻烦",
    shortTitle: "战斗",
    desc: "击败 5 个敌人",
    target: 5,
    color: "#b23b48",
    reward: "身体 +8，材料 +2",
  },
  {
    id: "open_supply",
    title: "打开补给图层",
    shortTitle: "补给",
    desc: "打开 1 个宝箱",
    target: 1,
    color: "#c9a846",
    reward: "材料 +4",
  },
  {
    id: "reach_middle",
    title: "下潜到废稿层",
    shortTitle: "下潜",
    desc: "进入中层或更深",
    target: 1,
    color: "#7dd3fc",
    reward: "夜晚时间 +5s",
  },
  {
    id: "reach_deep",
    title: "触碰模板深处",
    shortTitle: "深潜",
    desc: "进入深层一次",
    target: 2,
    color: "#8b6b9e",
    reward: "发现物 +2",
  },
];

export function rollNightObjective({ unlockedGateTypes = [], previousObjectiveId = "" } = {}) {
  const canUseDangerGate = unlockedGateTypes.length > 1;
  const pool = OBJECTIVES.filter((objective) => {
    if (objective.id === "reach_deep") return canUseDangerGate;
    return true;
  });
  const candidates = pool.filter((objective) => objective.id !== previousObjectiveId);
  const list = candidates.length > 0 ? candidates : pool;
  return { ...list[Math.floor(Math.random() * list.length)] };
}

export function getNightObjectiveProgress(objective, run = {}) {
  if (!objective) return { current: 0, target: 1, complete: false, text: "" };

  let current = 0;
  if (objective.id === "bring_back_gate") current = run.gatesCompleted ?? 0;
  else if (objective.id === "clear_threats") current = run.kills ?? 0;
  else if (objective.id === "open_supply") current = run.chestsOpened ?? 0;
  else if (objective.id === "reach_middle") current = Math.min(1, layerRank(run.deepestLayer) >= 1 ? 1 : 0);
  else if (objective.id === "reach_deep") current = Math.min(2, layerRank(run.deepestLayer));

  const target = objective.target ?? 1;
  const complete = current >= target;
  return {
    current,
    target,
    complete,
    text: `${Math.min(current, target)}/${target}`,
  };
}

export function applyNightObjectiveReward(objective, { run, player, addTimeFrames = () => {} } = {}) {
  if (!objective || !run || objective.rewardApplied) return null;
  objective.rewardApplied = true;
  run.nightObjectiveCompleted = true;

  if (objective.id === "bring_back_gate") {
    run.itemsCollected = (run.itemsCollected ?? 0) + 1;
    if (player) player.ink = Math.min(100 + (player.maxInkBonus ?? 0), (player.ink ?? 0) + 15);
  } else if (objective.id === "clear_threats") {
    run.materialsCollected = (run.materialsCollected ?? 0) + 2;
    if (player) player.hp = Math.min(100, (player.hp ?? 0) + 8);
  } else if (objective.id === "open_supply") {
    run.materialsCollected = (run.materialsCollected ?? 0) + 4;
  } else if (objective.id === "reach_middle") {
    addTimeFrames(300);
  } else if (objective.id === "reach_deep") {
    run.itemsCollected = (run.itemsCollected ?? 0) + 2;
  }

  return {
    title: objective.title,
    reward: objective.reward,
    color: objective.color,
  };
}

export function formatNightObjectiveResult(objective, run = {}) {
  if (!objective) return "";
  const progress = getNightObjectiveProgress(objective, run);
  const status = progress.complete ? "completed" : "missed";
  return `Night goal ${status}: ${objective.title} ${progress.text}`;
}

function layerRank(layerId) {
  return LAYER_RANK[layerId] ?? 0;
}
