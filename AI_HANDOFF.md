# 墨水深渊 AI 接手协议

## 当前版本

Commit: `14ebd96`
分支: `master` → 远程 `origin/main`
仓库: `https://github.com/indigohamster/zzz`

## 当前状态

### 已完成
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

### 未完成 (P1)
- 增强不同武器攻击动画差异
- 完善画板类型到武器系统消费链路
- 优化地图生成玩法节奏

### 未开始 (P2)
- Day Cycle "work" 阶段玩法（白天公司）
- 商店系统（仅有 `money: 0` 数据预留）
- NPC 关系系统扩展
- 材料系统实装
- 武器进化系统完善

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

P1-1：增强不同武器的攻击动画差异
（当前 sword/spear/dagger/hammer 外观数据不同但视觉表现几乎一样，且 fallback BasicSlash 仍在部分流程中生效）
