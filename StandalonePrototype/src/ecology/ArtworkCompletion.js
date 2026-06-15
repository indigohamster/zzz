// ArtworkCompletion.js — 画作完整度系统
// 主角有一幅核心作品，从墨境带回的元素逐步填充它

import { COMPONENT_TYPE } from "./DiscoveryItems.js";

export function createArtworkCompletion() {
  const state = {
    total: 0,             // 总完整度 0-100
    components: {
      [COMPONENT_TYPE.COLOR]:       0,
      [COMPONENT_TYPE.LINE]:        0,
      [COMPONENT_TYPE.EMOTION]:     0,
      [COMPONENT_TYPE.COMPOSITION]: 0,
      [COMPONENT_TYPE.CHARACTER]:   0,
      [COMPONENT_TYPE.STORY]:       0,
      [COMPONENT_TYPE.MOTIF]:       0,
    },
    discoveries: [],      // 本次探索带回的发现物 [{item, jackpot}]
    milestones: [],       // 已达成的里程碑
    totalDiscoveries: 0,  // 累计发现物数量
    jackpotsHit: 0,       // 累计头奖次数
    unlockedTools: ["brush"], // 已解锁的工具
    unlockedGateTypes: ["warm_doodle"], // 已解锁的画稿入口类型
  };

  const MILESTONES = [
    { at: 10,  reward: { type: "tool", id: "pen" },          message: "解锁工具：钢笔" },
    { at: 20,  reward: { type: "gate", id: "horror_sketch" }, message: "解锁画稿入口：恐怖草图" },
    { at: 30,  reward: { type: "tool", id: "cutter" },        message: "解锁工具：裁纸刀" },
    { at: 45,  reward: { type: "gate", id: "ai_template" },   message: "解锁画稿入口：AI模板画稿" },
    { at: 55,  reward: { type: "tool", id: "paperweight_hammer" }, message: "解锁工具：压纸锤" },
    { at: 70,  reward: { type: "tool", id: "ink_whip" },      message: "解锁工具：墨鞭" },
    { at: 85,  reward: { type: "narrative", id: "climax" },   message: "作品接近完成..." },
    { at: 100, reward: { type: "ending", id: "complete" },     message: "作品完成！" },
  ];

  function addDiscovery(item, isJackpot = false) {
    state.discoveries.push({ item: { ...item }, jackpot: isJackpot });
    state.totalDiscoveries++;
    if (isJackpot) state.jackpitsHit++;

    // 应用完整度
    const value = isJackpot ? (item.jackpotCompletionValue || item.baseValue) : item.baseValue;
    state.components[item.component] = (state.components[item.component] || 0) + value;

    // 重新计算总完整度
    const total = Object.values(state.components).reduce((s, v) => s + v, 0);
    state.total = Math.min(100, total);

    // 检查里程碑
    const newMilestones = [];
    for (const m of MILESTONES) {
      if (state.total >= m.at && !state.milestones.includes(m.at)) {
        state.milestones.push(m.at);
        newMilestones.push(m);
        // 应用里程碑奖励
        if (m.reward.type === "tool" && !state.unlockedTools.includes(m.reward.id)) {
          state.unlockedTools.push(m.reward.id);
        }
        if (m.reward.type === "gate" && !state.unlockedGateTypes.includes(m.reward.id)) {
          state.unlockedGateTypes.push(m.reward.id);
        }
      }
    }

    return {
      value,
      component: item.component,
      newTotal: state.total,
      isJackpot,
      newMilestones,
    };
  }

  function flushDiscoveries() {
    const result = [...state.discoveries];
    state.discoveries = [];
    return result;
  }

  function getComponentBreakdown() {
    return Object.entries(state.components)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([k, v]) => ({ component: k, value: v }));
  }

  return {
    state,
    addDiscovery,
    flushDiscoveries,
    getComponentBreakdown,
  };
}
