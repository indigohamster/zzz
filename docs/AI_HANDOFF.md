# AI Handoff

> 每次 AI 修改项目后，都必须更新本文件。

## 最近一次修改

### 2026-06-22 像素角色模型包与类型目录
用户强调“每个类型的角色要单独建文件夹”，并要求继续让其他角色也对应开始动起来。产品判断：这不是单纯整理文件，而是要建立可持续的角色资产生产管线，方便后续按主角、伙伴、办公室 NPC、墨境 NPC、怪物、Boss 分别扩展动作、替换模型和检查资源。

修改：
- `StandalonePrototype/assets/sprites/models/` 顶层改为类型目录：`player/`、`companions/`、`story_npcs/`、`office_npcs/`、`monsters/`、`bosses/`
- 主角迁入 `player/protagonist/`，保留完整 rig-baked jump、turnaround、动作 strip、分帧和锚点预览
- 18 个非主角模型生成第一版 typed motion pack：`idle/walk/talk/hurt`、分帧目录、`frame_data.json`、`motion_profile.json`、`anchor_preview.png`
- `src/core/SpriteAssets.js` 接入新类型路径和 `talk` 动画，办公室 NPC 激活时会读取对应 `talk_strip.png`
- 新增/更新资源说明：`assets/sprites/models/MODEL_PACKS.md`、`assets/sprites/models/model_pack_index.json`、`docs/ModelAssetPipeline.md`
- 新增 `.gitignore` 忽略本地 `.codex/` 工具配置

验证：
- ✅ 80 个 JS 文件 `node --check` 通过
- ✅ 19 个模型定义、19 个索引模型资源检查通过，无缺失动画文件
- ✅ HTTP import walk：扫描 83 个模块、185 条 import，无 404/加载失败
- ✅ 浏览器刷新：`bootstrap.js?v=55`，无 Runtime error，控制台无新增 error
- ✅ 已推送到 GitHub：`master -> origin/main`

### 2026-06-20 探索欲第一版
用户强调“探索是重点之一”。判断当前问题是地图/房间虽然存在，但未知感和发现记录不足，玩家缺少“我找到了东西”的即时与长期反馈。

修改：
- src/inkwell/MapSystem.js：全图只显示已探索房间；未探索但接近已揭开区域的房间显示问号，不暴露类型
- src/scenes/inkwell.js：新增探索点生成、绘制、E inspect、发现奖励、发现计数和结算数据
- src/main.js：早晨反馈页新增 Exploration finds
- src/core/TuningConfig.js / tuning.config.js：新增 exploration 调参段
- src/bootstrap.js / src/main.js / src/scenes/inkwell.js / src/inkwell/MapSystem.js：bump query 版本到新版链路

验证：
- ✅ 79 个 JS 文件 node --check 通过
- ✅ import walk：从 src/bootstrap.js 追踪 73 个本地模块，无缺失，HTTP fetch 全部通过
- ✅ 地图生成烟测：10 次生成全部 reachable，覆盖 4 种地图规则
- ✅ 主墨境探索烟测：start/update/draw 通过，并打开全图绘制未知房间遮蔽
- ✅ 主入口 fake DOM 烟测通过

### 2026-06-20 Flow / Ink Rush 玩法补丁
用户反馈“感觉不好玩”。判断问题不是内容数量，而是短循环反馈弱：探索、战斗、开箱、画布门都在做事，但缺少连续推进的即时奖励。

修改：
- src/scenes/inkwell.js：新增 Flow 运行态、房间探索检测、击杀/清房/开箱/画布门/裂口 Flow 奖励、Ink Rush HUD
- src/inkwell/Player.js：Ink Rush 期间提升移动速度、降低冲刺成本、增加墨水恢复
- src/core/TuningConfig.js / tuning.config.js：新增 flow 调参段，支持调 Flow 增长、Rush 时长和强化倍率
- src/bootstrap.js / src/main.js / src/scenes/inkwell.js / src/inkwell/Player.js：bump query 版本到新版链路

验证：
- ✅ 79 个 JS 文件 node --check 通过
- ✅ import walk：从 src/bootstrap.js 追踪 73 个本地模块，无缺失，HTTP fetch 全部通过
- ✅ 地图生成烟测：10 次生成全部 reachable，覆盖 4 种地图规则
- ✅ 主墨境 Flow 烟测：createInkwellScene().start/update/draw 通过
- ✅ 主入口 fake DOM 烟测：main.js 启动和首帧回调通过

### 2026-06-20 本次目标
新增一张集中调参表，方便用户自己改地图大小、夜晚时长、层级房间数、地图规则权重和画布门返回传送概率，不需要在多个系统文件里翻硬编码数字。

### 2026-06-20 修改文件
- `src/core/TuningConfig.js` — 新增核心调参表：world / night / layers / mapGeneration / portalReturn
- `src/core/config.js` — `WORLD_W` / `WORLD_H` 改为从调参表读取
- `src/inkwell/InkwellConfig.js` — 夜晚时长、加班时长和身体成本改为从调参表读取
- `src/inkwell/MapLayers.js` — 浅/中/深层 yRange、房间数量和房间权重改为从调参表读取
- `src/inkwell/WorldGen.js` — 地图规则随机权重和每层额外房间数改为从调参表读取
- `src/scenes/inkwell.js` — 画布门 outcome 接回主地图后果，并按 `TUNING.portalReturn` 概率随机送到其他房间
- `src/inkwell/NPC.js` — 恢复并补回 `spawnGateHunters()`，让高风险画布门后果可以刷追猎敌人
- `src/inkwell/StoryNPC.js` — 修复 `promptPulse` 作用域错误，避免主场景绘制时报 `promptPulse is not defined`
- `src/bootstrap.js` / `src/main.js` / 相关 import — bump module query，避免浏览器缓存旧配置

### 2026-06-20 重要修复
- 检查时发现 `src/scenes/inkwell.js`、`src/inkwell/Background.js`、`src/inkwell/Loot.js`、`src/inkwell/NPC.js`、`src/inkwell/TileDrawing.js` 被空字节污染，已从 Git 文本基线恢复，再补回必要的新配置和玩法连接点。
- 后续如果再次出现 `Invalid or unexpected token`、Git diff 显示某个 JS 为 binary，优先用字节扫描确认是否又被空字节污染。

### 2026-06-20 验证
- ✅ `node --check`：`TuningConfig.js`、`config.js`、`InkwellConfig.js`、`MapLayers.js`、`WorldGen.js`、`TileMap.js`、`MapSystem.js`、`VisualThemes.js`、`NPC.js`、`StoryNPC.js`、`inkwell.js`、`main.js`、`bootstrap.js`
- ✅ 地图生成烟测：8 次生成全部 `MapValidator reachable=true`，`WORLD_H=420` 生效，房间数约 21-31，底部房间到 `y=408`
- ✅ 递归 import 检查：从 `src/bootstrap.js` 出发扫描 71 个本地模块，无缺失文件
- ✅ 主场景运行时烟测：`createInkwellScene().start/update/draw` 通过，能走到地图生成、NPC 初始化和 PixelPolish 绘制
- ⚠️ `StartPrototype.ps1` 前台可启动静态服务，但当前托管环境里后台 `Start-Process` 没能保持 4173 端口；用户实机可直接运行脚本或刷新现有服务验证手感

### 2026-06-20 调参入口
优先改 `StandalonePrototype/src/core/TuningConfig.js`：
- 想让地图更大：改 `world.heightTiles`，再同步拉开 `layers.*.yRange`
- 想让房间更多：改 `layers.*.minRooms/maxRooms` 或 `mapGeneration.extraRoomsPerLayer`
- 想让某种地图更常见：改 `mapGeneration.ruleWeights`
- 想让画布门返回更疯：提高 `portalReturn.baseChance/maxChance/riskyChoiceBonus`
- 想让夜晚更长：改 `night.durationSeconds`

### 2026-06-20 白天场景补丁
用户反馈“现在都是墨境设计，商店/公司/白天上班呢”。本次先补最小白天入口：
- `src/main.js` 的 studio 现在显示 `DAY ROUTES`，可按 `S` 进入商店，按 `C` 进入公司
- 公司页从纯文字 Work Phase 改成 Zhou Studio 像素办公室，有工位、Zhou、brief 面板和状态变化面板
- 商店页从纯列表改成 `INKDOT NOOK` 小店，有货架、柜台、店主、钱包和商品详情面板
- `src/bootstrap.js` bump 到 `main.js?v=40`，刷新后应看到新白天入口
验证：`node --check main.js/bootstrap.js` 通过；`main.js?v=40` VM 首屏烟测通过；本地 HTTP `main.js?v=40` 返回 200。

### 本次目标
继续补玩法沉浸感：把画布门里的选择变成主地图后果，并加入深潜压力、随机回归传送和多种地图生成规则，让每晚下潜不再像同一张图换皮。

### 修改文件
- `src/ecology/GateConsequences.js` — 新增画布门后果规则：捷径/追猎/模板故障会改变压力、资源、时间和刷怪
- `src/ecology/SubMapScene.js` — 画布门子世界新增委托、房间目标、目标节点、风险奖励和完成条件
- `src/ecology/SubMapScene.js` — 目标节点新增玩法模式：记忆修复、追逐记录、危险拆除、恐惧封印、模板解码
- `src/ecology/SubMapScene.js` — 新增 outcome 结算：记录稳妥/冒险/强行处理/模板误触等选择并返回主地图
- `src/ecology/DiscoveryEffects.js` — 新增画布门发现物灌注效果
- `src/ecology/ArtworkCompletion.js` — 修复 jackpotsHit 计数 typo
- `src/inkwell/NPC.js` — 新增 `spawnGateHunters()`，让画布门后果能在主地图刷出追猎敌人
- `src/inkwell/WorldGen.js` — 新增 4 种地图生成规则：墨脊下潜、双流裂谷、碎礁群洞、塌陷墨井
- `src/inkwell/TileMap.js` — 新增 mapRule 存取接口，并给 WorldGen / MapValidator 加 query 版本
- `src/inkwell/MapSystem.js` — 全图 UI 显示当前地图规则名和描述
- `src/inkwell/MapValidator.js` — 保底地图会标记为“保底横廊”，避免 UI 显示错误规则
- `src/inkwell/NightObjectives.js` — 新增每晚目标池、进度计算、完成奖励和结算文本
- `src/inkwell/PixelPolish.js` — 新增前景像素遮挡、暗角抖动、扫描线和边缘噪声
- `src/inkwell/Background.js` — 背景新增远景墙面像素块、裂缝感和像素光束
- `src/inkwell/TileDrawing.js` — 地块新增暴露边缘碎屑、裂纹和深层发光细节
- `src/scenes/inkwell.js` — 画布门返回时应用发现物灌注，并显示画作完整度/灌注结果
- `src/scenes/inkwell.js` — 接入 canvas pressure / depth pressure、画布门后果回声和高压墨水消耗
- `src/scenes/inkwell.js` — 画布门探索返回后按风险概率随机传送到其他地图房间
- `src/scenes/inkwell.js` — HUD 左上角显示当前地图规则短名
- `src/scenes/inkwell.js` — 接入今晚目标 HUD、目标完成奖励和结算结果
- `src/scenes/inkwell.js` — 接入 PixelPolish 前景/后处理层
- `src/main.js` — 结算页新增 Discovery infusion、Canvas consequence 和 Night goal 反馈行
- `tuning.config.js` — 外置调参表，给非技术调试用，不需要改源码
- `src/bootstrap.js` / `src/main.js` — 启动时先 cache-bust 加载外置调参表，再加载新版主入口
- `src/core/TuningConfig.js` — 默认参数和外置参数合并，外置表只需要写想覆盖的字段
- `AI_HANDOFF.md` / `docs/AI_HANDOFF.md` / `docs/TODO_QUEUE.md` — 同步当前玩法状态

### 产品判断
用户明确要的是玩法更新，不是简单小游戏。因此画布门内部不能只靠收集物计数，而要像主地图探索的一段特殊插曲：房间有目标、操作有选择、奖励有风险、出口由委托完成度控制。
本次进一步把“进门探索”接回“出门变强”：玩家从门内带回的发现物会马上改变当前夜晚的手感，形成进门风险和主线成长之间的闭环。
本轮把闭环再推进一步：门内行为不只加数值，还会改变主地图压力、留下像素回声、刷出追猎敌人或给出捷径/时间补偿。这样画布门不是一个独立小玩法，而是会污染或帮助当前夜晚的风险事件。
本次根据用户反馈进一步补“未知感”：画布门返回不再必定原地继续，风险越高越可能被甩到危险/深层/支路房间；稳定后果也有小概率把玩家送到资源/探索路线。
地图生成原先主要是“弯曲中轴 + 左右房间”，随机度偏表面。本次加入地图规则预设，让竖井数量、支路密度、房间分布和风险偏向每晚变化。
本轮继续补齐“局内目标板块”：不是只让玩家下潜闲逛，而是每晚给一个明确短目标，并把目标奖励接入资源、发现物、时间或状态。
视觉判断：此前主墨境更像功能性方块原型，不够“精致像素游戏”。这次优先加近景遮挡、远景墙面、像素光束、暗角抖动和地块微细节，让画面更有层次和停留感。
用户希望配置表是外置的，能一边调参数一边测试。本轮把调参入口从源码中抽到 `StandalonePrototype/tuning.config.js`，浏览器刷新时会带时间戳重新加载，适合用户直接改数值后刷新体验。

### 验证
- ✅ `node --check StandalonePrototype/tuning.config.js`
- ✅ `node --check StandalonePrototype/src/core/TuningConfig.js`
- ✅ `node --check StandalonePrototype/src/bootstrap.js`
- ✅ 外置调参合并 Node 烟测：默认值保留，外置 `world.heightTiles` / `mapGeneration.extraRoomsPerLayer` / `portalReturn.baseChance` 均可覆盖
- ✅ 本地 HTTP 检查：`http://127.0.0.1:4173/tuning.config.js?ts=check` 返回 200
- ✅ 本地 HTTP 检查：`bootstrap.js`、`main.js?v=41` 返回 200
- ✅ `node --check StandalonePrototype/src/ecology/SubMapScene.js`
- ✅ `node --check StandalonePrototype/src/ecology/GateConsequences.js`
- ✅ `node --check StandalonePrototype/src/ecology/DiscoveryEffects.js`
- ✅ `node --check StandalonePrototype/src/ecology/ArtworkCompletion.js`
- ✅ `node --check StandalonePrototype/src/inkwell/NPC.js`
- ✅ `node --check StandalonePrototype/src/inkwell/NightObjectives.js`
- ✅ `node --check StandalonePrototype/src/inkwell/PixelPolish.js`
- ✅ `node --check StandalonePrototype/src/inkwell/Background.js`
- ✅ `node --check StandalonePrototype/src/inkwell/TileDrawing.js`
- ✅ `node --check StandalonePrototype/src/main.js`
- ✅ `node --check StandalonePrototype/src/scenes/inkwell.js`
- ✅ DiscoveryEffects Node 烟测：三种画布门分别改变恢复/伤害暴击/攻速不稳定
- ✅ GateConsequences Node 烟测：高风险门会提升 canvas pressure、扣资源并通过 `spawnGateHunters()` 刷追猎敌人
- ✅ WorldGen Node 烟测：24 次生成覆盖 4 种地图规则，且都包含入口/Boss 等关键房间
- ✅ TileMap Node 烟测：连续 8 次生成均通过 MapValidator reachable 检查，并能读到 mapRule
- ✅ NightObjectives Node 烟测：目标进度、完成奖励、重复领奖保护通过
- ✅ 视觉层 Node 烟测：Background / PixelPolish / TileDrawing 绘制函数均可在 fake canvas ctx 下运行
- ✅ Node canvas 烟测：三种画布门 `start()` / `update()` / `draw()` 均通过
- ✅ 子地图 Node 烟测：三种画布门启动/更新/绘制通过，outcome 回调结构保持可用
- ✅ 本地 HTTP 检查：`http://127.0.0.1:4173/src/ecology/SubMapScene.js` 返回 200
- ✅ 本地 HTTP 检查：`GateConsequences.js`、`WorldGen.js?v=2`、`inkwell.js?v=40`、`main.js?v=37` 均返回 200
- ✅ 递归 import 检查：从 `src/bootstrap.js` 出发检查 73 个本地模块，无缺失文件
- ⚠️ in-app browser 自动化仍被 Windows 权限阻止，需用户实机刷新后确认手感

### 当前状态
- ✅ 墨境已有纵向下潜地图、笔触闪掠/墨漂浮/墙面移动
- ✅ 画布门与画稿裂口可以作为特殊探索入口
- ✅ 画布门内部已有探索/事件/追逐/战斗/异常/危险/奖励房间
- ✅ 画布门内部现在按“委托完成度”开启出口，不再只是捡够收集物
- ✅ 非战斗房有可见目标节点；E/R/F 分别对应调查、记录、强行处理
- ✅ 奖励房可以稳妥拿奖励，也可以冒险换更多发现并触发额外处理目标
- ✅ 温馨涂鸦目标偏安抚、记录和贴近移动目标；恐怖草图目标偏拆危险、画安全线和封住视线
- ✅ AI 模板目标会显示当前解码键，按错会扣时间并可能激活额外扫描线
- ✅ 画布门完成时会返回 outcome：稳妥/冒险/强行处理/模板误触都会影响主地图后果
- ✅ 画布门发现物现在会触发三类灌注：温暖回响恢复并加触及；恐惧锋口加伤害/暴击但扣生命；越界模板加攻速/触及但提高不稳定
- ✅ 主地图新增 canvas pressure 和 depth pressure；深处和高压会逐步消耗墨水，极高压低墨时伤身体
- ✅ 画布门后果现在会留下主地图像素回声：稳定类像捷径标记，追猎类像污染脉冲
- ✅ 高风险画布门后果会通过 `spawnGateHunters()` 在主地图刷出追猎敌人
- ✅ 画布门返回时有概率随机传送：高风险后果更容易甩到危险/深层/支路房，稳定后果更偏资源/探索/宝箱房
- ✅ 地图生成每晚会抽一种规则：墨脊、双流、碎礁、塌井，影响竖井、支路、房间密度和风险偏向
- ✅ HUD 和全图会显示当前地图规则，方便用户实机对比每晚结构差异
- ✅ 早晨结算页会显示 Canvas consequence，让门内选择成为可记住的夜晚后果
- ✅ 早晨结算页会显示 Discovery infusion，让门内收获成为可记住的成长结果
- ✅ 每晚进入墨境会抽取一个 Tonight goal：画布门、战斗、补给、下潜或深潜
- ✅ 右侧 HUD 会显示目标进度，完成后会给小奖励并在早晨结算显示 Night goal 结果
- ✅ 主墨境新增 PixelPolish 层，画面会有前景像素遮挡、暗角抖动、扫描线和边缘颗粒
- ✅ 背景/地块增加更多像素细节，不再只依赖大色块和简单矩形
- ✅ 主墨境像素风第一版完成，并新增浅/中/深视觉主题、房间像素地标和跨层标题
- ✅ studio 画板页已改为可走动房间内的桌面画板，笔触和识别/结果面板已像素化
- ✅ 外置调参表已可用：改 `StandalonePrototype/tuning.config.js` 后刷新浏览器即可测试新参数

### 下一个 AI 接手建议
优先让用户实机跑几晚：观察地图规则是否真的有差异，并测试画布门返回随机传送的概率是否舒服。下一步建议直接改 `StandalonePrototype/tuning.config.js` 调参：随机甩回概率、危险房权重、双流裂谷横向穿梭频率，然后继续做攻击命中特效、敌人受击反馈和门内房间专属像素资产。

接手前仍需先阅读：
1. /docs/PROJECT_STATE.md
2. /docs/DESIGN_RULES.md
3. /docs/TODO_QUEUE.md
4. /docs/BUG_LOG.md
- ✅ `node --check StandalonePrototype/src/inkwell/WorldGen.js`
- ✅ `node --check StandalonePrototype/src/inkwell/TileMap.js`
- ✅ `node --check StandalonePrototype/src/inkwell/MapSystem.js`
- ✅ `node --check StandalonePrototype/src/inkwell/MapValidator.js`
