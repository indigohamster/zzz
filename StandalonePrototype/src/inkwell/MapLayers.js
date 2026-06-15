// MapLayers.js — 分层地图数据结构
// 定义浅层/中层/深层的生成参数

export const MAP_LAYERS = [
  {
    id: "shallow",
    name: "浅层草稿区",
    depthRange: [0, 1],       // 深度索引范围
    yRange: [30, 80],         // 世界 Y 坐标范围 (tile)
    enemyLevel: 1,
    rewardMultiplier: 1.0,
    inkPressure: 0.2,         // 墨压消耗速率
    tileTheme: "paper",       // 主 tile 类型
    bgTint: "rgba(245,239,224,0.03)", // 背景色偏
    // 区域类型权重 [combat, resource, event, treasure, shop, danger, explore]
    roomWeights: [1, 4, 3, 1, 1, 0, 3],
    minRooms: 3,
    maxRooms: 5,
    description: "散落的草稿纸和未完成的线稿。墨还很淡，一切都刚开始。",
  },
  {
    id: "middle",
    name: "中层废稿区",
    depthRange: [1, 3],
    yRange: [90, 155],
    enemyLevel: 2,
    rewardMultiplier: 1.6,
    inkPressure: 0.5,
    tileTheme: "graphite",
    bgTint: "rgba(40,38,34,0.06)",
    roomWeights: [3, 2, 3, 2, 1, 2, 1],
    minRooms: 3,
    maxRooms: 5,
    description: "旧作品的残影。被划掉的构图，半途而废的角色设定。墨开始变浓。",
  },
  {
    id: "deep",
    name: "深层模板污染区",
    depthRange: [2, 5],
    yRange: [165, 240],
    enemyLevel: 3,
    rewardMultiplier: 2.5,
    inkPressure: 0.9,
    tileTheme: "ink",
    bgTint: "rgba(10,8,12,0.12)",
    roomWeights: [4, 1, 1, 0, 0, 3, 0],
    minRooms: 2,
    maxRooms: 4,
    description: "AI 生成的完美图像在这里无限重复。你画过的每一笔都在反对这种完美。",
  },
];

// 区域类型定义
export const ROOM_TYPES = {
  combat:   { name: "Copied Pose Room",  icon: "⚔", desc: "战斗区域",                hasCombat: true  },
  resource: { name: "Ink Reservoir",     icon: "◆", desc: "资源采集",                 hasCombat: false },
  event:    { name: "Forgotten Draft",   icon: "?", desc: "奇遇事件",                 hasCombat: false },
  treasure: { name: "Supply Sketch",     icon: "★", desc: "宝箱/奖励",                hasCombat: false },
  shop:     { name: "Inkdot's Nook",     icon: "◎", desc: "墨点补给站",               hasCombat: false },
  danger:   { name: "Torn Canvas",       icon: "⚠", desc: "高风险入口",               hasCombat: true  },
  explore:  { name: "Open Page",         icon: "○", desc: "空旷探索区",               hasCombat: false },
  entrance: { name: "Draft Gate",        icon: "◈", desc: "墨境入口",                 hasCombat: false },
  boss:     { name: "Boss Chamber",      icon: "⬡", desc: "深层守卫",                 hasCombat: true  },
  exit:     { name: "Return Portal",     icon: "◉", desc: "返回现实",                 hasCombat: false },
};

// 根据层级获取区域类型分布
export function rollRoomTypes(layer, count) {
  const weights = layer.roomWeights;
  const typeKeys = ["combat", "resource", "event", "treasure", "shop", "danger", "explore"];
  const types = [];
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  for (let i = 0; i < count; i++) {
    let roll = Math.random() * totalWeight;
    for (let j = 0; j < typeKeys.length; j++) {
      roll -= weights[j];
      if (roll <= 0) { types.push(typeKeys[j]); break; }
    }
    if (types.length <= i) types.push("explore");
  }
  return types;
}

// 获取当前深度对应的层级
export function getLayerByDepth(depthIndex) {
  for (const layer of MAP_LAYERS) {
    if (depthIndex >= layer.depthRange[0] && depthIndex <= layer.depthRange[1]) {
      return layer;
    }
  }
  return MAP_LAYERS[0];
}
