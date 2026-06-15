// MapLayers.js — 墨境深度分层定义

export const MAP_LAYERS = {
  shallow: {
    id: "shallow",
    name: "浅层草稿区",
    minDepth: 0,
    maxDepth: 1,
    enemyLevel: 1,
    rewardMultiplier: 1,
    color: "#d8cfb8",
  },
  middle: {
    id: "middle",
    name: "中层废稿区",
    minDepth: 2,
    maxDepth: 3,
    enemyLevel: 2,
    rewardMultiplier: 1.5,
    color: "#67665f",
  },
  deep: {
    id: "deep",
    name: "深层模板污染区",
    minDepth: 4,
    maxDepth: 5,
    enemyLevel: 3,
    rewardMultiplier: 2.5,
    color: "#1c1c22",
  },
};
