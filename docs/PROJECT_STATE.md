# Project State

## 项目名称
墨水深渊 / Inkwell Deep

## 当前项目定位
一个以"画板生成武器 / 墨境战斗 / 地图探索"为核心的 2D 游戏项目。

## 当前核心系统
- 画板系统：玩家通过绘制生成不同武器类型
- 武器系统：不同武器应拥有不同攻击方式、攻击距离、判定框和克制关系
- 战斗系统：玩家使用武器攻击敌人
- 敌人系统：敌人可绑定武器克制逻辑（MonsterCatalog.js 含 6 种普通敌人 + BossCatalog.js 含 3 种 Boss）
- 地图生成系统：负责关卡空间、路线、障碍和探索节奏

## 当前场景流程
```
chapter0（序章：租房房间探索）→ studio（绘制武器）→ inkwell（墨境战斗）→ feedback（早晨结算）→ 循环
```
opening 场景（5 阶段叙事开场）保留但不再是默认入口。

## 版本管理
Git 已初始化（`D:\InkwellDeep\.git`），最新提交：
- `9313b78` OpeningScene 开场场景集成
- `05dd98e` 初始提交

当前有未提交更改：Chapter0 集成、设计文档新增。

## 当前重点问题
- 武器攻击判定框体验不好，存在死角（已修复，待实机验证）
- 角色转向后武器方向/攻击方式可能异常（已处理，待复测）
- 不同武器的攻击动画和判定差异不明显
- 地图生成玩法偏单调
- 画板系统还需要更完整地消费"绘制类型"

## 当前开发原则
- 优先小步优化，不要大规模重构
- 每次只处理一个系统或一个 bug
- 修改后必须记录交接信息
- 不允许破坏已有可运行功能

## 主要目录结构

```
D:\InkwellDeep
├── README.md
├── 项目现状.md
├── docs/
│   ├── AI_HANDOFF.md
│   ├── BUG_LOG.md
│   ├── CODEX_TASKS.md
│   ├── DESIGN_RULES.md
│   ├── DevelopmentRoadmap.md    ← 新增
│   ├── Mojing_GDD.md            ← 新增
│   ├── PlayerLoop.md            ← 新增
│   ├── PROJECT_STATE.md
│   ├── TODO_QUEUE.md
│   └── WorldStructure.md        ← 新增
├── fix_c0.py                    ← Chapter0 修复脚本
├── rebuild_c0.py                ← Chapter0 重建脚本
├── rebuild_c0_p2.py
├── rebuild_c0_p3.py
└── StandalonePrototype
    ├── index.html
    ├── README.md
    ├── StartPrototype.ps1
    ├── styles.css
    ├── assets/
    └── src/
       ├── bootstrap.js
       ├── main.js
       ├── characters/protagonist/
       ├── core/
       ├── features/drawing/
       ├── game/builds/
       ├── inkwell/
       └── scenes/
```

## 关键文件说明

### 入口与启动
- `index.html` — 浏览器入口，canvas，加载 bootstrap.js（v=34）
- `styles.css` — 16:9 适配，pixelated 渲染
- `StartPrototype.ps1` — 本地静态服务启动脚本（端口 4173）
- `src/bootstrap.js` — 异步加载 main.js

### 主流程
- `src/main.js` — 场景流程控制：chapter0 → studio → inkwell → feedback
- `src/game/GameState.js` — 全局状态（日期、阶段、brief、武器、关系）
- `src/game/DayCycle.js` — 5 阶段控制（morning/work/free/inkwell/settlement）

### 场景
- `src/scenes/Chapter0.js` — 序章：租房房间可探索场景，调查物品触发对话，墨点出现 → 墨迹扩散 → 进入墨境（**当前入口场景**）
- `src/scenes/OpeningScene.js` — 5 阶段叙事开场（保留，非默认入口）
- `src/scenes/inkwell.js` — 墨境场景编排

### 绘制与武器生成
- `src/features/drawing/DrawingCanvas.js` — 工作室绘制画布
- `src/features/drawing/StrokeRecorder.js` — 笔划过程记录
- `src/features/drawing/TraitGenerator.js` — 武器特质生成
- `src/game/WeaponGenerator.js` — 武器生成主逻辑
- `src/game/WeaponArchetypes.js` — 武器原型定义（9 种）
- `src/game/WeaponProfile.js` — 武器档案

### 敌人系统
- `src/inkwell/MonsterCatalog.js` — 6 种普通敌人定义 + 按房间类型刷怪表
- `src/inkwell/BossCatalog.js` — 3 种 Boss 变体定义
- `src/inkwell/NPC.js` — 敌人存储、AI、绘制

### 构建与奖励
- `src/game/builds/BuildState.js` — 构建状态（遗迹/武器经验/进化）
- `src/game/builds/InkRelics.js` — 墨水遗迹（16 种）
- `src/game/builds/RewardGenerator.js` — 奖励生成

### 墨境系统
- `src/inkwell/Player.js` — 玩家移动/跳跃/挖掘/放置
- `src/inkwell/AttackController.js` — 攻击控制（最大文件，21348 bytes）
- `src/inkwell/WorldGen.js` — 世界生成
- `src/inkwell/TileMap.js` — tile 数组与读写
- `src/inkwell/Lighting.js` — 黑暗与光照
- `src/inkwell/Portal.js` — Boss 死亡返回传送门

## 当前文件规模
较大核心文件：
```
src/inkwell/AttackController.js       21348 bytes
src/scenes/Chapter0.js                17428 bytes
src/main.js                           15500+ bytes
src/inkwell/WeaponSpriteRenderer.js   14686 bytes
src/scenes/inkwell.js                 14407 bytes
src/inkwell/WorldGen.js               13535 bytes
```
