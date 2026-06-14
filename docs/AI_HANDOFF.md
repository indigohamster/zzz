# AI Handoff

> 每次 AI 修改项目后，都必须更新本文件。

## 最近一次修改

### 本次目标
新增 Chapter0 序章场景，作为游戏的新入口体验。同时完成项目梳理阶段，生成 4 份核心设计文档。

### 修改/新增文件
**新增：**
- `/StandalonePrototype/src/scenes/Chapter0.js` — 序章场景（17428 bytes）
- `/docs/Mojing_GDD.md` — 核心游戏设计文档
- `/docs/PlayerLoop.md` — 玩家一日循环文档
- `/docs/WorldStructure.md` — 完整世界结构文档
- `/docs/DevelopmentRoadmap.md` — 开发路线图

**更新：**
- `/StandalonePrototype/src/main.js` — 集成 Chapter0 场景，默认入口改为 chapter0
- `/StandalonePrototype/index.html` — 版本号更新 v33→v34，移除 BOM
- `/docs/PROJECT_STATE.md` — 更新项目状态
- `/docs/AI_HANDOFF.md` — 本文件

**辅助脚本（根目录）：**
- `fix_c0.py` / `rebuild_c0.py` / `rebuild_c0_p2.py` / `rebuild_c0_p3.py` — 用于修复/重建 Chapter0.js 的 Python 脚本

### 核心改动
- Chapter0 场景：可探索的租房房间，包含 4 个可调查物品（电脑桌、数字板、散落稿件、旧画册），按 E 调查触发对话，依次经历 EXPLORE → SKETCHBOOK → INKDOT → INK_SPREAD → INK_ENTRY → FADE_OUT 6 个阶段
- 墨点对话首次有了中文语音文本（"好久不见"、"你还好吗"、"这里还是老样子"）
- 场景流变更为 chapter0 → studio → inkwell → feedback（opening 场景保留但非默认入口）
- 项目梳理阶段完成：从现有代码中归纳出世界观、玩家循环、世界结构、开发路线

### 当前状态
- 已完成：Chapter0 创建与集成，4 份设计文档写入
- 待验证：Chapter0 在浏览器中的完整流程、中文文本渲染是否正常

### 测试方法
启动 dev server 后访问 http://127.0.0.1:4173，应直接进入 chapter0 场景：
1. WASD/方向键 移动角色
2. 靠近物品按 E/Enter 调查
3. 调查旧画册 → 墨点出现对话 → 墨迹扩散 → 自动过渡到 studio

### 风险点
- Chapter0.js 的 Python 重建脚本使用 unicode escape 编码中文，文件本身为合法 UTF-8
- Chapter0 当前无音频，所有叙事为文本+Canvas 绘制
- 场景流中 opening 场景仍存在但不会被默认触发（可通过修改 main.js 恢复）
- 根目录的 4 个 Python 脚本是临时修复工具，后续可清理

### 下一个 AI 接手建议
优先处理：
1. 浏览器实测 Chapter0 完整流程（调查→对话→墨迹扩散→过渡）
2. 验证 Chapter0 → studio 场景切换正常
3. 继续 P1-1（武器攻击动画差异）或其他 P1 任务
4. 如果 Chapter0 流程无误，可清理根目录的 Python 修复脚本

接手前仍需先阅读：
1. /docs/PROJECT_STATE.md
2. /docs/DESIGN_RULES.md
3. /docs/TODO_QUEUE.md
4. /docs/BUG_LOG.md
5. /docs/Mojing_GDD.md（世界观总纲）
6. /docs/DevelopmentRoadmap.md（优先级路线图）
