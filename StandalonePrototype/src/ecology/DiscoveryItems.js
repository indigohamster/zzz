// DiscoveryItems.js — 发现物定义 + 开奖机制
// 玩家在画稿世界和主地图中收集的"灵感碎片"

// 灵感组件类型（对应画作完整度的不同维度）
export const COMPONENT_TYPE = {
  COLOR:       "color",        // 色彩
  LINE:        "line",         // 线条
  EMOTION:     "emotion",      // 情绪
  COMPOSITION: "composition",  // 构图
  CHARACTER:   "character",    // 角色
  STORY:       "story",        // 故事
  MOTIF:       "motif",        // 母题
};

// ========== 普通发现物（画稿世界中采集） ==========
export const DISCOVERY_ITEMS = {
  // --- 温馨画稿掉落 ---
  crayon_fragment: {
    id: "crayon_fragment",
    name: "蜡笔碎片",
    desc: "一小截用秃的蜡笔，还带着孩子手掌的温度。",
    component: COMPONENT_TYPE.COLOR,
    baseValue: 2,
    rarity: "common",
    tags: ["warm", "childhood", "color"],
    icon: "🖍",
  },
  doodle_line: {
    id: "doodle_line",
    name: "涂鸦线条",
    desc: "一条歪歪扭扭但毫不犹豫的线。你不知道它要画什么，但你知道它很开心。",
    component: COMPONENT_TYPE.LINE,
    baseValue: 2,
    rarity: "common",
    tags: ["warm", "line", "free"],
    icon: "✏",
  },
  warm_memory: {
    id: "warm_memory",
    name: "温暖回忆",
    desc: "一团模糊的金色光斑。可能是某个下午的阳光，可能是某个人对你笑。",
    component: COMPONENT_TYPE.EMOTION,
    baseValue: 3,
    rarity: "uncommon",
    tags: ["warm", "emotion", "memory"],
    icon: "☀",
  },
  child_drawing: {
    id: "child_drawing",
    name: "儿童画",
    desc: "一张皱巴巴的画。画的是小猫、太阳、和一个比例完全不对的人。",
    component: COMPONENT_TYPE.COMPOSITION,
    baseValue: 3,
    rarity: "uncommon",
    tags: ["warm", "composition", "innocent"],
    icon: "🖼",
  },

  // --- 恐怖画稿掉落 ---
  shadow_sketch: {
    id: "shadow_sketch",
    name: "暗影速写",
    desc: "一张只画了阴影的稿子。光源来自一个不存在的方向。",
    component: COMPONENT_TYPE.COMPOSITION,
    baseValue: 3,
    rarity: "uncommon",
    tags: ["dark", "composition", "shadow"],
    icon: "🌑",
  },
  broken_line: {
    id: "broken_line",
    name: "断裂线条",
    desc: "一条在中途突然断开的线。断开的地方有反复描画的痕迹。",
    component: COMPONENT_TYPE.LINE,
    baseValue: 3,
    rarity: "uncommon",
    tags: ["dark", "line", "struggle"],
    icon: "➖",
  },
  fear_essence: {
    id: "fear_essence",
    name: "恐惧精华",
    desc: "一滴浓稠的黑色物质。闻起来像橡皮擦屑和冷汗。",
    component: COMPONENT_TYPE.EMOTION,
    baseValue: 4,
    rarity: "rare",
    tags: ["dark", "emotion", "fear"],
    icon: "💧",
  },
  monster_concept: {
    id: "monster_concept",
    name: "怪物概念稿",
    desc: "一张被划掉多次的怪物设计。每个版本都比上一个更可怕，但设计者似乎一直不满意。",
    component: COMPONENT_TYPE.MOTIF,
    baseValue: 5,
    rarity: "rare",
    tags: ["dark", "motif", "monster"],
    icon: "👹",
  },

  // --- AI 模板画稿掉落 ---
  template_shard: {
    id: "template_shard",
    name: "模板碎片",
    desc: "一块完美但毫无温度的图像碎片。分辨率很高，但没有笔触。",
    component: COMPONENT_TYPE.COMPOSITION,
    baseValue: 2,
    rarity: "common",
    tags: ["ai", "template", "cold"],
    icon: "🔲",
  },
  prompt_remnant: {
    id: "prompt_remnant",
    name: "提示词残片",
    desc: "一串模糊的关键词：'masterpiece' 'trending' '4k' 'detailed'。它们排列得很整齐，像墓碑。",
    component: COMPONENT_TYPE.STORY,
    baseValue: 3,
    rarity: "uncommon",
    tags: ["ai", "story", "prompt"],
    icon: "📝",
  },
  anti_template_core: {
    id: "anti_template_core",
    name: "反模板核心",
    desc: "一颗不规则的晶体。它在模板的完美网格中生长出来，像裂缝中开出的花。",
    component: COMPONENT_TYPE.MOTIF,
    baseValue: 6,
    rarity: "rare",
    tags: ["ai", "motif", "resistance"],
    icon: "💠",
  },
  hybrid_sample: {
    id: "hybrid_sample",
    name: "畸变样本",
    desc: "一块半有机半几何的组织。它的存在本身就是一种宣言：完美是可以被污染的。",
    component: COMPONENT_TYPE.CHARACTER,
    baseValue: 5,
    rarity: "rare",
    tags: ["ai", "hybrid", "character"],
    icon: "🧬",
  },

  // --- 通用稀有 ---
  ink_core_childhood: {
    id: "ink_core_childhood",
    name: "童年灵感核心",
    desc: "一颗温热的墨滴。它记得你小时候画的第一只猫。那只猫的眼睛画得很大，因为你觉得猫应该能看清楚一切。",
    component: COMPONENT_TYPE.EMOTION,
    baseValue: 15,
    rarity: "legendary",
    tags: ["jackpot", "emotion", "childhood"],
    icon: "💎",
  },
  ink_core_master: {
    id: "ink_core_master",
    name: "大师灵感核心",
    desc: "一颗沉静的墨滴。你仿佛能听到一个老画家在说：'不要画完美的东西。画真实的东西。'",
    component: COMPONENT_TYPE.MOTIF,
    baseValue: 20,
    rarity: "legendary",
    tags: ["jackpot", "motif", "master"],
    icon: "💎",
  },
};

// ========== 开奖机制 ==========

// 每个灵感生物的头奖概率表
export const JACKPOT_TABLE = {
  ink_blob: {
    chance: 0.03,          // 3% 概率触发头奖
    pool: [
      { id: "ink_core_childhood", weight: 7 },
      { id: "ink_core_master", weight: 3 },
    ],
  },
  sketch_fox: {
    chance: 0.05,
    pool: [
      { id: "ink_core_childhood", weight: 5 },
      { id: "ink_core_master", weight: 5 },
    ],
  },
  gesture_bird: {
    chance: 0.08,
    pool: [
      { id: "ink_core_childhood", weight: 4 },
      { id: "ink_core_master", weight: 6 },
    ],
  },
  half_sketched_fox: {
    chance: 0.12,
    pool: [
      { id: "ink_core_master", weight: 8 },
      { id: "anti_template_core", weight: 2 },
    ],
  },
};

// 根据生物 ID 尝试触发头奖
export function tryJackpot(creatureId) {
  const config = JACKPOT_TABLE[creatureId];
  if (!config) return null;

  if (Math.random() >= config.chance) return null;

  // 按权重抽取
  const totalWeight = config.pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of config.pool) {
    roll -= entry.weight;
    if (roll <= 0) return DISCOVERY_ITEMS[entry.id] ?? null;
  }
  return null;
}

// 按画稿类型获取掉落池
export function getDropPool(subMapType) {
  const pools = {
    warm_doodle: ["crayon_fragment", "doodle_line", "warm_memory", "child_drawing"],
    horror_sketch: ["shadow_sketch", "broken_line", "fear_essence", "monster_concept"],
    ai_template: ["template_shard", "prompt_remnant", "anti_template_core", "hybrid_sample"],
  };
  return pools[subMapType] || pools.warm_doodle;
}

// 从掉落池中随机获取发现物
export function rollDiscovery(subMapType, count = 3) {
  const pool = getDropPool(subMapType);
  const results = [];
  for (let i = 0; i < count; i++) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    results.push({ ...DISCOVERY_ITEMS[id] });
  }
  return results;
}

// 获取单个发现物
export function getDiscoveryItem(id) {
  return DISCOVERY_ITEMS[id] ?? null;
}
