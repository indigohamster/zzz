# Work Phase 流程图

---

## 1. 完整日循环流程图

```mermaid
stateDiagram-v2
    [*] --> Chapter0: 首次启动
    Chapter0 --> Morning: 完成序章
    
    Morning --> Work: 新的一天开始
    Work --> Free: 工作事件完成
    Free --> Inkwell: 绘制武器完成
    Inkwell --> Settlement: 战斗完成/Boss死亡
    Settlement --> Morning: 按Enter进入下一天
    
    note right of Work
        工作阶段
        - 触发1-3个工作事件
        - 影响角色状态（压力、疲惫、灵感）
    end note
    
    note right of Inkwell
        墨境阶段
        - 敌人强度受压力影响
        - 奖励数量受灵感影响
    end note
```

---

## 2. Work Phase 详细流程图

```mermaid
flowchart TD
    A[进入 Work Phase] --> B[生成工作事件]
    B --> C{事件数量?}
    C -->|第1天| D[1个事件]
    C -->|第2天 或 压力>30| E[2个事件]
    C -->|第3天 且 压力>50| F[3个事件]
    
    D --> G[显示第1个事件]
    E --> G
    F --> G
    
    G --> H[玩家阅读事件]
    H --> I[按 Enter 继续]
    I --> J[应用事件效果]
    J --> K{还有更多事件?}
    
    K -->|是| L[显示下一个事件]
    L --> H
    
    K -->|否| M[进入 Studio 场景]
```

---

## 3. 工作事件系统流程图

```mermaid
flowchart LR
    A[开始 Work Phase] --> B[selectWorkEvents]
    B --> C[过滤已触发事件]
    C --> D[随机选择事件]
    D --> E[显示事件]
    E --> F[玩家按 Enter]
    F --> G[applyWorkEventEffects]
    G --> H[更新角色状态]
    H --> I{还有更多事件?}
    I -->|是| E
    I -->|否| J[进入 Studio]
```

---

## 4. 状态对墨境的影响流程图

```mermaid
flowchart TD
    A[角色状态] --> B{压力?}
    A --> C{灵感?}
    
    B -->|低 0-30| D[敌人强度: 1.0x]
    B -->|中 30-70| E[敌人强度: 1.0-1.3x]
    B -->|高 70-100| F[敌人强度: 1.3-1.5x]
    
    C -->|低 0-40| G[奖励数量: 3个]
    C -->|中 40-70| H[奖励数量: 4个]
    C -->|高 70-100| I[奖励数量: 5个]
    
    D --> J[墨境战斗]
    E --> J
    F --> J
    
    G --> K[结算奖励]
    H --> K
    I --> K
```

---

## 5. 事件类型与效果流程图

```mermaid
flowchart LR
    A[工作事件] --> B[加班]
    A --> C[修改需求]
    A --> D[客户反馈]
    A --> E[临时任务]
    A --> F[积极事件]
    
    B --> G[压力+15, 疲惫+20, 灵感-5]
    C --> H[压力+20, 疲惫+15, 灵感-15]
    D --> I[压力+18, 疲惫+10, 灵感-10]
    E --> J[压力+25, 疲惫+18, 灵感-8]
    F --> K[压力-10, 疲惫+5, 灵感+15]
```

---

## 6. 核心主题流程图

```mermaid
flowchart LR
    A[工作] --> B[疲惫]
    B --> C[创作受阻]
    C --> D[墨境]
    D --> E[获得灵感]
    E --> F[回到现实]
    F --> A
    
    style A fill:#ff9999
    style B fill:#ffcc99
    style C fill:#ffff99
    style D fill:#99ccff
    style E fill:#99ff99
    style F fill:#ff99cc
```

**颜色说明**：
- 🔴 工作（红色）- 压力和疲惫积累
- 🟠 疲惫（橙色）- 状态下降
- 🟡 创作受阻（黄色）- 灵感枯竭
- 🔵 墨境（蓝色）- 战斗和探索
- 🟢 获得灵感（绿色）- 状态恢复
- 🔴 回到现实（粉色）- 循环继续

---

## 7. 场景转换流程图

```mermaid
flowchart TD
    A[feedback 场景] -->|按 Enter| B[dayCycle.setPhase work]
    B --> C[scene = work]
    C --> D[显示工作事件]
    D -->|按 Enter| E[应用事件效果]
    E --> F{还有更多事件?}
    F -->|是| D
    F -->|否| G[scene = studio]
    G --> H[绘制武器]
    H -->|按 Enter| I[dayCycle.setPhase inkwell]
    I --> J[scene = inkwell]
    J --> K[墨境战斗]
    K --> L[dayCycle.setPhase settlement]
    L --> M[scene = feedback]
    M -->|按 Enter| B
```

---

## 8. 事件选择逻辑流程图

```mermaid
flowchart TD
    A[selectWorkEvents] --> B[获取 gameState.day]
    A --> C[获取 gameState.status.stress]
    
    B --> D{天数?}
    C --> E{压力?}
    
    D -->|day=1| F[eventCount = 1]
    D -->|day>=2| G[eventCount = 2]
    D -->|day>=3| H[eventCount = 3]
    
    E -->|stress<=30| I[eventCount = 1]
    E -->|stress>30| J[eventCount = 2]
    E -->|stress>50| K[eventCount = 3]
    
    F --> L[选择事件]
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    L --> M[过滤已触发事件]
    M --> N[随机选择 eventCount 个事件]
    N --> O[返回事件列表]
```

---

## 9. 压力对敌人强度的影响流程图

```mermaid
flowchart TD
    A[创建敌人] --> B[getStressMultiplier]
    B --> C{压力值?}
    
    C -->|0-30| D[multiplier = 1.0]
    C -->|30-70| E[multiplier = 1.0 + stress-30/150]
    C -->|70-100| F[multiplier = 1.3 + stress-70/100]
    
    D --> G[调整敌人血量]
    E --> G
    F --> G
    
    G --> H[调整敌人伤害]
    H --> I[敌人创建完成]
```

---

## 10. 灵感对奖励的影响流程图

```mermaid
flowchart TD
    A[生成奖励选择] --> B[获取 inspiration 参数]
    B --> C{灵感值?}
    
    C -->|0-40| D[adjustedCount = count]
    C -->|40-70| E[adjustedCount = count + 1]
    C -->|70-100| F[adjustedCount = count + 2]
    
    D --> G[选择 adjustedCount 个奖励]
    E --> G
    F --> G
    
    G --> H[返回奖励列表]
```

---

## 11. 文本流程图（简化版）

```
═══════════════════════════════════════════════════════════
  墨水深渊 - 完整日循环（含 Work Phase）
═══════════════════════════════════════════════════════════
  │
  ▼
[morning] ─── 新的一天开始
  │  day++, phase = "morning"
  │
  ▼
[work] ─── Work Phase（工作阶段）← 新增
  │  触发 1-3 个工作事件
  │  事件类型：加班、修改需求、客户反馈、临时任务
  │  状态影响：压力↑、疲惫↑、灵感↓
  │  按 Enter 继续，所有事件完成后进入 studio
  │
  ▼
[studio] ─── 绘制武器
  │  在工作室画布上绘制武器
  │  工具：Pencil / Eraser / Undo / Redo / Clear
  │  录入：笔划过程 → 形态分析 → 武器分类 → 属性生成
  │  Enter：完成绘制，进入墨境
  │
  ▼
[inkwell] ─── 墨境探索
  │  90 秒夜间倒计时
  │  ★ 压力高时敌人增强（血量 + 伤害增加）
  │  移动 (A/D)、跳跃 (Space)、二段跳、冲刺 (Shift)
  │  攻击 (左键)、挖掘、放置纸块 (右键)
  │
  ▼
[Boss 战]
  │  随机 Boss 变体
  │  Boss 死亡 → 返回传送门出现
  │
  ▼
[settlement] ─── 结算
  │  早晨反馈画面
  │  ★ 灵感高时奖励增加（奖励选择数量 +1 或 +2）
  │  显示：Day X / Boss 反馈 / Inkdot 状态
  │  奖励：遗迹选择、武器经验、武器进化
  │  Enter：进入下一天
  │
  ▼
[morning] ─── 循环继续
```

---

## 12. 文件依赖关系图

```mermaid
flowchart TD
    A[main.js] --> B[GameState.js]
    A --> C[DayCycle.js]
    A --> D[WorkEvents.js]
    A --> E[NPC.js]
    A --> F[RewardGenerator.js]
    
    C --> B
    C --> D
    
    E --> B
    F --> B
    
    style A fill:#ff9999
    style B fill:#99ccff
    style C fill:#99ff99
    style D fill:#ffff99
    style E fill:#ffcc99
    style F fill:#cc99ff
```

**说明**：
- `main.js` 是主入口，依赖所有其他模块
- `DayCycle.js` 依赖 `GameState.js` 和 `WorkEvents.js`
- `NPC.js` 和 `RewardGenerator.js` 依赖 `GameState.js` 来读取状态

---

## 13. 总结

以上是 Work Phase 的流程图，包括：

1. **完整日循环流程图** - 显示所有阶段的转换关系
2. **Work Phase 详细流程图** - 显示工作事件的处理流程
3. **状态对墨境的影响流程图** - 显示压力和灵感如何影响游戏
4. **核心主题流程图** - 显示"工作 → 墨境 → 回到现实"的循环
5. **场景转换流程图** - 显示场景之间的转换逻辑
6. **文本流程图** - 简化的文本版本，便于快速理解

这些流程图可以帮助理解 Work Phase 的设计和实现。
