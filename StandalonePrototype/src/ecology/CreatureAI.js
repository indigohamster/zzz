// CreatureAI.js — 生物行为 AI
// 驱动每个生物实例的移动、反应和交互状态

import { BEHAVIOR, TEMPERAMENT, INTERACTION } from "./CreatureTypes.js";

// 创建生物实例
export function createCreatureInstance(catalogEntry, x, y) {
  return {
    // 静态数据
    catalog: catalogEntry,

    // 动态状态
    x, y,
    vx: 0, vy: 0,
    facing: 1,                // 1 = 右, -1 = 左
    alive: true,
    hp: catalogEntry.hp,
    animFrame: 0,
    animTimer: 0,

    // AI 状态
    aiState: catalogEntry.behavior,  // 当前行为状态
    aiTimer: 0,
    aiTargetX: x,
    aiTargetY: y,
    patrolDir: 1,
    patrolOrigin: x,

    // 交互状态
    interactionState: "idle", // idle | observed | being_recorded | being_captured | fleeing | enraged
    interactionTimer: 0,
    recordProgress: 0,        // 记录进度 0-100
    captureProgress: 0,       // 捕获进度 0-100

    // 玩家感知
    playerDetected: false,
    lastPlayerDistance: 999,
  };
}

// 更新单个生物
export function updateCreatureAI(creature, player, dt = 1) {
  if (!creature.alive) return;

  const cat = creature.catalog;
  const dx = player.x - creature.x;
  const dy = player.y - creature.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  creature.lastPlayerDistance = dist;

  // 更新动画
  creature.animTimer += dt;
  if (creature.animTimer >= 8) {
    creature.animTimer = 0;
    creature.animFrame = (creature.animFrame + 1) % (cat.animFrames || 4);
  }

  // 玩家察觉检测
  creature.playerDetected = dist < (cat.detectionRadius || 120);

  // 根据行为类型更新时间
  creature.aiTimer += dt;

  switch (cat.behavior) {
    case BEHAVIOR.FLEE:       updateFlee(creature, player, dist, dx, dy, dt); break;
    case BEHAVIOR.AVOID:      updateAvoid(creature, player, dist, dx, dy, dt); break;
    case BEHAVIOR.FLY_BY:     updateFlyBy(creature, player, dist, dx, dy, dt); break;
    case BEHAVIOR.PATROL:     updatePatrol(creature, player, dist, dx, dy, dt); break;
    case BEHAVIOR.WANDER:     updateWander(creature, player, dist, dx, dy, dt); break;
    case BEHAVIOR.ERASE:      updateErase(creature, player, dist, dx, dy, dt); break;
    case BEHAVIOR.STATIONARY: updateStationary(creature, player, dist, dx, dy, dt); break;
    default:                  updateWander(creature, player, dist, dx, dy, dt); break;
  }

  // 移动
  creature.x += creature.vx * dt;
  creature.y += creature.vy * dt;

  // 面向玩家方向
  if (Math.abs(dx) > 2) {
    creature.facing = dx > 0 ? 1 : -1;
  }
}

// --- 各行为更新函数 ---

function updateFlee(creature, player, dist, dx, dy, dt) {
  const cat = creature.catalog;
  if (dist < cat.detectionRadius) {
    // 远离玩家
    const fleeSpeed = cat.fleeSpeed || 1.5;
    const angle = Math.atan2(dy, dx);
    creature.vx = -Math.cos(angle) * fleeSpeed;
    creature.vy = -Math.sin(angle) * fleeSpeed * 0.5;
    creature.interactionState = "fleeing";
  } else {
    // 缓慢漫游
    if (creature.aiTimer > 60 + Math.random() * 60) {
      creature.aiTimer = 0;
      creature.vx = (Math.random() - 0.5) * 0.8;
      creature.vy = (Math.random() - 0.5) * 0.3;
    }
    creature.interactionState = "idle";
  }
}

function updateAvoid(creature, player, dist, dx, dy, dt) {
  const cat = creature.catalog;
  const safeDist = (cat.fleeDistance || 180) * 0.5;

  if (dist < safeDist) {
    // 保持距离但不完全逃跑
    const fleeSpeed = (cat.fleeSpeed || 2) * 0.6;
    const angle = Math.atan2(dy, dx);
    creature.vx = -Math.cos(angle) * fleeSpeed;
    creature.vy = -Math.sin(angle) * fleeSpeed * 0.4;
    creature.interactionState = "alert";
  } else if (dist < cat.detectionRadius) {
    // 警戒但不动
    creature.vx *= 0.9;
    creature.vy *= 0.9;
    creature.interactionState = "watching";
  } else {
    // 漫游
    if (creature.aiTimer > 80 + Math.random() * 80) {
      creature.aiTimer = 0;
      creature.vx = (Math.random() - 0.5) * 1.0;
      creature.vy = (Math.random() - 0.5) * 0.5;
    }
    creature.interactionState = "idle";
  }
}

function updateFlyBy(creature, player, dist, dx, dy, dt) {
  const cat = creature.catalog;
  const flyDuration = cat.flyDuration || 90;

  if (creature.aiTimer > flyDuration + 60 + Math.random() * 120) {
    // 出现：从远处飞过
    creature.aiTimer = 0;
    const side = Math.random() > 0.5 ? 1 : -1;
    creature.x = player.x + side * 300;
    creature.y = player.y - (cat.flyHeight || 60) + (Math.random() - 0.5) * 40;
    creature.vx = -side * (cat.fleeSpeed || 3);
    creature.vy = 0;
    creature.interactionState = "flying";
  } else if (creature.aiTimer > flyDuration) {
    // 消失（离开屏幕）
    creature.vx *= 0.95;
    creature.vy *= 0.95;
  }
  // 飞行中保持速度
}

function updatePatrol(creature, player, dist, dx, dy, dt) {
  const cat = creature.catalog;
  if (dist < cat.detectionRadius && cat.temperament === TEMPERAMENT.AGGRESSIVE) {
    // 追击玩家
    const speed = cat.patrolSpeed || 1.2;
    const angle = Math.atan2(dy, dx);
    creature.vx = Math.cos(angle) * speed * 1.5;
    creature.vy = Math.sin(angle) * speed * 0.6;
    creature.interactionState = "chasing";
  } else {
    // 巡逻
    const range = cat.patrolRange || 150;
    const speed = cat.patrolSpeed || 1.2;
    creature.vx = creature.patrolDir * speed;
    creature.vy = 0;
    creature.interactionState = "patrolling";

    if (creature.x > creature.patrolOrigin + range) creature.patrolDir = -1;
    if (creature.x < creature.patrolOrigin - range) creature.patrolDir = 1;
  }
}

function updateWander(creature, player, dist, dx, dy, dt) {
  const cat = creature.catalog;
  if (dist < cat.detectionRadius && cat.temperament === TEMPERAMENT.ERRATIC) {
    // 畸变体：行为不可预测
    const r = Math.random();
    if (r < 0.3) {
      // 靠近玩家
      creature.vx = (dx / dist) * 0.8;
      creature.vy = (dy / dist) * 0.4;
    } else if (r < 0.6) {
      // 远离
      creature.vx = -(dx / dist) * 0.8;
      creature.vy = -(dy / dist) * 0.4;
    } else {
      // 随机
      creature.vx = (Math.random() - 0.5) * 1.5;
      creature.vy = (Math.random() - 0.5) * 1.0;
    }
    creature.interactionState = "erratic";
  } else {
    // 普通漫游
    if (creature.aiTimer > 40 + Math.random() * 60) {
      creature.aiTimer = 0;
      creature.vx = (Math.random() - 0.5) * 0.6;
      creature.vy = (Math.random() - 0.5) * 0.3;
    }
    creature.vx *= 0.98;
    creature.vy *= 0.98;
    creature.interactionState = "idle";
  }
}

function updateErase(creature, player, dist, dx, dy, dt) {
  // 涂改鬼：缓慢移动，抹除周围
  if (dist < creature.catalog.detectionRadius) {
    // 向玩家漂移
    const speed = 0.5;
    creature.vx = (dx / Math.max(1, dist)) * speed;
    creature.vy = (dy / Math.max(1, dist)) * speed * 0.5;
    creature.interactionState = "erasing";
  } else {
    // 随机漂移
    if (creature.aiTimer > 100 + Math.random() * 100) {
      creature.aiTimer = 0;
      creature.vx = (Math.random() - 0.5) * 0.4;
      creature.vy = (Math.random() - 0.5) * 0.3;
    }
    creature.interactionState = "drifting";
  }
}

function updateStationary(creature, player, dist, dx, dy, dt) {
  creature.vx *= 0.9;
  creature.vy *= 0.9;
  creature.interactionState = "stationary";
}

// 对生物造成伤害
export function damageCreature(creature, amount) {
  if (!creature.alive) return false;
  creature.hp -= amount;
  creature.interactionState = "hurt";
  if (creature.hp <= 0) {
    creature.alive = false;
    creature.interactionState = "defeated";
    return true; // 被击败
  }
  return false;
}

// 检查玩家是否可以与生物交互
export function canInteract(creature, player, interactionType) {
  if (!creature.alive) return false;
  const dist = creature.lastPlayerDistance;
  const cat = creature.catalog;
  const interactRange = 60;

  switch (interactionType) {
    case INTERACTION.OBSERVE:
      return dist < cat.detectionRadius;
    case INTERACTION.RECORD:
      return dist < interactRange && cat.captureDifficulty >= 1;
    case INTERACTION.CAPTURE:
      return dist < interactRange * 0.7 && cat.captureDifficulty >= 1;
    case INTERACTION.PURIFY:
      return dist < interactRange * 0.7 && cat.class === "hybrid";
    case INTERACTION.DISPERSE:
      return dist < interactRange * 1.2 && cat.class === "negative";
    case INTERACTION.DEFEAT:
      return dist < interactRange;
    default:
      return dist < interactRange;
  }
}

// 计算工具对当前生物的加成
export function getToolBonus(creature, toolId) {
  const cat = creature.catalog;
  if (cat.preferredTool === toolId) return 2.0;    // 最佳工具
  if (cat.altTool === toolId) return 1.3;           // 备选工具
  return 1.0;                                       // 普通工具
}
