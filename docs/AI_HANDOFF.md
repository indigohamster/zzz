# AI Handoff

> 每次 AI 修改项目后，都必须更新本文件。

## 最近一次修改

### 本次目标
修复武器判定框死角问题（P0-1）：swept melee 命中检测未计入 NPC 体积，导致敌人明明在攻击弧内却打不中。

### 修改文件
- /StandalonePrototype/src/scenes/inkwell.js
- /StandalonePrototype/src/main.js（版本号 bump v32→v33）
- /docs/AI_HANDOFF.md
- /docs/BUG_LOG.md
- /docs/TODO_QUEUE.md

### 核心改动
- isNpcInSweepSample() 中新增 const npcRadius = getNpcHitRadius(npc) 并应用于四个检测点：
  - inner radius 检查：swept.innerRadius + npcRadius
  - tip radius 检查：swept.tipRadius + npcRadius
  - range 检查：swept.range + npcRadius
  - angle 检查：增加 Math.asin(npcRadius / dist) 角度容差
- 旧 composite hitbox 系统（getAttackHit / orientedRectOverlapsNpc / capsuleHitboxOverlapsNpc）一直有 NPC 体积补偿，但 swept melee（实际命中检测用的）没有——这就是死角根因。

### 当前状态
- 已完成：P0-1 武器判定框死角——根因修复
- 已完成：P0-2 角色转向后武器方向异常——上次已修复，本次未复测
- 未完成：P1-1 增强不同武器攻击动画差异
- 未完成：P1-2 完善画板类型到武器系统的消费链路
- 未完成：P1-3 优化地图生成玩法节奏

### 测试结果
- 代码已应用，版本号已 bump
- dev server 已启动在 http://127.0.0.1:4173
- 未进行完整浏览器实机游玩验证（需手动操作四种武器测试 hitbox 手感）

### 风险点
- NPC 半径补偿会让所有武器命中更宽容，可能会让游戏感觉太简单；如需要可后续调小 getNpcHitRadius 系数（当前 0.42）
- 角度容差 Math.asin(npcRadius/dist) 在极近距离（dist→0）时容差变大，但 innerRadius 已覆盖此情况
- P0-2 方向修复也未经过实机验证，两项叠加可能存在交互问题

### 下一个 AI 接手建议
优先处理：
1. 浏览器实机验证四种武器 hitbox 手感，必要时微调 SWEPT_MELEE_CONFIG 参数
2. 复测 P0-2 方向一致性
3. 继续 P1-1（武器攻击动画差异）

接手前仍需先阅读：
1. /docs/PROJECT_STATE.md
2. /docs/DESIGN_RULES.md
3. /docs/TODO_QUEUE.md
4. /docs/BUG_LOG.md
