/**
 * WorkEvents.js
 * 工作事件池 - 定义 Work Phase 可能触发的事件
 * 
 * 核心主题：工作 → 疲惫 → 创作受阻 → 墨境 → 获得灵感 → 回到现实
 * 
 * 事件类型：
 * 1. 加班 (overtime)
 * 2. 修改需求 (requirement_change)
 * 3. 客户反馈 (client_feedback)
 * 4. 临时任务 (urgent_task)
 */

// 工作事件池
export const WORK_EVENTS = [
  // ===== 加班事件 =====
  {
    id: "overtime_1",
    type: "overtime",
    title: "加班",
    description: "Zhou 走过来说：\"今晚加班，把这个需求改完。\"\n\n屏幕上的时钟指向 21:30。",
    effects: {
      stress: 15,        // 压力 +15
      fatigue: 20,        // 疲惫 +20
      inspiration: -5,    // 灵感 -5
      mood: "tired",      // 心情变为 tired
    },
    emotionChange: "anxious",  // 情绪变为 anxious
  },
  {
    id: "overtime_2",
    type: "overtime",
    title: "深夜加班",
    description: "你看了看时间，已经 23:00 了。\n\nZhou 又发来一条消息：\"还有一处要改。\"",
    effects: {
      stress: 20,
      fatigue: 25,
      inspiration: -10,
      mood: "tired",
    },
    emotionChange: "angry",
  },

  // ===== 修改需求事件 =====
  {
    id: "requirement_change_1",
    type: "requirement_change",
    title: "需求修改",
    description: "客户看了初稿，说：\"这个方向不对，要改。\"\n\n你把画好的草图删掉，重新开始。",
    effects: {
      stress: 20,
      fatigue: 15,
      inspiration: -15,
      mood: "tired",
    },
    emotionChange: "anxious",
  },
  {
    id: "requirement_change_2",
    type: "requirement_change",
    title: "反复修改",
    description: "\"这个颜色再调一下。\"\"不对，还是改回上一版。\"\n\n你已经在同一个地方改了 5 遍。",
    effects: {
      stress: 25,
      fatigue: 20,
      inspiration: -20,
      mood: "tired",
    },
    emotionChange: "angry",
  },

  // ===== 客户反馈事件 =====
  {
    id: "client_feedback_1",
    type: "client_feedback",
    title: "客户反馈",
    description: "客户发来一条语音：\"这个感觉不行，你再想想。\"\n\n没有具体说明哪里不行。",
    effects: {
      stress: 18,
      fatigue: 10,
      inspiration: -10,
      mood: "tired",
    },
    emotionChange: "anxious",
  },
  {
    id: "client_feedback_2",
    type: "client_feedback",
    title: "否定",
    description: "Zhou 把你的稿子给客户看，客户说：\"这不是我要的。\"\n\n你不知道自己哪里做错了。",
    effects: {
      stress: 22,
      fatigue: 15,
      inspiration: -18,
      mood: "tired",
    },
    emotionChange: "anxious",
  },

  // ===== 临时任务事件 =====
  {
    id: "urgent_task_1",
    type: "urgent_task",
    title: "临时任务",
    description: "Zhou 突然走过来说：\"有个紧急需求，今天之内要交。\"\n\n你看了看已经排满的日程。",
    effects: {
      stress: 25,
      fatigue: 18,
      inspiration: -8,
      mood: "tired",
    },
    emotionChange: "anxious",
  },
  {
    id: "urgent_task_2",
    type: "urgent_task",
    title: "插队任务",
    description: "另一个组的同事过来：\"能帮我们画个素材吗？很急。\"\n\n你的时间表已经被打乱了。",
    effects: {
      stress: 20,
      fatigue: 15,
      inspiration: -12,
      mood: "tired",
    },
    emotionChange: "angry",
  },

  // ===== 积极事件（少数） =====
  {
    id: "positive_feedback",
    type: "positive",
    title: "认可",
    description: "Zhou 看完你的稿子，说：\"这次不错，客户应该会喜欢。\"\n\n你感到一丝欣慰。",
    effects: {
      stress: -10,       // 压力 -10
      fatigue: 5,        // 疲惫 +5（还是工作了）
      inspiration: 15,   // 灵感 +15
      mood: "good",      // 心情变为 good
    },
    emotionChange: "inspired",
  },
  {
    id: "creative_flow",
    type: "positive",
    title: "创作心流",
    description: "你突然有了灵感，画得很顺利。\n\n笔在纸上飞舞，时间过得很快。",
    effects: {
      stress: -5,
      fatigue: 10,
      inspiration: 25,   // 灵感 +25
      mood: "great",
    },
    emotionChange: "inspired",
  },
];

/**
 * 根据游戏状态选择工作事件
 * @param {Object} gameState - 游戏状态
 * @returns {Array} 选中的事件列表（1-3 个）
 */
export function selectWorkEvents(gameState) {
  const day = gameState.day;
  const stress = gameState.status.stress;
  
  // 根据天数和压力值调整事件数量
  let eventCount = 1; // 默认 1 个事件
  
  if (day >= 3 && stress > 50) {
    eventCount = 3; // 第 3 天以后，压力高时 3 个事件
  } else if (day >= 2 || stress > 30) {
    eventCount = 2; // 第 2 天以后，或压力中等时 2 个事件
  }
  
  // 过滤掉已经触发过的事件（避免重复）
  const availableEvents = WORK_EVENTS.filter(event => 
    !gameState.storyFlags[`work_event_${event.id}`]
  );
  
  // 如果所有事件都触发过了，重置标记（重新开始循环）
  if (availableEvents.length === 0) {
    Object.keys(gameState.storyFlags).forEach(key => {
      if (key.startsWith("work_event_")) {
        delete gameState.storyFlags[key];
      }
    });
    return selectWorkEvents(gameState); // 递归调用
  }
  
  // 随机选择事件（不重复）
  const selected = [];
  const shuffled = [...availableEvents].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(eventCount, shuffled.length); i++) {
    selected.push(shuffled[i]);
  }
  
  return selected;
}

/**
 * 应用事件效果到游戏状态
 * @param {Object} gameState - 游戏状态
 * @param {Object} event - 工作事件
 */
export function applyWorkEventEffects(gameState, event) {
  const status = gameState.status;
  
  // 应用数值效果（确保值在合理范围内）
  status.stress = clamp(status.stress + (event.effects.stress || 0), 0, 100);
  status.fatigue = clamp(status.fatigue + (event.effects.fatigue || 0), 0, 100);
  status.inspiration = clamp(status.inspiration + (event.effects.inspiration || 0), 0, 100);
  
  // 应用心情变化
  if (event.effects.mood) {
    status.mood = event.effects.mood;
  }
  
  // 应用情绪变化
  if (event.emotionChange) {
    status.emotion = event.emotionChange;
  }
  
  // 标记事件已触发
  gameState.storyFlags[`work_event_${event.id}`] = true;
  
  console.log(`[WorkEvent] Applied: ${event.title}`, {
    effects: event.effects,
    newStatus: status,
  });
}

/**
 * 限制数值在范围内
 * @param {number} value - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数值
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 获取状态描述文本
 * @param {Object} status - 状态对象
 * @returns {string} 状态描述
 */
export function getStatusDescription(status) {
  const parts = [];
  
  if (status.stress >= 70) {
    parts.push("压力很大");
  } else if (status.stress >= 40) {
    parts.push("有些压力");
  }
  
  if (status.fatigue >= 70) {
    parts.push("非常疲惫");
  } else if (status.fatigue >= 40) {
    parts.push("有些疲惫");
  }
  
  if (status.inspiration >= 70) {
    parts.push("灵感涌现");
  } else if (status.inspiration >= 40) {
    parts.push("有些灵感");
  }
  
  if (parts.length === 0) {
    parts.push("状态正常");
  }
  
  return parts.join("，");
}
