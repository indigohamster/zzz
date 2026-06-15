// CreatureTypes.js — 生物分类、性格、行为枚举
// 墨境创意生态系统的类型定义

// 生物大类
export const CREATURE_CLASS = {
  INSPIRATION: "inspiration",   // 灵感生物 — 温和、可收集
  MOTIF:       "motif",          // 母题生物 — 稀有、传奇级
  NEGATIVE:    "negative",       // 负面创意 — 创作阻力具象化
  TEMPLATE:    "template",       // 模板生物 — AI/模板化
  HYBRID:      "hybrid",         // 畸变体 — 半手绘半模板
};

// 性格
export const TEMPERAMENT = {
  TIMID:   "timid",     // 胆小 — 见人逃跑
  ALERT:   "alert",     // 警觉 — 保持距离，被靠近才跑
  CURIOUS: "curious",   // 好奇 — 靠近观察玩家
  PLAYFUL: "playful",   // 活泼 — 快速移动，难以预测
  CALM:    "calm",      // 温和 — 缓慢移动，不逃跑
  AGGRESSIVE: "aggressive", // 攻击性 — 主动攻击
  TERRITORIAL: "territorial", // 领地 — 靠近一定范围才攻击
  ERRATIC:  "erratic",  // 混乱 — 行为不可预测（畸变体）
};

// 行为模式
export const BEHAVIOR = {
  FLEE:        "flee",         // 逃跑
  WANDER:      "wander",       // 漫游
  PATROL:      "patrol",       // 巡逻（固定路线）
  STATIONARY:  "stationary",   // 静止
  FOLLOW:      "follow",       // 跟随玩家
  AVOID:       "avoid",        // 保持距离
  ATTACK:      "attack",       // 攻击
  DEFEND:      "defend",       // 防御（被攻击后反击）
  FLY_BY:      "fly_by",       // 快速飞过（速写鸟）
  ERASE:       "erase",        // 抹除地形（涂改鬼）
  COPY:        "copy",         // 自我复制（完美主义者/模板）
  POLLUTE:     "pollute",      // 污染周围（畸变体）
  LEAD:        "lead",         // 引导玩家（纸页鹿）
};

// 玩家可以执行的交互行为
export const INTERACTION = {
  OBSERVE:  "observe",   // 观察 — 靠近即可，加少量灵感
  RECORD:   "record",    // 记录 — 需要工具和时机，录入图鉴
  CAPTURE:  "capture",   // 捕获 — 需要特定工具，带回工作室
  DISPERSE: "disperse",  // 驱散 — 击退但不击杀
  PURIFY:   "purify",    // 净化 — 对畸变体专用
  DEFEAT:   "defeat",    // 击败 — 传统战斗
};

// 工具与生物偏好的映射
export const TOOL_PREFERENCE = {
  pen:                { id: "pen", name: "钢笔", desc: "精准记录线稿系" },
  cutter:             { id: "cutter", name: "裁纸刀", desc: "切开纸墙" },
  paperweight_hammer: { id: "paperweight_hammer", name: "压纸锤", desc: "击退重型负面创意" },
  brush:              { id: "brush", name: "毛笔", desc: "安抚墨系生物、净化畸变体" },
  crayon:             { id: "crayon", name: "蜡笔", desc: "吸引温和灵感生物" },
  ink_whip:           { id: "ink_whip", name: "墨鞭", desc: "勾取远处发现物、捕捉高速生物" },
};

// 层级
export const DEPTH_LAYER = {
  SHALLOWS: "shallows",   // 纸面浅层
  DEPTHS:   "depths",     // 石墨深层
  ABYSS:    "abyss",      // 墨水深渊
};
