# 玩家一日循环 (PlayerLoop.md)

> 整理自 `DayCycle.js`（5 阶段）、`main.js`（场景管理）、`Chapter0.js`（序章）、`OpeningScene.js`（叙事）。

---

## 完整一日循环

```
═══════════════════════════════════════
  首次游玩：Chapter0 序章
═══════════════════════════════════════
   │
   ▼
[租房房间] ─── chapter0 场景（EXPLORE 阶段）
   │  WASD/方向键 移动角色
   │  调查物品：电脑桌 / 数字板 / 散落稿件 / 旧画册
   │
   ▼
[翻开画册] ─── SKETCHBOOK 阶段
   │  "翻开画册，里面是你小时候画的画。一只小猫。线条笨拙，但眼睛很亮。"
   │
   ▼
[墨点出现] ─── INKDOT 阶段
   │  墨点从画册中出现并对话："好久不见。" "你还好吗？"
   │
   ▼
[墨迹扩散] ─── INK_SPREAD → INK_ENTRY 阶段
   │  墨迹从画册向四周扩散，覆盖整个画面
   │  墨点："这里还是老样子。……又好像变了很多。"
   │
   ▼
[淡出] ─── FADE_OUT 阶段
   │  画面逐渐被墨迹吞没 → 过渡到 studio
   │
   ▼
═══════════════════════════════════════
  后续循环直接从工作室开始
═══════════════════════════════════════
   │
   ▼
[绘制武器] ─── studio 场景
   │  在工作室画布上绘制武器
   │  工具：Pencil / Eraser / Undo / Redo / Clear
   │  录入：笔划过程 → 形态分析 → 武器分类 → 属性生成
   │  Enter：完成绘制，进入墨境
   │
   ▼
[进入墨境] ─── inkwell 场景
   │  90 秒夜间倒计时
   │  移动 (A/D)、跳跃 (Space)、二段跳、冲刺 (Shift)
   │  攻击 (左键)、挖掘、放置纸块 (右键)
   │  刷怪按房间类型分配（MonsterCatalog.js）：
   │    combat: sketchling/inkmite/binder/paper_kite/blot_sentinel
   │    resource: sketchling/binder/margin_eel/blot_sentinel
   │    rift: inkmite/paper_kite/sketchling/blot_sentinel
   │  探索房间：Draft Gate → Copied Pose Room → Supply Sketch → Ink Reservoir → Torn Paper Shaft → Boss Chamber
   │
   ▼
[Boss 战]
   │  随机 Boss 变体（Template Engine / Eraser Warden / Printhead Maw）
   │  Boss 死亡 → 返回传送门出现
   │  玩家选择何时进入传送门离开
   │  F 键或传送门返回
   │
   ▼
[结算]  ─── settlement / feedback 场景
   │  早晨反馈画面
   │  显示：Day X / Boss 反馈 / Inkdot 状态 / 草稿状态
   │  显示：上一个武器名称、制作时间、修改次数、特质
   │  奖励：遗迹选择、武器经验、武器进化
   │  Enter：进入下一天
   │
   ▼
[早晨]  ─── DayCycle PHASE: morning
   │  day++，phase 重置为 free
   │  清空画布，回到工作室
   │
   ▼
  （循环）
```

---

## 阶段详细说明

### 0. 序章 (chapter0) — 仅首次
- **来源**：`Chapter0.js` — 6 个阶段（EXPLORE / SKETCHBOOK / INKDOT / INK_SPREAD / INK_ENTRY / FADE_OUT）
- **触发**：游戏启动（`main.js` 默认 `scene = "chapter0"`）
- **内容**：可探索的租房房间，调查 4 个物品，触发墨点出场
- **输出**：过渡到 studio

### 1. 绘制武器 (studio)
- **来源**：`main.js` studio 场景 + 完整武器生成管线
- **核心操作**：按住鼠标左键绘制，R 清除，Enter 完成

### 2. 墨境探索 (inkwell)
- **来源**：`scenes/inkwell.js` 编排，所有 inkwell/ 模块
- **敌人配置**：`MonsterCatalog.js` — 6 种普通敌人，按房间类型刷怪
- **Boss**：`BossCatalog.js` — 3 种随机变体
- **时间限制**：90 秒

### 3. 结算 (feedback)
- **来源**：`main.js` feedback 场景
- **奖励**：遗迹选择、武器经验、武器进化

---

## 场景入口演进

| 版本 | 默认入口 | 状态 |
|------|---------|------|
| 初始提交 | studio（直接绘制） | 已替换 |
| OpeningScene 提交 | opening（5 阶段叙事） | 保留但非默认 |
| Chapter0 提交 | chapter0（可探索房间） | **当前默认** |

---

## 普通敌人一览（MonsterCatalog.js）

| ID | 类型 | 行为 | 弱点 | 抗性 |
|----|------|------|------|------|
| sketchling | swarm | walker | sword, whip | — |
| inkmite | fast | skitter | dagger | hammer |
| binder | armored | guard | hammer | dagger, sword |
| margin_eel | longBody | skitter | spear | — |
| paper_kite | flying | leaper | spear, whip | hammer |
| blot_sentinel | sentinel | sentinel (ranged) | dagger, spear | whip |
