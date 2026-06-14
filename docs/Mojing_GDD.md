# 墨水深渊 游戏设计文档 (Mojing_GDD.md)

> 整理自现有代码、原型和已有文档。不扩展设定，仅归纳已有内容。
> 更新：补充 Chapter0 序章内容和 MonsterCatalog 敌人体系。

---

## 1. 主角

**身份**：一个商业插画师/分镜师，白天在 Zhou 的工作室接商业稿件，画分镜、画角色、画不属于自己的故事。

**外观**（来自 `ProtagonistSprite.js` 和 `characters/protagonist/README.md`）：
- 12×20 像素左右的小型像素角色
- 凌乱的黑色短发
- 疲惫但专注的表情
- 宽松的深灰色卫衣
- 黑色工装裤
- 沾有墨渍的白色帆布鞋
- 自然肤色
- 墨蓝色点缀
- 右手持铅笔
- 旧耳机线细节

**内在状态**（来自 `GameState.js`）：
- `hp`: 100, `fatigue`: 0, `mood`: "tired", `emotion`: "calm", `inspiration`: 0, `inkMax`: 100

**核心冲突**：白天画商稿 vs. 夜晚画自己的东西。

**过去**（来自 `Chapter0.js` 对话）：
- 小时候画过一只小猫，"线条笨拙，但眼睛很亮"
- 那本旧画册一直放在书架上，"封皮已经褪色，边角磨圆了"
- 主角"几乎忘了它还在那里"
- 墨点认识主角很久了——"好久不见"，"你还好吗？"

---

## 2. 墨点 (Inkdot)

**来源**（来自 `Chapter0.js` + `OpeningScene.js`）：
- 最初只是草稿纸上的一个意外墨渍，后来开始动了
- 在 Chapter0 序章中：主角翻开小时候的画册后，墨点从画册中出现
- 它记得主角，会问"你还好吗？"
- 陪伴主角度过了无数个深夜

**外观**（来自 `Chapter0.js` `drawInkdot` + `OpeningScene.js`）：
- 深色圆形身体（`#1a1a2e`），带两个尖角
- 蓝色发光眼睛（`#80b0ff`）
- 身体周围有蓝色径向光芒
- 会微微弹跳（`Math.sin(frame * 0.06) * 2`）

**能力**：
- 发光：墨境开启时发出深蓝色光芒
- 开启传送门/墨迹扩散：从画册位置向四周扩散墨迹，吞没整个画面
- 引导玩家进入墨境

**对话**（来自 `Chapter0.js` LINES.inkdot_emerge / ink_entry）：
- "好久不见。"
- "……"
- "你还好吗？"
- "这里还是老样子。"
- "……"
- "又好像变了很多。"

**关系**（来自 `GameState.js`）：
- `npcRelations.inkdot: 1`（初始值）

---

## 3. 墨境 (Inkwell)

**进入方式**（来自 `Chapter0.js` INK_SPREAD 阶段 + `OpeningScene.js`）：
- 序章：墨迹从旧画册向四周扩散，逐渐吞没整个画面（`drawInkSpread` 效果）
- 后续循环：草稿纸上的墨迹流动，幽深入口展开

**世界性质**（来自 `WorldGen.js`、`core/config.js`）：
- 类 Terraria 的 2D 侧视角沙盒世界
- 世界尺寸：1280×260 tiles（8px 每 tile）
- Tile 类型：Air(0)、Paper(1)、Graphite(2)、Ink(3)

**房间类型**（来自 `WorldGen.js`）：
| 类型 | 名称 | 说明 |
|------|------|------|
| entrance | Draft Gate | 入口房间 |
| combat | Copied Pose Room | 战斗房间 |
| treasure | Supply Sketch | 宝箱房间 |
| resource | Ink Reservoir | 资源房间 |
| rift | Torn Paper Shaft | 裂隙/竖井房间 |
| boss | Boss Chamber | Boss 房间 |

**普通敌人**（来自 `MonsterCatalog.js` — 6 种）：
| ID | 类型 | 行为 | HP 修正 | 弱点 | 抗性 | 接触伤害 |
|----|------|------|---------|------|------|---------|
| sketchling | swarm | walker | 0 | sword, whip | — | 5 |
| inkmite | fast | skitter | -8 | dagger | hammer | 4 |
| binder | armored | guard | +12 | hammer | dagger, sword | 6 |
| margin_eel | longBody | skitter | +4 | spear | — | 5 |
| paper_kite | flying | leaper | -4 | spear, whip | hammer | 4 |
| blot_sentinel | sentinel | ranged sentinel | +8 | dagger, spear | whip | 7 |

**按房间刷怪**（来自 `MonsterCatalog.js` ROOM_SPAWN_TABLES）：
- combat: sketchling(5), inkmite(3), binder(2), paper_kite(2), blot_sentinel(1)
- resource: sketchling(4), binder(4), margin_eel(2), blot_sentinel(1)
- rift: inkmite(4), paper_kite(4), sketchling(2), blot_sentinel(2)

**Boss 变体**（来自 `BossCatalog.js`）：
| ID | 名称 | HP | 弱点 | 抗性 | 技能 |
|----|------|-----|------|------|------|
| template_engine | Template Engine | 155 | whip | dagger | pulse |
| eraser_warden | Eraser Warden | 185 | hammer | sword | slam |
| printhead_maw | Printhead Maw | 135 | spear | hammer | dash |

**时间限制**：90 秒夜间倒计时。Boss 死亡后出现返回传送门。

---

## 4. 现实世界

**公司**（来自 `GameState.js` currentBrief）：
- Zhou 的工作室，主角白天接商业稿

**租房房间**（来自 `Chapter0.js` — 可探索场景）：
- 电脑桌：屏幕上还亮着，客户要求再改一版，"已经是第五次修改了"
- 数字板：笔尖磨损得厉害，"今晚还没有动过它"
- 散落稿件：铺了半张桌子，"有些线条反复擦改，纸面都起了毛"
- 书架上的旧画册：封皮褪色，边角磨圆，里面是主角小时候画的画

**家 — 工作室**（来自 `OpeningScene.js` + `main.js`）：
- 个人创作空间，绘制画布、墙上草图、书桌、台灯

**商店**：仅 `money: 0` 数据预留，无场景实现。

---

## 5. AI 敌我同源设定

- `aiReferenceAllowed: false` — brief 明确禁止 AI 辅助
- 评分双轨制：商业评分（clear silhouette, usable action pose）vs. 灵魂评分（visible time investment, kept imperfect marks）
- Boss 命名全部来自创作工具：Template Engine、Eraser Warden、Printhead Maw
- 普通敌人命名也来自创作相关概念：sketchling（草图灵）、inkmite（墨螨）、binder（装订者）

---

## 6. 无限生成器设定

**武器生成管线**：绘制笔划 → StrokeRecorder → ShapeAnalyzer → WeaponClassifier → WeaponArchetypes → TraitGenerator → WeaponModifiers → WeaponProfile

**武器原型**（9 种）：dagger, sword, spear, hammer, shield, staff, sketch_sword, ink_spear, charcoal_hammer, brush_wave, paper_boomerang, line_whip

**世界生成**：确定性噪声 → 地牢房间 + 隧道连接 + 墨脉

**敌人生成**：按房间类型权重随机从 MonsterCatalog 选取

**Boss 生成**：从 BossCatalog 3 种变体中均匀随机选取

---

## 7. 游戏核心主题

- **创作与生存的交织**：绘制行为 → 战斗能力，墨境一切用创作术语命名
- **商业与灵魂的张力**：白天商稿 vs. 夜晚个人创作，双轨评分
- **深夜创作者的孤独与陪伴**：墨点是唯一陪伴，"好久不见"暗示主角可能"离开"过一段时间
- **童年与现在的对话**：旧画册中的小猫——主角几乎忘了它还在那里

---

## 8. 游戏核心循环

```
Chapter0（仅首次）→ Studio（绘制武器）→ Inkwell（墨境战斗）→ Feedback（早晨结算）→ 循环
```
