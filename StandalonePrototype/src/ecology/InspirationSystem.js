// InspirationSystem.js — 灵感系统
// 灵感是墨境探索的核心动力，替代固定倒计时

export function createInspirationSystem(initialEnergy = 100) {
  const state = {
    energy:       initialEnergy,  // 精力 0-100, 归零强制返回
    inspiration:  30,             // 灵感 0-100, 影响稀有事件概率
    maxEnergy:    initialEnergy,
    discoveriesThisRun: 0,        // 本次探索发现数
    rareEventThreshold: 60,       // 灵感超过此值触发稀有事件
  };

  // 消耗精力（随时间流逝）
  function tick(amount = 0.05) {
    state.energy = Math.max(0, state.energy - amount);
    return state.energy <= 0 ? "exhausted" : "ok";
  }

  // 发现新生物
  function onDiscover(creature) {
    const reward = creature.discoveryReward;
    state.inspiration = Math.min(100, state.inspiration + (reward.inspiration || 5));
    state.discoveriesThisRun++;
    return {
      inspirationGained: reward.inspiration || 5,
      newTotal: state.inspiration,
    };
  }

  // 记录生物（录入图鉴）
  function onRecord(creature) {
    const reward = creature.discoveryReward;
    state.inspiration = Math.min(100, state.inspiration + (reward.recordInspiration || 10));
    return {
      inspirationGained: reward.recordInspiration || 10,
      newTotal: state.inspiration,
    };
  }

  // 捕获/净化生物
  function onCapture(creature) {
    const reward = creature.discoveryReward;
    state.inspiration = Math.min(100, state.inspiration + (reward.captureInspiration || 20));
    return {
      inspirationGained: reward.captureInspiration || 20,
      newTotal: state.inspiration,
    };
  }

  // 受伤
  function onHurt(amount = 10) {
    state.inspiration = Math.max(0, state.inspiration - amount);
    state.energy = Math.max(0, state.energy - amount * 0.5);
    return {
      inspirationLost: amount,
      energyLost: amount * 0.5,
    };
  }

  // 重复击杀同类（刷怪惩罚）
  function onRepeatKill() {
    const penalty = 3;
    state.inspiration = Math.max(0, state.inspiration - penalty);
    return { inspirationLost: penalty };
  }

  // 是否可能触发稀有事件
  function canTriggerRareEvent() {
    return state.inspiration >= state.rareEventThreshold;
  }

  // 获取稀有事件概率（灵感越高概率越大）
  function getRareEventChance() {
    if (state.inspiration < state.rareEventThreshold) return 0;
    return Math.min(0.3, (state.inspiration - state.rareEventThreshold) / 200);
  }

  // 重置（新一晚）
  function reset(energy) {
    state.energy = energy ?? initialEnergy;
    state.inspiration = 30;
    state.discoveriesThisRun = 0;
  }

  return {
    state,
    tick,
    onDiscover,
    onRecord,
    onCapture,
    onHurt,
    onRepeatKill,
    canTriggerRareEvent,
    getRareEventChance,
    reset,
  };
}
