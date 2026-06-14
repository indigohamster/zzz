# Bug Log

## 已知问题

### 1. 武器判定框死角多
- 状态：已修复，待实机验证
- 表现：部分武器攻击时命中体验不好，敌人明明靠近却打不中
- 根因：
  - swept melee 命中检测（isNpcInSweepSample）只检查 NPC 中心点到玩家的距离和角度，未计入 NPC 体积（getNpcHitRadius）
  - 旧 composite hitbox 系统（orientedRectOverlapsNpc / capsuleHitboxOverlapsNpc）有 NPC 体积补偿，但 swept melee 没有——导致大型敌人身体已进入攻击弧但中心点刚好在范围外时无法命中
- 已做处理：
  - isNpcInSweepSample 新增 npcRadius = getNpcHitRadius(npc)
  - 四个检测点均加入 NPC 半径补偿：inner radius、tip radius、range、angle（用 Math.asin 提供角度容差）
- 建议复测：
  - 四种武器（sword / spear / hammer（axe）/ dagger）分别实机测试 hitbox 手感
  - 必要时微调 SWEPT_MELEE_CONFIG 参数

### 2. 转向后武器方向/攻击方式异常
- 状态：已处理，需实机复测
- 表现：角色转向后，武器攻击方向或攻击方式发生异常
- 根因：
  - AttackController 已保存 `attackAngle`、`dirX`、`dirY`，但 swept melee 实际命中检测仍用 `facing > 0 ? 0 : Math.PI`，导致实际伤害扇区只按左右方向计算。
  - 鼠标斜向/上下瞄准时，武器视觉和普通 hitbox 可朝向 `attackAngle`，实际命中却仍按左右 facing，造成方向不一致。
- 已做处理：
  - 攻击开始瞬间记录 `playerDirection` 和 `attackDirection` 快照。
  - swept melee 参数增加 `attackAngle`、`dirX`、`dirY`。
  - swept melee 命中检测和调试绘制统一使用 `attackAngle`。
  - 新增 `[AttackDirection]` 日志。
- 建议复测：
  - 向左攻击时判定框在左侧
  - 向右攻击时判定框在右侧
  - 鼠标向上/向下或斜向攻击时，视觉、debug 扇区、实际命中方向一致
  - 不同武器不会因为转向而变成错误攻击方式

### 3. 不同武器攻击动画差异不明显
- 状态：未解决
- 表现：武器类型变化了，但攻击表现看起来差不多
- 可能原因：
  - 仅切换了武器数据，未切换动画/特效
  - fallback BasicSlash 仍在部分流程中生效
  - attackPattern 没有进入实际播放逻辑
