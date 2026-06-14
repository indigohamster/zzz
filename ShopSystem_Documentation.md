# 商店系统文档 (Shop System Documentation)

> 最小可玩版本 - 使用现有数据结构扩展
> 
> 创建时间：2026-06-15
> 版本：v1.0

---

## 一、数据结构

### 1.1 商品数据结构 (ShopItem)

```javascript
{
  id: "inspiration_small",           // 商品唯一 ID
  name: "灵感恢复（小）",           // 显示名称
  desc: "恢复 20 点灵感",          // 描述
  price: 10,                        // 价格（货币）
  type: "inspiration_restore",       // 类型：inspiration_restore | weapon_upgrade | temp_buff
  value: 20,                        // 数值（根据类型不同）
  icon: "💡",                       // 图标
  relicId: "sword_keen_margin",    // （仅 weapon_upgrade 类型）遗迹 ID
  buff: {                           // （仅 temp_buff 类型）Buff 数据
    stat: "damage",
    value: 1.2,
    duration: "next_battle"
  },
  tags: ["sword", "damage"],       // （仅 weapon_upgrade 类型）标签
}
```

#### 商品类型说明

| 类型 | 说明 | 示例 |
|------|------|------|
| `inspiration_restore` | 灵感恢复 | 恢复 20/50/100 点灵感 |
| `weapon_upgrade` | 武器强化（购买遗迹） | 添加 `INK_RELICS` 到 `buildState` |
| `temp_buff` | 临时 Buff | 下次战斗伤害 +20%、攻速 +15% 等 |

---

### 1.2 商店状态数据结构 (ShopState)

```javascript
{
  selectedIndex: 0,        // 当前选中的商品索引
  selectedCategory: "inspiration", // 当前选中的分类（inspiration | upgrades | buffs）
  message: "",              // 显示消息（购买成功/失败）
  messageTimer: 0,         // 消息显示计时器（帧数）
}
```

---

### 1.3 游戏状态扩展 (GameState)

```javascript
{
  money: 0,              // 货币（已有字段）
  tempBuffs: [],          // 临时 Buff 列表（新增字段）
  status: {
    inspiration: 0,      // 灵感 (0-100)
    stress: 0,            // 压力 (0-100)
    fatigue: 0,           // 疲惫度 (0-100)
    // ... 其他状态字段
  },
  buildState: {
    relics: [],            // 已拥有的遗迹列表
    // ... 其他 build 状态
  },
}
```

---

### 1.4 临时 Buff 数据结构

```javascript
{
  stat: "damage",        // 影响的属性
  value: 1.2,           // 数值（乘数或加数）
  duration: "next_battle", // 持续时间（当前仅支持 "next_battle"）
  source: "buff_damage", // Buff 来源（商品 ID）
  remainingBattles: 1,   // 剩余战斗次数
}
```

---

## 二、商店流程

### 2.1 整体流程图

```
[工作室场景 "studio"]
        ↓
   按 "S" 键
        ↓
[商店场景 "shop"]
        ↓
  选择分类（Left/Right 键）
        ↓
  选择商品（Up/Down 键）
        ↓
  按 Enter 购买
        ↓
  扣除货币 + 应用效果
        ↓
  按 Escape 退出
        ↓
[返回工作室场景 "studio"]
```

---

### 2.2 详细流程

#### 步骤 1：进入商店
- **触发条件**：在工作室场景（"studio"）按 "S" 键
- **执行逻辑**：
  ```javascript
  if (key === "s" && scene === "studio") {
    shopState = createShopState();
    scene = "shop";
  }
  ```

#### 步骤 2：浏览商品
- **切换分类**：按 Left / Right 键（或 A / D 键）
  - 分类：`inspiration`（灵感恢复）、`upgrades`（武器强化）、`buffs`（临时 Buff）
- **选择商品**：按 Up / Down 键（或 W / S 键）
  - 高亮选中的商品

#### 步骤 3：购买商品
- **触发条件**：选中商品后按 Enter 键
- **执行逻辑**：
  1. 检查货币是否足够（`gameState.money >= item.price`）
  2. 如果足够：扣除货币 + 应用商品效果
  3. 如果不足：显示消息 "货币不足！"
- **应用效果**：
  - `inspiration_restore`：恢复灵感（`gameState.status.inspiration += item.value`）
  - `weapon_upgrade`：添加遗迹到 `buildState.relics`
  - `temp_buff`：添加 Buff 到 `gameState.tempBuffs`

#### 步骤 4：退出商店
- **触发条件**：按 Escape 键
- **执行逻辑**：
  ```javascript
  if (key === "escape" && scene === "shop") {
    shopState = null;
    scene = "free"; // 返回工作室
  }
  ```

---

### 2.3 商品效果详细说明

#### 灵感恢复（inspiration_restore）
- **效果**：恢复指定数量的灵感
- **实现**：
  ```javascript
  gameState.status.inspiration = Math.min(100, gameState.status.inspiration + item.value);
  ```

#### 武器强化（weapon_upgrade）
- **效果**：添加遗迹到 `buildState.relics`，下次生成武器时会应用该遗迹的 modifier
- **实现**：
  ```javascript
  buildState.addRelic(item.relicId);
  ```
- **注意**：如果已经拥有该遗迹，购买会失败（显示 "已经拥有遗迹"）

#### 临时 Buff（temp_buff）
- **效果**：添加临时 Buff 到 `gameState.tempBuffs`，下次战斗时生效
- **实现**：
  ```javascript
  gameState.tempBuffs.push({
    ...item.buff,
    source: item.id,
    remainingBattles: 1,
  });
  ```
- **消耗**：战斗结束后自动清空 `tempBuffs`
- **应用**：在 `AttackController.js` 的 `resolveBuildAttackStats()` 中应用 Buff 效果（需要后续实现）

---

## 三、测试步骤

### 3.1 测试准备

1. **启动开发服务器**
   ```bash
   cd C:\Users\Administrator\WorkBuddy\2026-06-15-01-24-10\zzz\StandalonePrototype
   npx http-server -p 4173 --cors
   ```

2. **打开浏览器**
   - 访问 `http://localhost:4173`
   - 按 F12 打开开发者工具 Console 标签页

3. **添加调试货币**（因为当前货币获取未实现）
   - 在 Console 中输入：
     ```javascript
     window.debugAddMoney(100);
     ```

---

### 3.2 功能测试

#### 测试 1：进入商店
1. 进入工作室场景（"studio"）
2. 按 "S" 键
3. **预期结果**：
   - 场景切换到商店（"shop"）
   - 显示纸张背景、标题 "Shop"、货币数量

#### 测试 2：切换分类
1. 在商店场景中，按 Left / Right 键（或 A / D 键）
2. **预期结果**：
   - 分类标签高亮切换（`inspiration` → `upgrades` → `buffs`）
   - 商品列表更新为当前分类的商品

#### 测试 3：选择商品
1. 按 Up / Down 键（或 W / S 键）
2. **预期结果**：
   - 选中商品高亮
   - 右侧显示商品详细描述

#### 测试 4：购买灵感恢复
1. 选择 `inspiration_small`（价格 10）
2. 按 Enter 键
3. **预期结果**：
   - 货币扣除 10
   - 灵感恢复 20 点
   - 显示消息 "灵感恢复了 20 点！"

#### 测试 5：购买武器强化
1. 切换到 `upgrades` 分类
2. 选择任意武器强化商品（例如 "Keen Margin"）
3. 按 Enter 键
4. **预期结果**：
   - 货币扣除相应数量
   - 遗迹添加到 `gameState.buildState.relics`
   - 显示消息 "武器强化成功！获得遗迹：Keen Margin"
   - 再次购买同一商品，显示 "已经拥有遗迹"

#### 测试 6：购买临时 Buff
1. 切换到 `buffs` 分类
2. 选择任意临时 Buff 商品（例如 "伤害提升"）
3. 按 Enter 键
4. **预期结果**：
   - 货币扣除相应数量
   - Buff 添加到 `gameState.tempBuffs`
   - 显示消息 "获得临时 Buff：伤害提升（持续 1 场战斗）"

#### 测试 7：货币不足
1. 确保货币 < 商品价格
2. 按 Enter 键购买
3. **预期结果**：
   - 显示消息 "货币不足！需要 X，当前 Y"

#### 测试 8：退出商店
1. 按 Escape 键
2. **预期结果**：
   - 返回工作室场景（"studio"）

---

### 3.3 回归测试

#### 测试 9：不影响其他系统
1. 进入商店，购买一些商品
2. 返回工作室，进入 Inkwell 战斗
3. **预期结果**：
   - 绘制系统正常工作
   - 战斗系统正常工作
   - 工作阶段系统正常工作

---

### 3.4 边界情况测试

#### 测试 10：空商品列表
1. （修改代码）设置某个分类的商品列表为空
2. **预期结果**：
   - 显示 "No items in this category"（需要在 `drawShop()` 中添加）

#### 测试 11：货币为 0
1. 确保货币为 0
2. 尝试购买任何商品
3. **预期结果**：
   - 显示 "货币不足！"

---

## 四、后续扩展

### 4.1 待实现功能

1. **货币获取系统**
   - 完成战斗后获得货币
   - 完成工作事件后获得货币
   - 当前仅能通过调试命令 `debugAddMoney()` 获得货币

2. **临时 Buff 实际应用**
   - 在 `AttackController.js` 的 `resolveBuildAttackStats()` 中应用 `tempBuffs`
   - 战斗结束后清空 `tempBuffs`

3. **更好的 UI**
   - 显示商品图标（当前只有 emoji）
   - 显示玩家状态（灵感、压力等）
   - 显示已拥有的遗迹

4. **更多商品**
   - 添加更多灵感恢复、武器强化、临时 Buff 商品
   - 添加新商品类型（例如：永久属性提升）

---

## 五、文件清单

### 5.1 新增文件
- `src/game/ShopSystem.js` - 商店系统核心逻辑

### 5.2 修改文件
- `src/main.js` - 添加商店场景的渲染和逻辑

### 5.3 文档文件
- `ShopSystem_Documentation.md` - 本文档

---

## 六、Git 提交信息

```
feat: 实现最小可玩商店系统

- 创建 ShopSystem.js：定义商品数据结构和购买逻辑
  - 灵感恢复商品（小/中/大）
  - 武器强化商品（使用现有 INK_RELICS 系统）
  - 临时 Buff 商品（伤害/速度/生命/幸运提升）
- 更新 main.js：添加商店场景的渲染和逻辑
  - 添加 updateShop() 和 drawShop() 函数
  - 添加 "S" 键进入商店
  - 添加 Left/Right 切换分类、Up/Down 选择商品、Enter 购买、Escape 退出
- 支持后续扩展：
  - 商品数据结构支持新类型
  - 商店状态管理支持新功能

相关文件：
- src/game/ShopSystem.js (新增)
- src/main.js (修改)

文档：
- ShopSystem_Documentation.md
```

---

**结束**
