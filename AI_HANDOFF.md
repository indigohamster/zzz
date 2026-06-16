# 墨水深渊 AI 接手协议

## 当前版本

Commit: `9e51247`
分支: `main` → 远程 `origin/main`
仓库: `https://github.com/indigohamster/zzz`

## 当前状态

### 已完成 ✅

#### 核心游戏循环
- 项目梳理：Mojing_GDD.md / PlayerLoop.md / WorldStructure.md / DevelopmentRoadmap.md
- Chapter0 序章场景（租房房间探索 → 墨点出现）
- OpeningScene 开场叙事（5 阶段）
- 工作室绘制武器 + 完整武器生成管线（9 种武器原型）
- 墨境程序生成世界（6 种房间类型）
- 6 种普通敌人 + 3 种 Boss 变体（含克制关系）
- 90 秒夜间战斗倒计时 + Boss 传送门返回
- 早晨反馈结算 + 遗迹/武器经验/进化奖励系统
- 主角精灵模块（ProtagonistSprite.js）
- Git 仓库 + GitHub 远程

#### 新增系统（最新）

- **绘制倾向系统**：让绘制内容真正影响战斗体验 ⭐ 新增
  - 4 种绘制倾向（圆形、尖锐、混乱、长直线）
  - 基于 ShapeAnalyzer 指标计算倾向强度
  - 在战斗时应用倾向修正（范围、伤害、暴击、攻速等）

- **Work Phase（工作阶段）** ⭐ 新增
  - 工作事件系统（10 个事件：加班、修改需求、客户反馈等）
  - 状态影响系统（压力、疲惫、灵感、心情、情绪）
  - 状态对墨境的影响（压力高时敌人增强、灵感高时奖励增加）

- **商店系统（最小可玩版本）** ⭐ 新增
  - 灵感恢复商品（小/中/大）
  - 武器强化商品（使用现有 INK_RELICS 系统）
  - 临时 Buff 商品（伤害/速度/生命/幸运提升）
  - 简单 UI（使用现有 label() 函数）

### 未完成 (P1)
- 增强不同武器攻击动画差异 ✅ **已完成** (2026-06-16)
- 完善画板类型到武器系统消费链路
- 优化地图生成玩法节奏

### 未开始 (P2)
- NPC 关系系统扩展
- 材料系统实装
- 武器进化系统完善
- 货币获取系统（当前仅能通过调试命令获得）
- 临时 Buff 实际应用（已添加到 gameState.tempBuffs，但未在战斗中生效）

## 开发原则

### 禁止
- 大规模重构现有架构
- 同时修改多个核心系统
- 删除已有可运行功能
- 删除已有剧情/叙事文本
- 修改 `GameState.js` 存档结构（除非明确需要）

### 允许
- 增量开发、小步修改
- Bug 修复
- 新系统扩展（在独立模块中）
- 新增场景/功能模块

## AI 接手流程

1. `git clone https://github.com/indigohamster/zzz.git`
2. 按顺序阅读：
   - `docs/PROJECT_STATE.md`
   - `docs/DESIGN_RULES.md`
   - `docs/TODO_QUEUE.md`
   - `docs/BUG_LOG.md`
   - `docs/Mojing_GDD.md`（世界观总纲）
   - `AI_HANDOFF.md`（本文件）
3. 从 `TODO_QUEUE.md` 中认领一个任务
4. 完成 → 更新 `docs/AI_HANDOFF.md` + `docs/TODO_QUEUE.md`
5. `git commit` + `git push`

## 下一任务

P1-2：完善画板类型到武器系统消费链路
（当前画板类型在 UI 层显示但未完全接入武器生成/切换流程）

## 最新修改说明

### P1-1：增强不同武器的攻击动画差异 ✅
- 新增 `getDaggerSlashPose()`：匕首快速连击动画，带振荡 flick 效果
- 新增 `getWhipLashPose()`：鞭打动画，长蓄力 + 爆裂前抽 + 长度延伸 + 波浪曲线
- 新增 `getStaffSpinPose()`：法杖旋转横扫动画，210° 大弧线环绕角色
- 新增 `staffSpin` 攻击模式（WEAPON_ATTACK_PATTERNS）
- 更新 `AttackController.js`：daggerSlash/whipLash 使用专属 animationPreset.name
- 更新 `WeaponSpriteRenderer.js`：getWeaponPose() 路由新增三路分支
- 更新 `WeaponArchetypes.js`：animationPreset 统一使用 `name` 键，dagger/staff 指向新模式
- 更新 `builds/WeaponArchetypes.js`：staff attackPattern → "staffSpin"
- 修正 dagger/staff/whip 不再复用 sword/spear 动画

### Commit: `debcb13` - 商店系统
- 新增 `src/game/ShopSystem.js`：定义商品数据结构和购买逻辑
- 修改 `src/main.js`：添加商店场景的渲染和逻辑
- 文档：`ShopSystem_Documentation.md`

### Commit: `96bde6c` - Work Phase
- 扩展 `GameState.js`：添加 stress（压力）字段
- 创建 `WorkEvents.js`：定义工作事件池（10 个事件）
- 扩展 `DayCycle.js`：实现 work 阶段的事件系统
- 更新 `main.js`：添加 work 场景的渲染和逻辑
- 修改 `NPC.js`：实现压力对敌人强度的影响
- 修改 `RewardGenerator.js`：实现灵感对奖励数量的影响
- 文档：`WorkPhase_Design.md`、`WorkPhase_Flowchart.md`

### Commit: `8ec7838` - 绘制倾向系统
- 新增 `ShapeAnalyzer.calculateDrawingTendency()` 函数
- 扩展 `WeaponProfile` 添加 `drawingTendency` 字段
- 修改 `WeaponGenerator` 在生成武器时计算并存储倾向
- 修改 `AttackController` 在战斗时应用倾向修正
- 修改 `CombatSystem` 实现混乱倾向的随机伤害效果
- 文档：`绘制倾向系统-修改报告.md`、`绘制倾向系统-测试方法.md`

