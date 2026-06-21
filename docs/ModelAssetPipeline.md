# Model Asset Pipeline

更新时间：2026-06-22

## 产品目标

角色模型不是一次性贴图，而是一条持续扩展的资产管线。后续新增角色、替换角色、补动作时，必须能按类型找到资源、按模型找到动作、按检查脚本确认不会在浏览器里丢图或报错。

## 类型目录

```text
StandalonePrototype/assets/sprites/models/
├── player/       # 主角与可操作角色
├── companions/   # 伙伴、宠物、跟随物
├── story_npcs/   # 墨境 NPC、剧情角色、压力化身
├── office_npcs/  # 白天办公室角色、客户、同事
├── monsters/     # 普通怪物
└── bosses/       # Boss 和大型遭遇体
```

## 每个模型包至少包含

- `base.png`：透明背景基础角色图
- `config.json`：模型元数据、类型、锚点、动作表
- `idle_strip.png`：待机或漂浮动作
- `walk_strip.png`：移动、敌意游走或重型摆动动作
- `talk_strip.png`：对话、反馈、激活态动作
- `hurt_strip.png`：受击动作
- `animations/<action>/frame_XX.png`：动作分帧
- `frame_data.json`：每个动作的帧、时长和锚点
- `motion_profile.json`：当前动作生成方式和后续精修备注
- `anchor_preview.png`：动作帧和脚底锚点预览
- `portrait.png`、`icon.png`、`silhouette.png`：UI/地图/占位用途

主角模型额外包含：
- `rig/rig.json` 和 `rig/parts/*.png`
- `turnaround/`
- `run_strip.png`、`draw_strip.png`、`jump_strip.png`

## 运行时接入

核心文件：`StandalonePrototype/src/core/SpriteAssets.js`

- 新模型必须加入 `MODEL_DEFS` 或通过 alias 指向已有模型
- `folder` 必须写类型路径，例如 `office_npcs/office_zhou`
- 办公室 NPC 的激活态使用 `motion: 'talk'`
- 怪物通常使用 `motion: 'hostile'`
- Boss 使用 `motion: 'boss'`
- 主角动画表单独维护，不继承通用 `talk`

## 当前状态

- 19 个模型定义已接入 typed folders
- 主角已有 rig-baked jump 原型
- 18 个非主角模型已有第一版 typed motion pack
- 最新缓存链：`bootstrap.js?v=55` → `main.js?v=79` → `SpriteAssets.js?v=21`

## 验证方式

```powershell
cd D:\InkwellDeep

# JS 语法检查
$node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$files = rg --files StandalonePrototype/src -g "*.js"
foreach ($f in $files) { & $node --check $f }
```

还需要验证：
- `model_pack_index.json` 中每个 folder 都存在
- 每个模型定义引用的动画文件都存在
- HTTP import walk 没有 404
- 浏览器刷新后没有 Runtime error 或 console error

## 下一步建议

优先把以下角色升级到更精细的 rig-baked 动作：

1. 办公室四人组：Zhou、Mira、Ren、Client
2. Supply Keeper 和 Inkdot
3. 最常出现的普通怪物
4. 一个 Boss，用来定 Boss 级别动画标准
