// DiscoveryJournal.js — 图鉴记录系统
// 追踪玩家见过/记录过/捕获过的生物

import { getAllCreatureIds, getCreature, CREATURE_CATALOG } from "./CreatureCatalog.js";
import { CREATURE_CLASS } from "./CreatureTypes.js";

export function createDiscoveryJournal() {
  // 每个生物的状态: "unseen" | "seen" | "recorded" | "captured"
  const entries = {};
  for (const id of getAllCreatureIds()) {
    entries[id] = "unseen";
  }

  // 额外统计
  const stats = {
    totalSeen: 0,
    totalRecorded: 0,
    totalCaptured: 0,
    byClass: {
      [CREATURE_CLASS.INSPIRATION]: 0,
      [CREATURE_CLASS.MOTIF]: 0,
      [CREATURE_CLASS.NEGATIVE]: 0,
      [CREATURE_CLASS.TEMPLATE]: 0,
      [CREATURE_CLASS.HYBRID]: 0,
    },
  };

  // 标记为见过
  function markSeen(creatureId) {
    if (!entries[creatureId] || entries[creatureId] === "unseen") {
      entries[creatureId] = "seen";
      stats.totalSeen++;
      const creature = getCreature(creatureId);
      if (creature) stats.byClass[creature.class] = (stats.byClass[creature.class] || 0) + 1;
      return true; // 首次发现
    }
    return false;
  }

  // 标记为已记录
  function markRecorded(creatureId) {
    if (!entries[creatureId] || entries[creatureId] === "unseen") {
      markSeen(creatureId);
    }
    if (entries[creatureId] !== "recorded" && entries[creatureId] !== "captured") {
      entries[creatureId] = "recorded";
      stats.totalRecorded++;
      return true;
    }
    return false;
  }

  // 标记为已捕获/净化
  function markCaptured(creatureId) {
    if (!entries[creatureId] || entries[creatureId] === "unseen") {
      markSeen(creatureId);
    }
    if (entries[creatureId] !== "captured") {
      const wasRecorded = entries[creatureId] === "recorded";
      entries[creatureId] = "captured";
      if (!wasRecorded) stats.totalRecorded++;
      stats.totalCaptured++;
      return true;
    }
    return false;
  }

  // 获取生物图鉴条目
  function getCodexEntry(creatureId) {
    const creature = getCreature(creatureId);
    if (!creature) return null;
    return {
      ...creature.codexEntry,
      id: creature.id,
      name: creature.name,
      nameEn: creature.nameEn,
      class: creature.class,
      layer: creature.layer,
      rarity: creature.rarity,
      status: entries[creatureId] || "unseen",
      preferredTool: creature.preferredTool,
      discoveryReward: creature.discoveryReward,
    };
  }

  // 获取所有条目（按状态排序：已捕获 > 已记录 > 见过 > 未见）
  function getAllEntries() {
    const order = { captured: 0, recorded: 1, seen: 2, unseen: 3 };
    return getAllCreatureIds()
      .map(id => getCodexEntry(id))
      .filter(Boolean)
      .sort((a, b) => order[a.status] - order[b.status]);
  }

  // 完成度百分比
  function getCompletion() {
    const total = getAllCreatureIds().length;
    const completed = stats.totalCaptured + stats.totalRecorded;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  return {
    entries,
    stats,
    markSeen,
    markRecorded,
    markCaptured,
    getCodexEntry,
    getAllEntries,
    getCompletion,
  };
}
