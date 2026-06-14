# 完整世界结构 (WorldStructure.md)

> 整理自现有代码中的场景、地图、房间和状态定义。

---

## 现实世界 (Real World)

### 租房房间 — 序章场景
- **来源**：`Chapter0.js`（当前游戏入口）
- **状态**：可自由探索（WASD 移动，E 调查物品，Enter 推进对话）
- **元素**：
  - 电脑桌（屏幕上还亮着，客户要求再改一版）
  - 数字板（笔尖磨损得厉害）
  - 散落稿件（铺了半张桌子，反复擦改）
  - 旧画册（书架上的童年画册）
  - 窗户（带月亮和星星）、台灯（带暖光闪烁）
  - 木质地板纹理
- **流程**：探索 → 调查画册 → 墨点出现对话 → 墨迹扩散 → 过渡到工作室

### 公司 (Zhou''s Studio)
- **来源**：`GameState.js` currentBrief.client = "Zhou"
- **状态**：仅在叙事和 brief 系统中存在，无可探索空间
- **功能**：发布商业稿件（brief），驱动白天工作阶段

### 家 — 工作室/创作空间
- **来源**：`main.js` studio 场景、`OpeningScene.js`
- **状态**：核心交互场景，可自由使用
- **元素**：绘制画布、墙上草图、书桌、台灯、稿纸、墨点蜷在桌角
- **功能**：鼠标绘制武器 → 生成武器 → 进入墨境

### 商店
- **来源**：`GameState.js` money: 0 字段
- **状态**：仅数据预留，无场景实现

---

## 墨境 (Inkwell)

### 世界参数
- 世界尺寸：1280×260 tiles（8px/tile）
- Tile 类型：Air(0)、Paper(1)、Graphite(2)、Ink(3)
- 渲染：邻接感知 tile 绘制、纸张/洞穴视差背景、径向光照与黑暗

### 外围区域 — Draft Gate（入口房间）
- 尺寸：62×32 tiles，位置世界左侧

### 战斗区域 — Copied Pose Room
- 数量：随机分布，多数
- 刷怪（权重）：sketchling(5)、inkmite(3)、binder(2)、paper_kite(2)、blot_sentinel(1)

### 宝箱区域 — Supply Sketch
- 尺寸：46+×32+ tiles，含宝箱

### 资源区域 — Ink Reservoir
- 刷怪（权重）：sketchling(4)、binder(4)、margin_eel(2)、blot_sentinel(1)

### 裂隙区域 — Torn Paper Shaft
- 尺寸：50+×58+ tiles（纵向空间）
- 刷怪（权重）：inkmite(4)、paper_kite(4)、sketchling(2)、blot_sentinel(2)

### Boss 区域 — Boss Chamber
- 尺寸：86+×46+ tiles，世界最右侧
- Boss 随机为 Template Engine / Eraser Warden / Printhead Maw 之一

---

## 墨境敌人体系

### 普通敌人（MonsterCatalog.js — 6 种）

| ID | 类型 | 行为 | 速度 | HP修正 | 弱点 | 抗性 | 接触伤害 |
|----|------|------|------|--------|------|------|---------|
| sketchling | swarm | walker | 1.35 | 0 | sword, whip | — | 5 |
| inkmite | fast | skitter | 1.8 | -8 | dagger | hammer | 4 |
| binder | armored | guard | 1.05 | +12 | hammer | dagger, sword | 6 |
| margin_eel | longBody | skitter | 1.2 | +4 | spear | — | 5 |
| paper_kite | flying | leaper | 1.55 | -4 | spear, whip | hammer | 4 |
| blot_sentinel | sentinel | ranged sentinel | 0.82 | +8 | dagger, spear | whip | 7 |

### Boss（BossCatalog.js — 3 种）

| ID | 名称 | HP | 弱点 | 抗性 | 技能 | 速度 |
|----|------|-----|------|------|------|------|
| template_engine | Template Engine | 155 | whip | dagger | pulse | 1.05 |
| eraser_warden | Eraser Warden | 185 | hammer | sword | slam | 0.82 |
| printhead_maw | Printhead Maw | 135 | spear | hammer | dash | 1.45 |

---

## 连接结构

```
现实世界                              墨境
┌──────────────────┐                  ┌─────────────────────────────┐
│  租房房间         │                  │                             │
│  (Chapter0 序章)   │                  │  Draft Gate                 │
│       ↓           │                  │      ↓                      │
│  工作室            │   绘制武器        │  Copied Pose Room ×N       │
│  (核心场景)        │ ════════════════→│      ↓                      │
│                   │   进入墨境        │  Supply Sketch /            │
│  公司 (Zhou)       │                  │  Ink Reservoir /            │
│  (叙事存在)        │                  │  Torn Paper Shaft           │
│                   │                  │      ↓                      │
│  商店 (预留)       │                  │  Boss Chamber               │
│                   │ ←────────────────│      ↓                      │
│                   │   返回现实        │  返回传送门                  │
└──────────────────┘                  └─────────────────────────────┘
```
