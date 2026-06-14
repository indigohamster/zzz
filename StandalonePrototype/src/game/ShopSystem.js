/**
 * 商店系统 (ShopSystem.js)
 * 最小可玩版本 - 使用现有数据结构扩展
 * 
 * 功能：
 * 1. 灵感恢复（消耗货币恢复灵感）
 * 2. 武器强化（购买遗迹应用到武器）
 * 3. 临时Buff（消耗货币获得临时效果）
 * 
 * 设计原则：
 * - 使用现有 UI 风格（label() 函数）
 * - 不新增复杂动画
 * - 不重构奖励系统
 * - 支持后续扩展
 */

import { INK_RELICS, getInkRelic } from "./builds/InkRelics.js";

// ========== 商品数据结构 ==========

// 灵感恢复商品
const INSPIRATION_ITEMS = [
  {
    id: "inspiration_small",
    name: "灵感恢复（小）",
    desc: "恢复 20 点灵感",
    price: 10,
    type: "inspiration_restore",
    value: 20,
    icon: "💡",
  },
  {
    id: "inspiration_medium",
    name: "灵感恢复（中）",
    desc: "恢复 50 点灵感",
    price: 20,
    type: "inspiration_restore",
    value: 50,
    icon: "💡",
  },
  {
    id: "inspiration_large",
    name: "灵感恢复（大）",
    desc: "恢复 100 点灵感",
    price: 35,
    type: "inspiration_restore",
    value: 100,
    icon: "💡",
  },
];

// 武器强化商品（使用现有 INK_RELICS 系统）
const WEAPON_UPGRADE_ITEMS = INK_RELICS.map((relic) => ({
  id: `upgrade_${relic.id}`,
  name: relic.name,
  desc: relic.desc,
  price: calculateRelicPrice(relic),
  type: "weapon_upgrade",
  relicId: relic.id,
  icon: "⚔️",
  tags: relic.tags,
}));

// 临时Buff商品
const TEMP_BUFF_ITEMS = [
  {
    id: "buff_damage",
    name: "伤害提升",
    desc: "下次战斗伤害 +20%",
    price: 15,
    type: "temp_buff",
    buff: { stat: "damage", value: 1.2, duration: "next_battle" },
    icon: "🔥",
  },
  {
    id: "buff_speed",
    name: "速度提升",
    desc: "下次战斗攻速 +15%",
    price: 15,
    type: "temp_buff",
    buff: { stat: "attackSpeed", value: 1.15, duration: "next_battle" },
    icon: "⚡",
  },
  {
    id: "buff_health",
    name: "生命提升",
    desc: "下次战斗最大生命 +30",
    price: 20,
    type: "temp_buff",
    buff: { stat: "maxHp", value: 30, duration: "next_battle" },
    icon: "❤️",
  },
  {
    id: "buff_luck",
    name: "幸运提升",
    desc: "下次战斗暴击率 +10%",
    price: 18,
    type: "temp_buff",
    buff: { stat: "critChance", value: 0.1, duration: "next_battle" },
    icon: "🍀",
  },
];

// ========== 工具函数 ==========

// 计算遗迹价格（根据遗迹强度）
function calculateRelicPrice(relic) {
  let basePrice = 25;
  
  // 根据 modifiers 数量调整价格
  const modifierCount = relic.modifiers?.length ?? 0;
  basePrice += modifierCount * 10;
  
  // 根据 modifier 数值调整价格
  if (relic.modifiers) {
    for (const mod of relic.modifiers) {
      if (mod.value > 1.3) basePrice += 10; // 高加成
      if (mod.value < 1.1 && mod.value > 0) basePrice -= 5; // 低加成
    }
  }
  
  return Math.max(15, basePrice); // 最低 15 货币
}

// 获取所有商品（按类型分组）
export function getAllShopItems() {
  return {
    inspiration: INSPIRATION_ITEMS,
    upgrades: WEAPON_UPGRADE_ITEMS,
    buffs: TEMP_BUFF_ITEMS,
  };
}

// 根据 ID 获取商品
export function getShopItemById(itemId) {
  const allItems = [
    ...INSPIRATION_ITEMS,
    ...WEAPON_UPGRADE_ITEMS,
    ...TEMP_BUFF_ITEMS,
  ];
  return allItems.find((item) => item.id === itemId) ?? null;
}

// ========== 购买逻辑 ==========

// 购买商品
export function buyShopItem(gameState, itemId) {
  const item = getShopItemById(itemId);
  if (!item) return { success: false, message: "商品不存在" };
  
  // 检查货币是否足够
  if (gameState.money < item.price) {
    return { success: false, message: `货币不足！需要 ${item.price}，当前 ${gameState.money}` };
  }
  
  // 扣除货币
  gameState.money -= item.price;
  
  // 应用商品效果
  const result = applyItemEffect(gameState, item);
  
  return {
    success: true,
    message: result.message,
    item,
  };
}

// 应用商品效果
function applyItemEffect(gameState, item) {
  switch (item.type) {
    case "inspiration_restore":
      return applyInspirationRestore(gameState, item);
    
    case "weapon_upgrade":
      return applyWeaponUpgrade(gameState, item);
    
    case "temp_buff":
      return applyTempBuff(gameState, item);
    
    default:
      return { message: "未知商品类型" };
  }
}

// 应用灵感恢复
function applyInspirationRestore(gameState, item) {
  const oldInspiration = gameState.status.inspiration;
  gameState.status.inspiration = Math.min(100, gameState.status.inspiration + item.value);
  const restored = gameState.status.inspiration - oldInspiration;
  
  return {
    message: `灵感恢复了 ${restored} 点！（当前 ${gameState.status.inspiration}/100）`,
  };
}

// 应用武器强化（添加遗迹到 buildState）
function applyWeaponUpgrade(gameState, item) {
  const buildState = gameState.buildState;
  if (!buildState) {
    return { message: "无法应用武器强化：buildState 不存在" };
  }
  
  // 检查是否已经拥有该遗迹
  if (buildState.relics.includes(item.relicId)) {
    return { message: `已经拥有遗迹：${item.name}` };
  }
  
  // 添加遗迹到 buildState
  buildState.addRelic(item.relicId);
  
  return {
    message: `武器强化成功！获得遗迹：${item.name}`,
  };
}

// 应用临时Buff
function applyTempBuff(gameState, item) {
  // 初始化 tempBuffs 数组（如果不存在）
  if (!gameState.tempBuffs) gameState.tempBuffs = [];
  
  // 添加 Buff 到临时 Buff 列表
  gameState.tempBuffs.push({
    ...item.buff,
    source: item.id,
    remainingBattles: 1, // 持续 1 场战斗
  });
  
  return {
    message: `获得临时 Buff：${item.name}（持续 1 场战斗）`,
  };
}

// ========== 货币系统 ==========

// 获取玩家当前货币
export function getMoney(gameState) {
  return gameState.money ?? 0;
}

// 增加货币（例如：完成战斗、完成工作事件等）
export function addMoney(gameState, amount) {
  gameState.money = (gameState.money ?? 0) + amount;
  console.log(`[Shop] 获得 ${amount} 货币，当前：${gameState.money}`);
  return gameState.money;
}

// 扣除货币
export function deductMoney(gameState, amount) {
  if (gameState.money < amount) return false;
  gameState.money -= amount;
  return true;
}

// ========== 商店状态管理 ==========

// 创建商店状态
export function createShopState() {
  return {
    selectedIndex: 0,        // 当前选中的商品索引
    selectedCategory: "inspiration", // 当前选中的分类
    message: "",              // 显示消息（购买成功/失败）
    messageTimer: 0,          // 消息显示计时器
  };
}

// 获取当前分类的商品列表
export function getItemsByCategory(category) {
  const allItems = getAllShopItems();
  return allItems[category] ?? [];
}

// 获取所有分类
export function getCategories() {
  return [
    { id: "inspiration", name: "灵感恢复", icon: "💡" },
    { id: "upgrades", name: "武器强化", icon: "⚔️" },
    { id: "buffs", name: "临时 Buff", icon: "🔥" },
  ];
}

// ========== 临时 Buff 消耗 ==========

// 消耗临时 Buff（在战斗结束后调用）
export function consumeTempBuffs(gameState) {
  if (!gameState.tempBuffs) return [];
  
  const consumed = [...gameState.tempBuffs];
  gameState.tempBuffs = []; // 清空临时 Buff
  
  console.log("[Shop] 消耗临时 Buff:", consumed);
  return consumed;
}

// 获取当前有效的临时 Buff（战斗时调用）
export function getActiveTempBuffs(gameState) {
  return gameState.tempBuffs ?? [];
}

// ========== 调试函数 ==========

// 添加调试货币（方便测试）
export function debugAddMoney(gameState, amount = 100) {
  addMoney(gameState, amount);
  console.log(`[Shop Debug] 添加 ${amount} 货币，当前：${gameState.money}`);
}

// 列出所有商品（调试用）
export function debugListAllItems() {
  const allItems = getAllShopItems();
  for (const category of Object.keys(allItems)) {
    console.log(`[Shop Debug] 分类：${category}`);
    for (const item of allItems[category]) {
      console.log(`  - ${item.name} (${item.price} 货币)：${item.desc}`);
    }
  }
}
