// Chapter 0: Prologue — 序章
// Walkable rental room → old sketchbook → Inkdot emerges → ink spread → enter ink realm.
import { H, W } from "../core/config.js?v=27";
import { label } from "../core/render.js";
import { drawBottomPrompt, drawInteractionHint, pixelLabel } from "./StudioRoom.js?v=25";
import { drawProtagonistAt } from "../characters/protagonist/ProtagonistSprite.js?v=47";

// ---- Constants ----
const PHASE = {
  EXPLORE: 0,
  SKETCHBOOK: 1,
  INKDOT: 2,
  INK_SPREAD: 3,
  INK_ENTRY: 4,
  FADE_OUT: 5,
};

const PLAYER_SPEED = 2.8;
const PLAYER_W = 16;
const PLAYER_H = 32;
const FLOOR_Y = 440;
const INTERACT_RANGE = 100;

// ---- Dialogue lines ----
const LINES = {
  desk: [
    { speaker: "", text: "电脑屏幕上还亮着。客户要求再改一版。" },
    { speaker: "", text: "已经是第五次修改了。" },
  ],
  tablet: [
    { speaker: "", text: "数位板的笔尖磨损得厉害。" },
    { speaker: "", text: "今晚还没有动过它。" },
  ],
  manuscripts: [
    { speaker: "", text: "散落的稿件铺了半张桌子。" },
    { speaker: "", text: "有些线条反复擦改，纸面都起了毛。" },
  ],
  sketchbook_first: [
    { speaker: "", text: "书架上有一本很旧的画册。" },
    { speaker: "", text: "封面已经褪色，边角磨圆了。" },
  ],
  sketchbook_open: [
    { speaker: "", text: "翻开画册，里面是你小时候画的画。" },
    { speaker: "", text: "一只小猫。线条笨拙，但眼睛很亮。" },
    { speaker: "", text: "……你几乎忘了它还在这里。" },
  ],
  inkdot_emerge: [
    { speaker: "墨点", text: "好久不见。" },
    { speaker: "墨点", text: "……" },
    { speaker: "墨点", text: "你还好吗？" },
  ],
  ink_entry: [
    { speaker: "墨点", text: "这里还是老样子。" },
    { speaker: "墨点", text: "……" },
    { speaker: "墨点", text: "又好像变了很多。" },
  ],
};

// ---- Interactable items in the room ----
function createItems() {
  return [
    {
      id: "desk",
      x: 180, y: 290, w: 160, h: 150,
      label: "电脑桌",
      inspected: false,
      draw: drawDesk,
    },
    {
      id: "tablet",
      x: 620, y: 350, w: 70, h: 90,
      label: "数位板",
      inspected: false,
      draw: drawTablet,
    },
    {
      id: "manuscripts",
      x: 350, y: 380, w: 100, h: 60,
      label: "散落的稿件",
      inspected: false,
      draw: drawManuscripts,
    },
    {
      id: "sketchbook",
      x: 500, y: 240, w: 50, h: 200,
      label: "旧画册",
      inspected: false,
      draw: drawSketchbook,
    },
  ];
}
// ---- Item drawing helpers ----
function drawDesk(ctx, item) {
  const { x, y, w, h } = item;
  ctx.fillStyle = "#4a3728";
  ctx.fillRect(x, y + 80, w, 14);
  ctx.fillStyle = "#3d2d20";
  ctx.fillRect(x + 10, y + 94, 10, h - 94);
  ctx.fillRect(x + w - 20, y + 94, 10, h - 94);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 30, y + 20, 90, 60);
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(x + 35, y + 25, 80, 46);
  ctx.fillStyle = "rgba(80, 120, 200, 0.08)";
  ctx.fillRect(x + 35, y + 25, 80, 46);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(x + 65, y + 80, 20, 10);
}

function drawTablet(ctx, item) {
  const { x, y, w, h } = item;
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(x, y + 20, w, 50);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 8, y + 28, w - 16, 34);
  ctx.fillStyle = "#444";
  ctx.fillRect(x + 5, y + 10, 4, 20);
  ctx.fillStyle = "#222";
  ctx.fillRect(x + 6, y + 8, 2, 3);
  ctx.fillStyle = "#4a3728";
  ctx.fillRect(x - 10, y + 70, w + 60, 12);
  ctx.fillStyle = "#3d2d20";
  ctx.fillRect(x - 10, y + 82, 8, h - 82);
  ctx.fillRect(x + w + 42, y + 82, 8, h - 82);
}

function drawManuscripts(ctx, item) {
  const { x, y, w, h } = item;
  ctx.fillStyle = "#f5f0e5";
  ctx.fillRect(x, y + 10, 70, 45);
  ctx.fillRect(x + 15, y + 5, 65, 40);
  ctx.fillRect(x + 30, y, 60, 50);
  ctx.fillStyle = "#c5b99a";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + 8, y + 18 + i * 8, 42, 2);
    ctx.fillRect(x + 54, y + 16 + i * 8, 10, 2);
  }
  ctx.fillStyle = "#b23b48";
  ctx.fillRect(x + 32, y + 6, 26, 3);
}

function drawSketchbook(ctx, item) {
  const { x, y, w, h } = item;
  ctx.fillStyle = "#3d3226";
  ctx.fillRect(x - 20, y - 10, w + 40, h + 20);
  ctx.fillStyle = "#5a4a3a";
  for (let sy = y + 40; sy < y + h; sy += 50) {
    ctx.fillRect(x - 20, sy, w + 40, 3);
  }
  const books = [
    { bx: x - 10, by: y + 5, bw: 14, bh: 35, c: "#6b4c3b" },
    { bx: x + 8, by: y + 8, bw: 12, bh: 32, c: "#5a6b4c" },
    { bx: x + 25, by: y + 3, bw: 15, bh: 37, c: "#4c5b6b" },
  ];
  for (const b of books) {
    ctx.fillStyle = b.c;
    ctx.fillRect(b.bx, b.by, b.bw, b.bh);
    ctx.strokeStyle = "#2a2018";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.bx, b.by, b.bw, b.bh);
  }
  const sx = x - 5, sy = y + 60, sw = 30, sh = 40;
  ctx.fillStyle = "#c4a882";
  ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeStyle = "#8b7355";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, sy, sw, sh);
  ctx.fillStyle = "#b8956e";
  ctx.fillRect(sx, sy, sw, 3);
  ctx.fillStyle = "#8b7355";
  ctx.fillRect(sx - 3, sy + 5, 3, sh - 10);
}

// ---- Room background ----
function drawRoom(ctx, frame) {
  ctx.fillStyle = "#303740";
  ctx.fillRect(0, 0, W, 88);
  ctx.fillStyle = "#20262f";
  ctx.fillRect(0, 88, W, 172);
  ctx.fillStyle = "#141922";
  ctx.fillRect(0, 260, W, FLOOR_Y - 260);
  ctx.fillStyle = "rgba(240,217,165,0.06)";
  for (let i = 0; i < 96; i++) {
    const sx = (i * 59 + frame) % W;
    const sy = 22 + ((i * 31) % 310);
    ctx.fillRect(sx, sy, i % 5 === 0 ? 5 : 2, 2);
  }
  drawWindow(ctx, 60, 50, 140, 160, frame);
  ctx.fillStyle = "#17130f";
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  ctx.fillStyle = "#33281c";
  for (let fy = FLOOR_Y + 8; fy < H; fy += 18) ctx.fillRect(0, fy, W, 2);
  for (let fx = 0; fx < W; fx += 80) ctx.fillRect(fx, FLOOR_Y, 2, H - FLOOR_Y);
  drawLamp(ctx, 780, 310, frame);
  ctx.fillStyle = "#05070b";
  ctx.fillRect(714, 74, 74, 84);
  ctx.fillStyle = "#d8cfb8";
  ctx.fillRect(720, 80, 60, 70);
  ctx.fillStyle = "#b9a98a";
  for (let cr = 0; cr < 5; cr++) {
    for (let cc = 0; cc < 7; cc++) {
      ctx.fillRect(726 + cc * 8, 102 + cr * 10, 5, 4);
    }
  }
  pixelLabel(ctx, "RENT DUE", 724, 96, 10, "#5c554c");
}

function drawWindow(ctx, x, y, w, h, frame) {
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = "#0b1320";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#d8cfb8";
  ctx.fillRect(x + w - 44, y + 24, 24, 24);
  ctx.fillStyle = "#0b1320";
  ctx.fillRect(x + w - 34, y + 18, 22, 28);
  ctx.fillStyle = "#7dd3fc";
  for (let i = 0; i < 8; i++) {
    const sx = x + 15 + ((i * 17 + Math.floor(frame * 0.3)) % (w - 30));
    const sy = y + 15 + (i * 13 % (h - 30));
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.fillStyle = "#263b55";
  for (let i = 0; i < 4; i++) {
    const bx = x + 18 + i * 28;
    const bh = 20 + ((i * 17) % 48);
    ctx.fillRect(bx, y + h - 12 - bh, 18, bh);
  }
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  ctx.fillRect(x, y + h / 2 - 2, w, 4);
}

function drawLamp(ctx, x, y, frame) {
  ctx.save();
  ctx.globalAlpha = 0.1 + 0.03 * Math.sin(frame * 0.08);
  ctx.fillStyle = "#f0d9a5";
  for (let i = 0; i < 6; i++) ctx.fillRect(x - 110 + i * 22, y - 22 + i * 18, 250 - i * 34, 16);
  ctx.restore();

  ctx.fillStyle = "#05070b";
  ctx.fillRect(x - 18, y + 60, 66, 10);
  ctx.fillRect(x + 10, y + 68, 8, 60);
  ctx.fillRect(x + 36, y + 68, 8, 60);
  ctx.fillStyle = "#2e2118";
  ctx.fillRect(x + 8, y + 40, 38, 20);
  ctx.fillStyle = "#f0d9a5";
  ctx.fillRect(x + 8, y + 34, 38, 8);
  ctx.fillRect(x + 16, y + 20, 22, 14);
  ctx.fillStyle = "#f7f0df";
  if ((frame % 90) < 84) ctx.fillRect(x + 18, y + 42, 18, 3);
}

// ---- Ink spread effect ----
function drawInkSpread(ctx, progress, originX, originY) {
  ctx.fillStyle = "rgba(5, 7, 11, " + (progress * 0.72).toFixed(2) + ")";
  ctx.fillRect(0, 0, W, H);
  const spread = 18 + progress * 420;
  ctx.fillStyle = "#05070b";
  for (let i = 0; i < 96; i++) {
    const angle = (i / 96) * Math.PI * 2;
    const wobble = 0.72 + ((i * 29) % 31) / 70;
    const dist = spread * wobble;
    const tx = Math.floor((originX + Math.cos(angle) * dist) / 4) * 4;
    const ty = Math.floor((originY + Math.sin(angle) * dist * 0.68) / 4) * 4;
    const steps = 4 + Math.floor(progress * 12);
    for (let s = 0; s < steps; s++) {
      const px = Math.floor((originX + (tx - originX) * (s / steps)) / 4) * 4;
      const py = Math.floor((originY + (ty - originY) * (s / steps)) / 4) * 4;
      ctx.fillRect(px, py, i % 3 === 0 ? 8 : 4, i % 4 === 0 ? 8 : 4);
    }
  }
  ctx.fillStyle = "rgba(125,211,252," + (0.26 + progress * 0.28).toFixed(2) + ")";
  for (let r = 0; r < 5; r++) {
    const w = 24 + progress * 120 + r * 14;
    const h = 12 + progress * 66 + r * 8;
    ctx.fillRect(originX - w / 2, originY - h / 2, w, 4);
    ctx.fillRect(originX - w / 2, originY + h / 2, w, 4);
    ctx.fillRect(originX - w / 2, originY - h / 2, 4, h);
    ctx.fillRect(originX + w / 2, originY - h / 2, 4, h);
  }
}

// ---- Inkdot drawing ----
function drawInkdot(ctx, x, y, frame, alpha) {
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  const bounce = Math.floor(Math.sin(frame * 0.06) * 2);
  ctx.globalAlpha = (alpha ?? 1) * 0.32;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(x - 24, y - 16 + bounce, 48, 32);
  ctx.fillRect(x - 14, y - 26 + bounce, 28, 52);
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = "#05070b";
  ctx.fillRect(x - 14, y - 12 + bounce, 28, 24);
  ctx.fillRect(x - 20, y - 4 + bounce, 40, 18);
  ctx.fillRect(x - 16, y - 20 + bounce, 7, 12);
  ctx.fillRect(x + 9, y - 20 + bounce, 7, 12);
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(x - 6, y - 2 + bounce, 4, 4);
  ctx.fillRect(x + 3, y - 2 + bounce, 4, 4);
  ctx.restore();
}

// ---- Dialogue box ----
function drawDialogueBox(ctx, speaker, text) {
  const boxH = 82;
  const boxY = H - boxH;
  ctx.fillStyle = "#05070b";
  ctx.fillRect(0, boxY, W, boxH);
  ctx.fillStyle = "#111823";
  ctx.fillRect(0, boxY + 4, W, 4);
  ctx.fillStyle = "#f0d9a5";
  ctx.fillRect(36, boxY + 18, 16, 16);
  ctx.fillStyle = "#05070b";
  ctx.fillRect(42, boxY + 24, 5, 5);
  if (speaker) {
    pixelLabel(ctx, speaker, 68, boxY + 28, 14, "#f0d9a5");
  }
  const lineA = String(text ?? "").slice(0, 34);
  const lineB = String(text ?? "").slice(34, 68);
  pixelLabel(ctx, lineA, 68, speaker ? boxY + 52 : boxY + 36, 15, "#f7f0df");
  if (lineB) pixelLabel(ctx, lineB, 68, speaker ? boxY + 72 : boxY + 58, 15, "#f7f0df");
  const pulse = 0.45 + 0.25 * Math.sin(Date.now() * 0.004);
  ctx.fillStyle = "rgba(240,217,165," + pulse.toFixed(2) + ")";
  ctx.fillRect(W - 148, boxY + 54, 112, 4);
  pixelLabel(ctx, "Enter / Space", W - 158, boxY + 72, 12, "#a99d8c");
}

// ---- Main factory ----
export function createChapter0Scene({ canvas, ctx, keys, mouse, gameState, onDone }) {
  let phase = PHASE.EXPLORE;
  let frame = 0;
  let done = false;

  const player = { x: 350, y: FLOOR_Y - PLAYER_H, w: PLAYER_W, h: PLAYER_H, facing: 1, animFrame: 0 };
  const items = createItems();

  let activeLines = [];
  let lineIndex = 0;
  let showingDialogue = false;
  let dialogueTimer = 0;
  let nearItem = null;

  let inkdotX = 0, inkdotY = 0;
  let inkSpreadProgress = 0;
  let entryDialogueDone = false;

  function start() {
    phase = PHASE.EXPLORE;
    frame = 0;
    done = false;
    player.x = 350;
    player.facing = 1;
    player.animFrame = 0;
    for (const item of items) item.inspected = false;
    activeLines = [];
    lineIndex = 0;
    showingDialogue = false;
    dialogueTimer = 0;
    nearItem = null;
    inkdotX = 0;
    inkdotY = 0;
    inkSpreadProgress = 0;
    entryDialogueDone = false;
    if (gameState) {
      gameState.storyFlags["chapter0_started"] = true;
    }
  }

  function beginDialogue(lines) {
    activeLines = lines;
    lineIndex = 0;
    showingDialogue = true;
    dialogueTimer = 0;
  }

  function advanceDialogue() {
    lineIndex++;
    if (lineIndex >= activeLines.length) {
      activeLines = [];
      lineIndex = 0;
      showingDialogue = false;
      return true;
    }
    return false;
  }

  function getNearbyItem() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    let closest = null;
    let closestDist = INTERACT_RANGE;
    for (const item of items) {
      const ix = item.x + item.w / 2;
      const iy = item.y + item.h / 2;
      const dist = Math.hypot(cx - ix, cy - iy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = item;
      }
    }
    return closest;
  }

  function update() {
    if (done) return;
    frame++;

    if (showingDialogue) {
      dialogueTimer++;
      return;
    }

    if (phase === PHASE.FADE_OUT) {
      if (frame % 2 === 0) inkSpreadProgress = Math.min(1, inkSpreadProgress + 0.02);
      if (inkSpreadProgress >= 1) {
        done = true;
        if (onDone) onDone();
      }
      return;
    }

    if (phase === PHASE.INK_SPREAD) {
      inkSpreadProgress = Math.min(1, inkSpreadProgress + 0.005);
      if (inkSpreadProgress >= 0.95 && !entryDialogueDone) {
        beginDialogue(LINES.ink_entry);
        phase = PHASE.INK_ENTRY;
        entryDialogueDone = true;
      }
      return;
    }

    if (phase === PHASE.EXPLORE) {
      let moving = false;
      if (keys.has("arrowleft") || keys.has("a")) {
        player.x -= PLAYER_SPEED;
        player.facing = -1;
        moving = true;
      }
      if (keys.has("arrowright") || keys.has("d")) {
        player.x += PLAYER_SPEED;
        player.facing = 1;
        moving = true;
      }
      player.x = Math.max(20, Math.min(W - player.w - 20, player.x));
      if (moving) player.animFrame++;
      nearItem = getNearbyItem();
    }
  }

  function handleKey(key) {
    if (done) return;

    if (showingDialogue) {
      if (key === "enter" || key === " ") {
        const finished = advanceDialogue();
        if (finished) {
          const sketchbook = items.find(function(i) { return i.id === "sketchbook"; });
          if (phase === PHASE.EXPLORE && sketchbook && sketchbook.inspected) {
            phase = PHASE.SKETCHBOOK;
            beginDialogue(LINES.sketchbook_open);
          } else if (phase === PHASE.SKETCHBOOK) {
            phase = PHASE.INKDOT;
            inkdotX = 525;
            inkdotY = 220;
            beginDialogue(LINES.inkdot_emerge);
          } else if (phase === PHASE.INKDOT) {
            phase = PHASE.INK_SPREAD;
            inkSpreadProgress = 0;
            keys.clear();
          } else if (phase === PHASE.INK_ENTRY) {
            phase = PHASE.FADE_OUT;
            inkSpreadProgress = 0.9;
          }
        }
      }
      return;
    }

    if (phase === PHASE.EXPLORE && (key === "e" || key === "enter")) {
      if (nearItem && !nearItem.inspected) {
        nearItem.inspected = true;
        if (nearItem.id === "sketchbook") {
          beginDialogue(LINES.sketchbook_first);
        } else {
          const itemLines = LINES[nearItem.id];
          if (itemLines) beginDialogue(itemLines);
        }
      }
    }

    if (phase === PHASE.INK_SPREAD && (key === "enter" || key === " ")) {
      inkSpreadProgress = 0.94;
    }
  }

  function handleClick() {
    handleKey("enter");
  }

  function draw() {
    if (done) return;
    drawRoom(ctx, frame);
    for (const item of items) {
      item.draw(ctx, item);
    }
    if (phase <= PHASE.INK_SPREAD) {
      const isWalking = phase === PHASE.EXPLORE && (
        keys.has("arrowleft") || keys.has("a") ||
        keys.has("arrowright") || keys.has("d")
      );
      drawProtagonistAt(ctx, {
        x: player.x + player.w / 2,
        footY: player.y + player.h,
        facing: player.facing,
        frame: player.animFrame,
        walkSpeed: isWalking ? PLAYER_SPEED : 0,
        showTank: false,
      });
    }
    if (phase === PHASE.EXPLORE && nearItem && !nearItem.inspected && !showingDialogue) {
      drawInteractionHint(ctx, "E  " + nearItem.label, nearItem.x + nearItem.w / 2, nearItem.y - 2, true);
    }
    if (phase === PHASE.INK_SPREAD || phase === PHASE.INK_ENTRY || phase === PHASE.FADE_OUT) {
      drawInkSpread(ctx, inkSpreadProgress, inkdotX, inkdotY);
    }
    if (phase >= PHASE.INKDOT) {
      const a = phase === PHASE.FADE_OUT ? Math.max(0, 1 - (inkSpreadProgress - 0.9) * 10) : 1;
      drawInkdot(ctx, inkdotX, inkdotY, frame, a);
    }
    if (showingDialogue && activeLines.length > 0 && lineIndex < activeLines.length) {
      const line = activeLines[lineIndex];
      drawDialogueBox(ctx, line.speaker, line.text);
    } else if (phase === PHASE.EXPLORE) {
      drawBottomPrompt(ctx, "A/D move. E inspect. The old sketchbook is the first doorway.");
    }
  }

  function isDone() { return done; }

  return { start, update, draw, handleKey, handleClick, isDone };
}
