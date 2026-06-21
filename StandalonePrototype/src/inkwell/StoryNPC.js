import { H, TILE, W } from "../core/config.js?v=27";
import { drawModelSprite } from "../core/SpriteAssets.js?v=2";
import { drawInkCompanionAt, drawPixelPersonAt } from "../characters/protagonist/ProtagonistSprite.js?v=28";

const TALK_RANGE = 54;

const STORY_NPCS = [
  {
    id: "inkdot",
    name: "墨点",
    role: "companion",
    roomTypes: ["entrance", "shop"],
    color: "#1d1b25",
    accent: "#7dd3fc",
    w: 18,
    h: 14,
    priority: 100,
    lineSets: {
      first: [
        "别急着往深处跳。这里的房间会记住你画画时的犹豫。",
        "看到补给房就来找我。我会把能用的墨和不能用的安慰分开。",
      ],
      repeat: [
        "我会跟着你的线走。你停下来的地方，通常有东西想说话。",
        "如果某个房间太完美，别相信它。完美有时候只是模板戴的面具。",
      ],
      deep: [
        "这里的墨味不对。它像是在模仿你，但没有手心的温度。",
        "带一点真正属于你的线回去。哪怕它歪，歪也算活着。",
      ],
    },
  },
  {
    id: "supply_keeper",
    name: "补给摊主",
    role: "shop",
    roomTypes: ["shop"],
    color: "#6b4b2a",
    accent: "#f2b84b",
    w: 20,
    h: 22,
    priority: 90,
    lineSets: {
      first: [
        "嘘，墨点把这间补给站借给我看一会儿。",
        "箱子里不是奇迹，只是能让你多撑几笔的东西。E 还是能开附近宝箱。",
      ],
      repeat: [
        "买卖以后再说。现在先记住：补给房不是逃避，是给下一笔留力气。",
      ],
    },
  },
  {
    id: "forgotten_draft",
    name: "旧稿小人",
    role: "memory",
    roomTypes: ["event", "explore", "resource"],
    preferredLayer: "middle",
    color: "#8b8173",
    accent: "#d8cfb8",
    w: 17,
    h: 21,
    priority: 70,
    lineSets: {
      first: [
        "你小时候给我画过一把太大的剑。你说那样我就不会害怕。",
        "后来你把我夹进旧画册里。没关系，我还是认得你的线。",
      ],
      repeat: [
        "别只带走材料。把你忘掉的理由也带一点回去。",
      ],
    },
  },
  {
    id: "deleted_character",
    name: "被删除的角色",
    role: "rift",
    roomTypes: ["rift", "event", "danger"],
    preferredLayer: "deep",
    color: "#4b3f72",
    accent: "#c9a8d8",
    w: 18,
    h: 24,
    priority: 60,
    lineSets: {
      first: [
        "我不是怪物。我只是被删到裂缝背面，还没学会安静。",
        "那些模板想把我们补全成同一种脸。你如果进去，记得把错误也留下。",
      ],
      repeat: [
        "裂缝里有东西会奖励你，也会改写你。进去前先看清自己想找什么。",
      ],
    },
  },
  {
    id: "zhou_redline",
    name: "Zhou 的红笔影",
    role: "pressure",
    roomTypes: ["event", "boss", "danger"],
    preferredLayer: "deep",
    color: "#7a1f2b",
    accent: "#ff6b73",
    w: 16,
    h: 28,
    priority: 50,
    lineSets: {
      first: [
        "客户要的是确定性。你带回来的这些颤抖线条，能交稿吗？",
        "……但也许正因为它们颤抖，才看得出是你画的。",
      ],
      repeat: [
        "往前走吧。Boss 房不是终点，只是你今晚必须面对的评审意见。",
      ],
    },
  },
];

export function createStoryNpcManager({ player, tileMap, run, gameState }) {
  const npcs = [];
  let activeNpc = null;
  let activeLines = [];
  let lineIndex = 0;
  let nearestNpc = null;
  let promptPulse = 0;

  function reset() {
    npcs.length = 0;
    activeNpc = null;
    activeLines = [];
    lineIndex = 0;
    const rooms = tileMap.getRooms();
    const occupiedRooms = new Set();

    for (const def of STORY_NPCS) {
      const room = pickRoomForNpc(def, rooms, occupiedRooms);
      if (!room) continue;
      occupiedRooms.add(room.id);
      npcs.push(createNpcInstance(def, room));
    }

    run.storyNpcs = npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      roomType: npc.roomType,
      layerId: npc.layerId,
    }));
  }

  function update() {
    promptPulse = (promptPulse + 1) % 120;
    nearestNpc = findNearestNpc();
  }

  function handleKey(key) {
    if (activeNpc) {
      if (key === "enter" || key === "e" || key === " ") advanceDialogue();
      if (key === "escape") closeDialogue();
      return true;
    }

    if (key !== "e") return false;
    const npc = nearestNpc ?? findNearestNpc();
    if (!npc) return false;
    beginDialogue(npc);
    return true;
  }

  function beginDialogue(npc) {
    activeNpc = npc;
    activeLines = resolveDialogue(npc);
    lineIndex = 0;
    npc.talkCount++;
    run.storyNpcTalks = (run.storyNpcTalks ?? 0) + 1;
    gameState.storyFlags[`story_npc_met_${npc.id}`] = true;
    if (npc.id === "inkdot") {
      gameState.npcRelations.inkdot = Math.max(gameState.npcRelations.inkdot ?? 0, 2);
    }
    if (npc.id === "zhou_redline") {
      gameState.npcRelations.zhou = Math.max(gameState.npcRelations.zhou ?? 0, 1);
    }
  }

  function advanceDialogue() {
    lineIndex++;
    if (lineIndex >= activeLines.length) closeDialogue();
  }

  function closeDialogue() {
    activeNpc = null;
    activeLines = [];
    lineIndex = 0;
  }

  function isDialogueOpen() {
    return Boolean(activeNpc);
  }

  function draw(ctx, cameraX, cameraY) {
    for (const npc of npcs) {
      const x = Math.floor(npc.x - cameraX);
      const y = Math.floor(npc.y - cameraY);
      drawNpc(ctx, npc, x, y, promptPulse);
      if (nearestNpc === npc && !activeNpc) drawTalkPrompt(ctx, npc, x, y, promptPulse);
    }
  }

  function drawDialogue(ctx) {
    if (!activeNpc || activeLines.length === 0) return;
    const text = activeLines[Math.min(lineIndex, activeLines.length - 1)];
    drawDialoguePanel(ctx, activeNpc, text);
  }

  function findNearestNpc() {
    let best = null;
    let bestDist = TALK_RANGE;
    for (const npc of npcs) {
      const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
      if (dist < bestDist) {
        best = npc;
        bestDist = dist;
      }
    }
    return best;
  }

  return {
    npcs,
    reset,
    update,
    handleKey,
    draw,
    drawDialogue,
    isDialogueOpen,
    getNearest: () => nearestNpc,
  };
}

function pickRoomForNpc(def, rooms, occupiedRooms) {
  const candidates = rooms
    .filter((room) => def.roomTypes.includes(room.type))
    .sort((a, b) => scoreRoom(def, b, occupiedRooms) - scoreRoom(def, a, occupiedRooms));
  if (candidates.length > 0) return candidates[0];

  const fallback = rooms
    .filter((room) => room.type !== "combat")
    .sort((a, b) => scoreRoom(def, b, occupiedRooms) - scoreRoom(def, a, occupiedRooms));
  return fallback[0] ?? rooms[0] ?? null;
}

function scoreRoom(def, room, occupiedRooms) {
  let score = 0;
  if (def.roomTypes.includes(room.type)) score += def.priority;
  if (def.preferredLayer && room.layerId === def.preferredLayer) score += 24;
  if (!occupiedRooms.has(room.id)) score += 18;
  if (room.routeHint === "main") score += 5;
  score -= Math.abs((room.depthRank ?? 0) - preferredDepth(def)) * 4;
  score -= room.riskTier ?? 0;
  return score;
}

function preferredDepth(def) {
  if (def.preferredLayer === "deep") return 2;
  if (def.preferredLayer === "middle") return 1;
  return 0;
}

function createNpcInstance(def, room) {
  const offset = offsetForRole(def.role);
  const xTile = clamp(room.x + room.w * offset.x, room.x + 6, room.x + room.w - 6);
  const yTile = room.y + room.h - 8;
  return {
    ...def,
    roomId: room.id,
    roomType: room.type,
    layerId: room.layerId,
    x: xTile * TILE,
    y: yTile * TILE,
    facing: offset.facing,
    talkCount: 0,
  };
}

function offsetForRole(role) {
  if (role === "companion") return { x: 0.22, facing: 1 };
  if (role === "shop") return { x: 0.52, facing: -1 };
  if (role === "pressure") return { x: 0.72, facing: -1 };
  if (role === "rift") return { x: 0.62, facing: -1 };
  return { x: 0.42, facing: 1 };
}

function resolveDialogue(npc) {
  if (npc.id === "inkdot" && npc.layerId === "deep") return npc.lineSets.deep;
  if (npc.talkCount > 0 || npc.lineSets.first.length === 0) return npc.lineSets.repeat ?? npc.lineSets.first;
  return npc.lineSets.first;
}

function drawNpc(ctx, npc, x, y, frame = 0) {
  ctx.save();
  if (npc.role === "companion") {
    drawInkCompanionAt(ctx, {
      x,
      footY: y + npc.h / 2 + 7,
      facing: npc.facing,
      frame,
      bodyColor: npc.color,
      accentColor: npc.accent,
    });
  } else {
    const footY = y + npc.h / 2 + 8;
    const spriteId = storyNpcSpriteId(npc);
    const rendered = drawModelSprite(ctx, spriteId, x, footY, {
      height: storyNpcSpriteHeight(npc),
      facing: npc.facing,
    });
    if (!rendered) {
      drawPixelPersonAt(ctx, {
        x,
        footY,
        facing: npc.facing,
        frame,
        walkSpeed: 0.08,
        bodyColor: npc.color,
        accentColor: npc.accent,
        hairColor: npc.role === "pressure" ? "#2b1018" : "#11131a",
        apron: npc.role === "shop",
        apronColor: npc.role === "shop" ? "#d8cfb8" : undefined,
        badge: npc.role === "shop" || npc.role === "pressure",
      });
    }
  }

  ctx.fillStyle = npc.accent;
  ctx.fillRect(x - 8, y - npc.h / 2 - 6, 16, 2);
  ctx.restore();
}

function storyNpcSpriteId(npc) {
  if (npc.id === "supply_keeper") return "supply_keeper";
  if (npc.id === "forgotten_draft") return "forgotten_draft";
  if (npc.id === "deleted_character") return "deleted_character";
  if (npc.id === "zhou_redline") return "zhou_redline_shadow";
  return "forgotten_draft";
}

function storyNpcSpriteHeight(npc) {
  if (npc.id === "supply_keeper") return 46;
  if (npc.id === "deleted_character") return 54;
  if (npc.id === "zhou_redline") return 66;
  return 46;
}

function drawTalkPrompt(ctx, npc, x, y, promptPulse = 0) {
  const bob = Math.sin(promptPulse / 120 * Math.PI * 2) * 2;
  ctx.save();
  ctx.fillStyle = "rgba(10,9,12,0.78)";
  ctx.fillRect(x - 32, y - npc.h / 2 - 28 + bob, 64, 18);
  ctx.strokeStyle = npc.accent;
  ctx.strokeRect(x - 32, y - npc.h / 2 - 28 + bob, 64, 18);
  ctx.fillStyle = "#f7f0df";
  ctx.font = "11px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText("E 对话", x - 19, y - npc.h / 2 - 15 + bob);
  ctx.restore();
}

function drawDialoguePanel(ctx, npc, text) {
  const x = 72;
  const y = H - 154;
  const w = W - 144;
  const h = 116;
  ctx.save();
  ctx.fillStyle = "rgba(7,6,9,0.88)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = npc.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = npc.accent;
  ctx.font = "bold 16px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(npc.name, x + 20, y + 28);
  ctx.fillStyle = "#f7f0df";
  ctx.font = "16px Segoe UI, Microsoft YaHei, sans-serif";
  drawWrappedText(ctx, text, x + 20, y + 58, w - 40, 22);
  ctx.fillStyle = "rgba(247,240,223,0.62)";
  ctx.font = "12px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText("Enter / E 继续    Esc 关闭", x + w - 190, y + h - 16);
  ctx.restore();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = "";
  let drawY = y;
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, drawY);
      line = char;
      drawY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, drawY);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
