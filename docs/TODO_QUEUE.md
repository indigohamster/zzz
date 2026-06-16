# Todo Queue

## 当前优先级 P0

### P0-1 修复武器判定框死角问题
状态：已修复，待实机验证。

目标：让不同武器的攻击判定更符合视觉表现，减少明显打不中的情况。

### P0-2 修复角色转向后武器方向异常
状态：已处理，需实机复测。

---

## 已完成

### P0-1 / P0-2 状态
- P0-1：swept melee 命中检测加入 NPC 体积补偿
- P0-2：swept melee 统一使用 attackAngle 方向

### P1-1 增强不同武器的攻击动画差异
状态：✅ 已完成 (2026-06-16)。

详情：
- 新增 `daggerSlash`（匕首连击 + flick 震荡）、`whipLash`（鞭打蓄力+爆裂+波浪）、`staffSpin`（法杖 210° 旋转横扫）三种专属动画
- 修改文件：`AttackController.js`、`WeaponSpriteRenderer.js`、`WeaponArchetypes.js`、`builds/WeaponArchetypes.js`

### OpeningScene 开场场景
状态：已完成。

### Chapter0 序章场景
状态：已完成，待实机验证。

内容：
- 可探索租房房间（电脑桌、数字板、散落稿件、旧画册）
- 调查物品触发中文对话
- 墨点出现并对话（"好久不见"、"你还好吗"）
- 墨迹扩散效果 → 过渡到 studio

### 项目梳理阶段 — 设计文档
状态：已完成。

生成文档：
- `/docs/Mojing_GDD.md` — 核心游戏设计
- `/docs/PlayerLoop.md` — 玩家一日循环
- `/docs/WorldStructure.md` — 完整世界结构
- `/docs/DevelopmentRoadmap.md` — 开发路线图

---

## 当前优先级 P1

### P1-1 增强不同武器的攻击动画差异
状态：✅ 已完成 (2026-06-16)。

目标：不同武器在视觉上能明显区分（动画/特效差异）。

改动内容：
- 匕首不再复用剑的弧线挥砍，改用快速 flick 连击动画 (daggerSlash)
- 鞭子不再复用枪的直线突刺，改用蓄力-爆裂-波浪抽打动画 (whipLash)
- 法杖不再复用剑的弧线挥砍，改用 210° 大弧线旋转横扫动画 (staffSpin)
- WeaponArchetypes.js 的 animationPreset 统一使用 `name` 键
- builds/WeaponArchetypes.js 中 staff 的 attackPattern 更新为 staffSpin

### P1-2 完善画板类型到武器系统的消费链路
目标：画出来的类型必须实际进入战斗系统，而不是只在 UI 层显示。

### P1-3 优化地图生成玩法节奏
目标：让地图生成更有路线选择、风险收益和变化感。

---

## 当前优先级 P2（后续）

### P2-1 Day Cycle "work" 阶段玩法
目前仅有 phase 定义，无场景/玩法。

### P2-2 Chapter0 实机验证与微调
- 调查物品交互距离是否舒适
- 中文文本渲染是否正常
- 墨迹扩散过渡是否流畅
- 清理根目录 Python 修复脚本

### P2-3 实机验证 P0 两个 bug 修复
使用浏览器逐一测试 4 种武器在各方向攻击时的 hitbox 表现。
