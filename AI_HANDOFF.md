# 墨水深渊 AI 接手协议

## 当前版本

更新时间：2026-06-22
分支：本地 `master` → 远程 `origin/main`
仓库: `https://github.com/indigohamster/zzz`

最近已推送提交：
- `3baa388` Ignore local Codex config
- `0ef36c4` Organize pixel model packs by character type

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

- **像素角色模型包与类型目录** ⭐ 新增
  - 角色资源不再平铺在 `assets/sprites/models/` 根目录，已按类型拆成 `player/`、`companions/`、`story_npcs/`、`office_npcs/`、`monsters/`、`bosses/`
  - 新增 `model_pack_index.json` 和 `MODEL_PACKS.md`，记录模型包索引、必备文件和生产规范
  - 主角迁入 `player/protagonist/`，包含 `rig/rig.json`、拆分部件、turnaround、idle/walk/run/draw/jump/hurt 分帧与 strip
  - 18 个非主角模型已生成第一版 typed motion pack：`idle/walk/talk/hurt` strip、`animations/<action>/frame_XX.png`、`frame_data.json`、`motion_profile.json`、`anchor_preview.png`
  - `SpriteAssets.js` 已接入类型目录和 `talk` 动画，办公室 NPC 激活时会读取 `talk_strip.png`
  - 缓存版本已推进到 `bootstrap.js?v=55`、`main.js?v=79`、`SpriteAssets.js?v=21`
  - 验证：80 个 JS `node --check` 通过，19 个模型定义资源无缺失，HTTP import walk 扫描 83 个模块/185 条 import 无失败，浏览器刷新无 Runtime error

- **集中调参表** ⭐ 新增
  - 新增 `StandalonePrototype/src/core/TuningConfig.js`，集中管理世界尺寸、夜晚时长、地图层区间、房间数量、地图规则权重和画布门返回传送概率
  - `config.js`、`InkwellConfig.js`、`MapLayers.js`、`WorldGen.js`、`inkwell.js` 已接入该表
  - 当前地图高度为 `WORLD_H=420`，地图生成烟测 8 次均 reachable，房间数约 21-31
  - 本次同时恢复了多个被空字节污染的 JS 文件，并修复 `StoryNPC.js` 的 `promptPulse` 运行时错误

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

- **地图下潜节奏第一版** ⭐ 新增
  - 主地图从横向随机房间改为纵向下潜剖面
  - 蜿蜒主下潜通道 + 左右分支洞穴
  - 每晚抽取地图规则：墨脊下潜 / 双流裂谷 / 碎礁群洞 / 塌陷墨井
  - 地图规则会影响竖井数量、支路密度、房间分布和危险房偏向
  - 浅/中/深层房间分布体现资源、补给、危险和裂口递进
  - 全图 UI 显示深度带、房间图标、主路/分支和高风险标记

- **墨迹移动第一版** ⭐ 新增
  - Shift 改为笔触闪掠，支持 WASD/方向键八方向位移
  - 空中按住 Space 会墨漂浮，降低下落速度并消耗少量墨水
  - 贴墙按方向会墨迹缓降，按 Space 可墙面反弹
  - 增加移动残影、漂浮曲线和墙面墨迹视觉反馈

- **传送入口第一轮打磨** ⭐ 新增
  - 画布门刷点排除入口/返回/Boss/裂口/危险房
  - 靠近画布门或裂口时显示入口类型、危险等级和奖励倾向
  - 进入/返回入口时显示主场景屏幕反馈
  - 修复 RiftWorld `worldState` 暴露旧对象的问题

- **画布门内容生成升级** ⭐ 新增
  - 每次进入画布门会抽取子世界规则主题
  - 子世界拆成探索/事件/追逐/战斗/异常/危险/奖励等特殊房间
  - 进入画布门后会抽取门内委托，出口由委托完成度开启
  - 非战斗房新增可见目标节点，E/R/F 对应调查、记录、强行处理
  - 奖励房新增稳妥奖励 / 冒险加码选择，冒险会触发额外处理目标
  - 温馨涂鸦、恐怖草图、AI 模板的目标处理方式开始分化
  - 门内发现物返回主地图后会触发灌注效果，改变当前武器/玩家状态
  - 门内选择会返回 outcome，稳妥/冒险/强行处理/模板误触会改变主地图后果
  - 新增 Canvas consequence：改变 canvas pressure、资源、时间和主地图刷怪
  - 新增 depth pressure：深潜和画布门压力会逐步消耗墨水，高压低墨会伤身体
  - 完成画布门后会留下主地图像素回声，稳定类像捷径，追猎类像污染脉冲
  - 画布门返回时有概率随机传送到主地图其他房间，高风险后果更容易甩到危险/深层/支路房
  - 早晨结算页新增 Canvas consequence 行，记录门内选择造成的夜晚后果
  - 每晚进入墨境会抽取 Tonight goal，HUD 显示进度，完成后给即时奖励
  - 主墨境新增 PixelPolish 画面层，强化精致像素风和沉浸感
  - 进入房间会显示房间类型、房间名和短目标，HUD 同步当前房间
  - 温馨涂鸦有会跑的太阳、蜡笔河、纸船愿望等内容
  - 恐怖草图有橡皮擦巡逻、门缝凝视、描黑线等压力机制
  - AI 模板有网格夹持、复制扫描线、提示词墓碑和异常像素
  - 战斗房有敌性生物接触扣时间、F 驱散和血条反馈
  - 子地图 HUD 显示当前规则、委托进度、发现数量和出口条件

- **像素风视觉第一版** ⭐ 新增
  - 墨境背景改为分层像素洞穴/深海感，加入块状远景、水柱和漂浮像素尘
  - 地块改成高对比像素描边、顶面高光、侧面暗边和纸/石墨/墨块纹理
  - 主角 sprite 增加像素轮廓、亮面、墨罐装备和青蓝高光
  - 画布门改为像素画框、门芯扫描线和像素火花，不再依赖 emoji 作为主体
  - 画布门/裂口子世界的收集物、生物、出口和玩家统一为像素方块风

- **像素风视觉层级增强** ⭐ 新增
  - 新增 `VisualThemes.js` 统一浅/中/深三层视觉主题
  - 背景、地块、HUD、敌人、掉落物会按当前层级切换颜色和氛围
  - 裂口入口增加黑底像素背板、核心点和标签底条，复杂地形上更容易读
  - 主墨境 HUD 改为深色像素面板，层级名、收集数和操作提示更清晰
  - 房间新增像素地标和短标签，战斗/资源/危险/奖励房更容易一眼区分
  - 玩家跨入新深度层时显示短标题，强化“正在下潜”的节奏

- **Studio 画板房间像素化** ⭐ 新增
  - 新增 `StudioRoom.js`，把画板操作页改成可走动的夜晚房间/桌面环境
  - 默认进入 studio 时不是直接画画，而是在房间里移动，靠近画板按 E 或点击画板才进入绘制
  - 画板、识别面板、工具按钮、完成按钮都改为像素块面 UI
  - 绘制笔触改为方块采样，导出的武器图也会保留像素笔触
  - 结果面板改为像素读数屏，减少普通网页卡片感

### 未完成 (P1)
- 增强不同武器攻击动画差异 ✅ **已完成** (2026-06-16)
- 完善画板类型到武器系统消费链路
- 优化地图生成玩法节奏 ✅ **第一版完成** (2026-06-18)

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

### 墨迹移动第一版 ✅
- 更新 `InkwellConfig.js`：新增笔触闪掠、墨漂浮、墙面墨迹移动参数
- 更新 `Player.js`：Shift 从水平冲刺扩展为方向性笔触闪掠
- 更新 `Player.js`：空中长按 Space 进入墨漂浮，贴墙推方向进入墙面缓降
- 更新 `Player.js`：新增墙面反弹跳和移动残影绘制
- 更新 `inkwell.js`：HUD 控制提示同步为 Space drift / WASD + Shift brush dash
- 产品目标：让墨境移动从“地面跑跳”变成更像在纸面和墨里穿梭

### 传送入口第一轮打磨 ✅
- 更新 `CanvasGate.js`：画布门只刷在适合发现入口的房间，避免入口/返回/Boss/裂口/危险房
- 更新 `CanvasGate.js`：画布门实例记录 roomId、roomType、layerId、layerName、riskTier
- 更新 `inkwell.js`：靠近画布门/裂口时显示入口卡片，说明危险等级和奖励倾向
- 更新 `inkwell.js`：进入/返回入口时显示主场景反馈消息
- 更新 `RiftWorld.js`：`worldState` 保持同一对象，避免外部读取到旧状态
- 产品目标：让入口从“能触发”变成玩家能理解和判断风险的探索节点

### 画布门内容生成升级 ✅
- 更新 `SubMapScene.js`：新增 CONTENT_RULES，每种画布门随机抽取子世界规则主题
- 更新 `SubMapScene.js`：子地图新增房间层，包含探索/事件/追逐/战斗/异常/危险/奖励房
- 玩家进入房间时显示房间类型、房间名和目标；HUD 显示当前房间
- 温馨涂鸦：生成会跑的太阳、蜡笔河、纸片野餐和童年回忆采集物
- 恐怖草图：生成橡皮擦巡逻、门缝凝视、描黑线，并用时间损失制造压力
- AI 模板：生成完美网格、网格夹持、复制扫描线、提示词墓碑和异常碎片
- 战斗房：负面/模板生物接触扣时间，靠近后按 F 可驱散，敌人显示血条
- 子地图 HUD 显示规则名、房间名、委托进度、发现数量和出口条件，采集/危险触发有消息反馈
- 新增门内委托和目标节点：非战斗房用 E/R/F 推进目标，战斗房清空敌性生物才完成
- 奖励房可选择稳妥拿奖励，也可冒险换更多发现并触发额外处理目标
- 温馨涂鸦：目标偏安抚、记录、贴近移动目标，强行处理收益低但代价高
- 恐怖草图：目标偏拆危险、画安全线、封住视线，强行封印可能惊醒额外敌性生物
- AI 模板：目标变成按提示键解码，节点会显示当前 E/R/F，按错会扣时间并可能激活扫描线
- 新增 `DiscoveryEffects.js`：画布门发现物返回后会触发灌注效果
  - 温暖回响：恢复生命/墨水，并增加武器触及
  - 恐惧锋口：增加武器伤害/暴击，但扣除生命
  - 越界模板：增加攻击速度/触及，但提高伤害不稳定性
- 更新 `inkwell.js`：画布门返回时应用发现物灌注，显示画作完整度和灌注名称
- 更新 `main.js`：早晨结算页新增 `Discovery infusion` 行
- 新增 `GateConsequences.js`：画布门 outcome 转换为纸船捷径、门缝追视、模板反同步等主地图后果
- 更新 `SubMapScene.js`：结算时返回 outcome，记录稳妥/冒险/强行处理/模板误触/危险拆除等选择
- 更新 `NPC.js`：新增 `spawnGateHunters()`，高风险画布门后果可以在主地图刷出追猎敌人
- 更新 `inkwell.js`：接入 canvas pressure、depth pressure、画布门像素回声和高压墨水消耗
- 更新 `main.js`：早晨结算页新增 `Canvas consequence` 行
- 修复 `ArtworkCompletion.js`：`jackpotsHit` 计数拼写错误
- 新增 `NightObjectives.js`：每晚目标池、进度计算、完成奖励和结算文本
- 更新 `inkwell.js`：开局抽取目标，HUD 显示目标进度，完成后给奖励并写入结算
- 更新 `main.js`：早晨结算页新增 `Night goal` 结果行，并调整底部武器信息框避免遮挡成长反馈
- 更新 `bootstrap.js` / `main.js`：bump 模块版本号，避免浏览器继续缓存旧逻辑
- 新增 `PixelPolish.js`：主墨境前景像素遮挡、暗角抖动、扫描线和边缘颗粒
- 更新 `Background.js`：新增远景墙面像素块、裂缝感和像素光束
- 更新 `TileDrawing.js`：新增地块碎屑、裂纹和深层发光微细节
- 更新 `inkwell.js`：在 UI 前接入 PixelPolish 前景/后处理层
- 产品目标：让画布门内部像“进入一张画并完成一段特殊探索”，而不是换背景捡固定道具

### 像素风视觉第一版 ✅
- 更新 `Background.js`：背景改为横版像素分层，加入深度色带、水柱、块状远景和漂浮像素尘
- 更新 `TileDrawing.js` / `config.js`：地块色盘和画法改为高对比像素描边、顶面高光和块面纹理
- 更新 `ProtagonistSprite.js`：主角增加更明确的像素轮廓、亮面和墨罐装备
- 更新 `CanvasGate.js`：画布门改为像素画框和门芯扫描线，减少柔光/emoji 风格
- 更新 `SubMapScene.js` / `RiftWorld.js`：子世界收集物、生物、出口和玩家统一为像素 sprite
- 更新 `inkwell.js`：世界层加入像素水体/暗角滤镜，保持 HUD 清晰
- 产品目标：整体更接近泰拉瑞亚式横版像素探索，同时保留潜水员戴夫式深海下潜氛围

### 像素风视觉层级增强 ✅
- 新增 `VisualThemes.js`：集中管理浅层草稿区 / 中层废稿区 / 深层模板污染区的色带、地块色和 HUD 强调色
- 新增 `LayerLandmarks.js`：在主墨境房间内绘制层级化像素地标和房间短标签
- 更新 `Background.js`：背景远景、水柱、漂浮像素尘随当前深度层切换，不再全图一个色调
- 更新 `TileDrawing.js`：纸、石墨、墨块按浅/中/深层换色，保留像素描边和顶面高光
- 更新 `NPC.js` / `Loot.js`：敌人、Boss、宝箱、材料和道具有黑底轮廓与层级高光，移动画面中更容易读
- 更新 `CanvasRift.js`：裂口入口加入像素背板、中心核心和标签底条，强化“可进入入口”的视觉语义
- 更新 `inkwell.js`：HUD、世界氛围层、跨层标题接入主题色，修复旧的乱码文案占位
- 更新 `inkwell.js`：层级判断改为连续阈值，避免浅/中/深层之间的空档误跳回浅层
- 产品目标：让浅/中/深层从地图结构进一步变成肉眼可感知的像素世界层级

### Studio 画板房间像素化 ✅
- 新增 `StudioRoom.js`：绘制夜晚工作室背景、窗户、书架、桌面、画板夹具和 Inkdot
- 更新 `StudioRoom.js`：新增 studio 内玩家角色和交互提示
- 更新 `main.js`：studio 绘制页不再是纸质工具页，而是可走动房间里的桌面画板
- 更新 `main.js`：默认 room 状态支持 A/D 移动，靠近画板按 E 或点击画板进入 drawing 状态
- 更新 `main.js`：工具按钮、完成按钮、识别面板改为像素块面控件
- 更新 `DrawingCanvas.js`：玩家画线改为方块采样像素笔触，导出武器图也同步像素化
- 更新 `WeaponResultPanel.js`：武器结果面板改为像素读数屏
- 产品目标：让“画板房间操作”看起来仍在正常游戏环境里，而不是跳出到一个白板工具界面

### P1-3：地图下潜节奏第一版 ✅
- 更新 `WorldGen.js`：生成“主下潜通道 + 左右分支洞穴 + 层间捷径”的地图结构
- 更新 `WorldGen.js`：新增 4 种地图规则，避免每晚都是同一条中轴路线
- 更新 `TileMap.js`：保存当前 mapRule，供 HUD 和全图 UI 显示
- 房间新增 `layerId`、`layerName`、`depthRank`、`routeHint`、`riskTier` 元数据
- 浅层保证探索/资源/补给，中层保证战斗/奖励/危险，深层保证危险/战斗/裂口
- 深层地块更偏 Ink，危险房和 Boss 房边界更重，风险感更强
- 更新 `MapSystem.js`：全图显示地图规则、深度带、房间图标、主路/分支差异和 RISK 标记
- 产品目标：让墨境地图从“随机房间串联”变成更像一次向深处推进的探索路线

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

