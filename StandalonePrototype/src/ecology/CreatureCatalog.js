// CreatureCatalog.js — 6 种测试生物完整数据
// 墨境创意生态 Demo 生物目录

import { CREATURE_CLASS, TEMPERAMENT, BEHAVIOR, DEPTH_LAYER } from "./CreatureTypes.js";

export const CREATURE_CATALOG = {

  // ========== 灵感生物 ==========

  ink_blob: {
    id: "ink_blob",
    name: "墨团兽",
    nameEn: "Ink Blob",
    class: CREATURE_CLASS.INSPIRATION,
    temperament: TEMPERAMENT.TIMID,
    behavior: BEHAVIOR.FLEE,
    layer: DEPTH_LAYER.SHALLOWS,
    rarity: "common",

    // 视觉
    size: { w: 18, h: 14 },
    color: "#2d2d2d",
    spriteId: "inkdot",
    spriteHeight: 30,
    animFrames: 4,

    // 交互
    captureDifficulty: 1,       // 1-5, 越低越容易
    preferredTool: "brush",     // 用毛笔最容易记录
    hp: 8,                      // 轻微伤害就能击败（不鼓励）
    contactDamage: 0,           // 不造成伤害

    // 行为参数
    fleeSpeed: 1.8,
    fleeDistance: 180,
    detectionRadius: 100,

    // 奖励
    discoveryReward: {
      inspiration: 8,           // 发现灵感 +8
      recordInspiration: 15,    // 记录后额外灵感 +15
      captureInspiration: 20,   // 捕获后额外灵感 +20
      fragments: 0,             // 母题碎片
    },

    // 图鉴
    codexEntry: {
      summary: "圆滚滚的小墨团，是墨境中最常见的居民。它们由散落的墨滴凝聚而成，胆小但无害。",
      likes: "安静的角落、未干的墨迹",
      dislikes: "突然的动作、明亮的灯光",
      note: "墨团兽似乎记得每一个来过墨境的画家。它们不记脸，但记笔触。",
      category: "灵感生物 · 浅层",
    },
  },

  sketch_fox: {
    id: "sketch_fox",
    name: "线稿狐",
    nameEn: "Sketch Fox",
    class: CREATURE_CLASS.INSPIRATION,
    temperament: TEMPERAMENT.ALERT,
    behavior: BEHAVIOR.AVOID,
    layer: DEPTH_LAYER.DEPTHS,
    rarity: "uncommon",

    size: { w: 26, h: 18 },
    color: "#4a4a4a",
    spriteId: "margin_eel",
    spriteHeight: 36,
    animFrames: 6,

    captureDifficulty: 3,
    preferredTool: "pen",
    hp: 16,
    contactDamage: 0,

    fleeSpeed: 2.4,
    fleeDistance: 220,
    detectionRadius: 140,

    discoveryReward: {
      inspiration: 12,
      recordInspiration: 25,
      captureInspiration: 35,
      fragments: 1,
    },

    codexEntry: {
      summary: "由未完成的草稿线条凝聚而成的狐形生物。它们藏在结构线和透视线之间，只有最耐心的画家才能接近。",
      likes: "草稿纸的纹理、石墨的气味",
      dislikes: "被注视超过 3 秒",
      note: "线稿狐的尾巴是一条未连接的辅助线。如果你把它连上，它就不会再逃跑了——但那样它就不叫'草稿'了。",
      category: "灵感生物 · 深层",
    },
  },

  gesture_bird: {
    id: "gesture_bird",
    name: "速写鸟",
    nameEn: "Gesture Bird",
    class: CREATURE_CLASS.INSPIRATION,
    temperament: TEMPERAMENT.PLAYFUL,
    behavior: BEHAVIOR.FLY_BY,
    layer: DEPTH_LAYER.DEPTHS,
    rarity: "rare",

    size: { w: 22, h: 12 },
    color: "#3a3a5c",
    spriteId: "paper_kite",
    spriteHeight: 36,
    animFrames: 8,

    captureDifficulty: 4,
    preferredTool: "ink_whip",
    hp: 10,
    contactDamage: 0,

    fleeSpeed: 3.2,
    fleeDistance: 300,
    detectionRadius: 160,
    flyDuration: 90,        // 出现后消失的帧数
    flyHeight: 60,

    discoveryReward: {
      inspiration: 18,
      recordInspiration: 30,
      captureInspiration: 45,
      fragments: 2,
    },

    codexEntry: {
      summary: "由 30 秒速写练习中诞生的生物。它们飞得极快，出现时间很短——就像灵感本身。",
      likes: "快速的笔触、动态的线条",
      dislikes: "停留、犹豫、反复修改",
      note: "速写鸟从不落在同一根线条上两次。有人说它只存在于从'想画'到'下笔'之间的那个瞬间。",
      category: "灵感生物 · 深层",
    },
  },

  // ========== 负面创意 ==========

  revision_wraith: {
    id: "revision_wraith",
    name: "涂改鬼",
    nameEn: "Revision Wraith",
    class: CREATURE_CLASS.NEGATIVE,
    temperament: TEMPERAMENT.ERRATIC,
    behavior: BEHAVIOR.ERASE,
    layer: DEPTH_LAYER.DEPTHS,
    rarity: "uncommon",

    size: { w: 30, h: 28 },
    color: "#8b6b7d",
    spriteId: "binder",
    spriteHeight: 46,
    animFrames: 5,

    captureDifficulty: -1,      // 不可捕获
    preferredTool: "cutter",    // 可以用裁纸刀驱散
    hp: 22,
    contactDamage: 4,

    fleeSpeed: 0,
    fleeDistance: 0,
    detectionRadius: 200,
    eraseRadius: 40,            // 抹除范围

    discoveryReward: {
      inspiration: -5,          // 遇到反而减少灵感
      recordInspiration: 10,    // 但记录它能获得见解
      captureInspiration: 0,
      fragments: 0,
    },

    codexEntry: {
      summary: "反复修改的执念化成的实体。它会抹除周围的环境——线条、颜色、甚至记忆。",
      likes: "不完美的线条、犹豫的笔触",
      dislikes: "果断的一笔、裁纸刀",
      note: "涂改鬼并不是恶意的。它们只是太想让一切变得'更好'——好到什么都没有留下。",
      category: "负面创意 · 深层",
    },
  },

  // ========== 模板生物 ==========

  template_wolf: {
    id: "template_wolf",
    name: "模板狼",
    nameEn: "Template Wolf",
    class: CREATURE_CLASS.TEMPLATE,
    temperament: TEMPERAMENT.AGGRESSIVE,
    behavior: BEHAVIOR.PATROL,
    layer: DEPTH_LAYER.ABYSS,
    rarity: "uncommon",

    size: { w: 36, h: 24 },
    color: "#6b8fa3",
    spriteId: "sketchling",
    spriteHeight: 38,
    animFrames: 6,

    captureDifficulty: -1,
    preferredTool: null,        // 没有偏好工具——模板没有弱点
    hp: 35,
    contactDamage: 8,

    patrolSpeed: 1.2,
    patrolRange: 150,
    detectionRadius: 180,
    attackRange: 50,
    attackCooldown: 90,

    discoveryReward: {
      inspiration: -10,
      recordInspiration: 15,
      captureInspiration: 0,
      fragments: 3,
    },

    codexEntry: {
      summary: "动作流畅，外观精致，但所有个体完全一样。它们的皮毛纹理是复制粘贴的，连呼吸的节奏都同步。",
      likes: "秩序、重复、完美的对称",
      dislikes: "不规则、手绘痕迹、'错误'",
      note: "检查了 12 只模板狼。没有发现任何个体差异。连咬的位置都是同一个像素。",
      category: "模板生物 · 深渊",
    },
  },

  // ========== 畸变体 ==========

  half_sketched_fox: {
    id: "half_sketched_fox",
    name: "半稿狐",
    nameEn: "Half-Sketched Fox",
    class: CREATURE_CLASS.HYBRID,
    temperament: TEMPERAMENT.ERRATIC,
    behavior: BEHAVIOR.WANDER,
    layer: DEPTH_LAYER.ABYSS,
    rarity: "rare",

    size: { w: 28, h: 20 },
    color: "#5a4a6a",
    spriteId: "inkmite",
    spriteHeight: 34,
    animFrames: 7,

    captureDifficulty: 4,
    preferredTool: "brush",     // 毛笔可以净化
    altTool: "pen",             // 钢笔可以记录（但非净化）
    hp: 28,
    contactDamage: 5,

    fleeSpeed: 0,
    fleeDistance: 0,
    detectionRadius: 150,
    purificationThreshold: 0.6, // 灵感 > 60% 才能净化

    discoveryReward: {
      inspiration: 5,
      recordInspiration: 20,
      captureInspiration: 50,   // 净化/救回奖励极高
      fragments: 5,
    },

    codexEntry: {
      summary: "一半是粗糙的手绘线稿，一半是光滑的模板材质。它在两种存在方式之间痛苦地闪烁。",
      likes: "不确定。它似乎对一切都又渴望又恐惧。",
      dislikes: "不确定。它甚至不确定自己讨厌什么。",
      note: "它让我想起自己。当客户说'用 AI 再修一下'的时候，我画的那一半就开始疼。",
      category: "畸变体 · 深渊",
    },
  },
};

// 按层级获取生物列表
export function getCreaturesByLayer(layer) {
  return Object.values(CREATURE_CATALOG).filter(c => c.layer === layer);
}

// 按大类获取
export function getCreaturesByClass(cls) {
  return Object.values(CREATURE_CATALOG).filter(c => c.class === cls);
}

// 获取单个生物数据
export function getCreature(id) {
  return CREATURE_CATALOG[id] ?? null;
}

// 所有生物 ID 列表
export function getAllCreatureIds() {
  return Object.keys(CREATURE_CATALOG);
}
