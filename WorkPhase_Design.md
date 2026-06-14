# Work Phase 设计说明

> 墨水深渊核心主题：**工作 → 疲惫 → 创作受阻 → 墨境 → 获得灵感 → 回到现实**

---

## 1. 概述

Work Phase（工作阶段）是墨水深渊核心循环的第一步，模拟主角在现实世界中的工作体验，通过工作事件影响角色状态，进而影响墨境（Inkwell）的战斗体验。

### 1.1 设计目标

- **叙事目标**：让玩家体验"工作压力大 → 进入墨境战斗 → 获得灵感 → 回到现实"的循环
- **玩法目标**：工作事件影响角色状态（压力、疲惫、灵感），状态影响墨境难度和奖励
- **情感目标**：让玩家感受到"工作疲惫 → 战斗释放 → 获得灵感"的情感曲线

### 1.2 最小可玩版本

- 工作事件系统：随机触发 1-3 个工作事件
- 状态影响：事件影响压力、疲惫、灵感、心情、情绪
- 对墨境的影响：
  - 压力高时敌人增强（血量 + 伤害增加）
  - 灵感高时奖励增加（奖励选择数量 +1 或 +2）

---

## 2. 系统架构

### 2.1 日循环系统（DayCycle.js）

**阶段定义**：
```javascript
const PHASES = ["morning", "work", "free", "inkwell", "settlement"];
```

**循环流程**：
```
morning → work → free → inkwell → settlement → morning → ...
```

**关键函数**：
- `setPhase(phase)` - 设置当前阶段
- `nextPhase()` - 进入下一个阶段
- `getCurrentWorkEvent()` - 获取当前工作事件
- `advanceWorkEvent()` - 完成当前事件，进入下一个
- `getWorkProgress()` - 获取工作进度

### 2.2 工作事件系统（WorkEvents.js）

**事件类型**：
1. **加班 (overtime)** - 增加压力、疲惫，降低灵感
2. **修改需求 (requirement_change)** - 增加压力、疲惫，降低灵感
3. **客户反馈 (client_feedback)** - 增加压力、疲惫，降低灵感
4. **临时任务 (urgent_task)** - 增加压力、疲惫，降低灵感
5. **积极事件 (positive)** - 降低压力，增加灵感（少数）

**事件结构**：
```javascript
{
  id: "overtime_1",
  type: "overtime",
  title: "加班",
  description: "事件描述文本",
  effects: {
    stress: 15,        // 压力变化
    fatigue: 20,       // 疲惫变化
    inspiration: -5,   // 灵感变化
    mood: "tired",     // 心情变化
  },
  emotionChange: "anxious",  // 情绪变化
}
```

**事件选择逻辑**：
- 第 1 天：1 个事件
- 第 2 天或压力 > 30：2 个事件
- 第 3 天且压力 > 50：3 个事件

### 2.3 状态系统（GameState.js）

**状态字段**：
```javascript
status: {
  hp: 100,              // 生命值
  fatigue: 0,           // 疲惫度 (0-100)
  mood: "tired",        // 心情 (tired, normal, good, great)
  emotion: "calm",      // 情绪 (calm, anxious, angry, inspired)
  inspiration: 0,       // 灵感 (0-100)
  stress: 0,            // 压力 (0-100) ← 新增
  inkMax: 100,
}
```

### 2.4 状态对墨境的影响

#### 2.4.1 压力高时敌人增强（NPC.js）

**实现位置**：`NPC.js` 中的 `getStressMultiplier()` 函数

**计算公式**：
- 压力 0-30：1.0x（无增强）
- 压力 30-70：1.0-1.3x（线性增加）
- 压力 70-100：1.3-1.5x（线性增加）

**影响属性**：
- 敌人血量（hp, maxHp）
- 敌人造成的伤害（contactDamage）

#### 2.4.2 灵感高时奖励增加（RewardGenerator.js）

**实现位置**：`RewardGenerator.js` 中的 `generateRelicChoices()` 函数

**调整逻辑**：
- 灵感 0-40：奖励数量 = 基础数量（3 个）
- 灵感 40-70：奖励数量 = 基础数量 + 1
- 灵感 70-100：奖励数量 = 基础数量 + 2

---

## 3. Workflow（工作流程）

### 3.1 Work Phase 流程

```
进入 work 阶段
  ↓
生成 1-3 个工作事件
  ↓
显示第 1 个事件
  ↓
玩家按 Enter 继续
  ↓
应用事件效果到角色状态
  ↓
还有更多事件？
  ├─ 是 → 显示下一个事件
  └─ 否 → 进入 studio 场景
```

### 3.2 完整日循环流程

```
Day N 开始
  ↓
morning 阶段（phase = "morning"）
  ↓
work 阶段（phase = "work"）
  ↓ 触发工作事件，影响角色状态
free 阶段（phase = "free"）
  ↓ 玩家绘制武器
inkwell 阶段（phase = "inkwell"）
  ↓ 墨境战斗（敌人强度受压力影响）
settlement 阶段（phase = "settlement"）
  ↓ 结算奖励（奖励数量受灵感影响）
Day N+1 开始
  ↓
```

---

## 4. UI 设计

### 4.1 Work Phase 界面

**布局**：
```
┌─────────────────────────────────────┐
│ Day X - Work Phase                  │
│                                     │
│ [加班] 加班                          │
│                                     │
│ Zhou 走过来说："今晚加班，把这个需求 │
│ 改完。"                             │
│ 屏幕上的时钟指向 21:30。            │
│                                     │
│ Status Changes:                     │
│   Stress: +15                       │
│   Fatigue: +20                      │
│   Inspiration: -5                   │
│   Mood: tired                       │
│                                     │
│ Current Status:                     │
│   压力很大，有些疲惫                 │
│                                     │
│ Event 1 / 2                         │
│                                     │
│ Enter: continue                     │
└─────────────────────────────────────┘
```

**设计原则**：
- 不使用复杂 UI（文本 + 简单的矩形背景）
- 使用现有的 `drawPaperBackground()` 和 `label()` 函数
- 类似 `feedback` 场景的简洁风格

---

## 5. 测试方法

### 5.1 功能测试

1. **Work Phase 触发测试**
   - 启动游戏，完成 inkwell 战斗
   - 在 feedback 场景按 Enter
   - 验证是否进入 work 阶段

2. **工作事件测试**
   - 在 work 阶段，验证事件是否正确显示
   - 按 Enter，验证是否进入下一个事件
   - 所有事件完成后，验证是否进入 studio 场景

3. **状态影响测试**
   - 在 work 阶段，验证事件效果是否正确应用到 `gameState.status`
   - 验证状态描述是否正确显示

### 5.2 对墨境的影响测试

1. **压力对敌人强度的影响**
   - 在 work 阶段，触发多个增加压力的事件
   - 进入 inkwell 场景，战斗
   - 验证敌人血量是否增加
   - 验证敌人造成的伤害是否增加

2. **灵感对奖励的影响**
   - 在 work 阶段，触发增加灵感的事件
   - 进入 inkwell 场景，完成战斗
   - 在 settlement 阶段，验证奖励选择数量是否增加

---

## 6. 已知限制与未来改进

### 6.1 当前限制

1. **Work Phase 玩法简单**
   - 当前只是文本事件 + 按 Enter 继续
   - 未来可以添加简单的点击选择（例如，选择如何应对加班）

2. **缺少 UI 反馈**
   - 当前没有状态条（压力条、灵感条等）
   - 未来可以在 HUD 中添加状态显示

3. **事件重复性**
   - 当前事件池较小（10 个事件）
   - 未来可以扩展事件池，添加更多变化

### 6.2 未来改进建议

1. **Work Phase 玩法扩展**
   - 添加简单的点击选择（例如，"接受加班" 或 "拒绝加班"）
   - 不同的选择导致不同的状态变化

2. **状态可视化**
   - 在 Work Phase 界面添加状态条
   - 在 Studio 场景和 Inkwell 场景的 HUD 中显示状态

3. **事件池扩展**
   - 添加更多工作事件（20-30 个）
   - 添加事件链（例如，连续加班 3 天）

4. **叙事扩展**
   - 在 Work Phase 中添加墨点（Inkdot）的对话
   - 墨点对面工作事件的反应（例如，"你看起来很累"）

---

## 7. 文件清单

### 7.1 修改的文件

1. **`GameState.js`** - 添加 `stress`（压力）字段
2. **`DayCycle.js`** - 实现 `work` 阶段的事件系统
3. **`main.js`** - 添加 `work` 场景的渲染和逻辑
4. **`NPC.js`** - 实现压力对敌人强度的影响
5. **`RewardGenerator.js`** - 实现灵感对奖励数量的影响

### 7.2 新增的文件

1. **`WorkEvents.js`** - 定义工作事件池和事件选择逻辑

### 7.3 文档文件

1. **`WorkPhase_Design.md`** - 本设计说明文档
2. **`WorkPhase_Flowchart.md`** - 流程图文档（待创建）

---

## 8. Git 提交信息

### Commit 1: 实现 Work Phase 核心功能
```
feat: 实现 Work Phase（工作阶段）

- 扩展 GameState.js：添加 stress（压力）字段
- 创建 WorkEvents.js：定义工作事件池（10 个事件）
- 扩展 DayCycle.js：实现 work 阶段的事件系统
- 更新 main.js：添加 work 场景的渲染和逻辑
- 修改 NPC.js：实现压力对敌人强度的影响
- 修改 RewardGenerator.js：实现灵感对奖励数量的影响

核心主题：工作 → 疲惫 → 创作受阻 → 墨境 → 获得灵感 → 回到现实

相关文件：
- src/game/GameState.js
- src/game/DayCycle.js
- src/game/WorkEvents.js (新增)
- src/main.js
- src/inkwell/NPC.js
- src/game/builds/RewardGenerator.js
```

---

## 9. 总结

Work Phase 的实现为墨水深渊的核心循环添加了重要的一环：**工作体验如何影响墨境战斗**。

通过工作事件系统，玩家可以体验到"工作压力大 → 墨境敌人变强 → 战斗困难 → 获得灵感 → 回到现实"的情感曲线。

当前版本是最小可玩版本，未来可以继续扩展玩法深度和叙事内容。
