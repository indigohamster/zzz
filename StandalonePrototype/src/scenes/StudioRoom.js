import { H, W } from "../core/config.js?v=27";
import { label } from "../core/render.js";
import { drawProtagonistAt } from "../characters/protagonist/ProtagonistSprite.js?v=28";

const COLORS = {
  ink: "#05070b",
  wallTop: "#2a2f36",
  wallMid: "#1b2028",
  wallDark: "#10141b",
  floor: "#17130f",
  floorLine: "#33281c",
  wood: "#5f432b",
  woodDark: "#2e2118",
  paper: "#f3ead5",
  paperShadow: "#b9a98a",
  gold: "#f0d9a5",
  cyan: "#7dd3fc",
  red: "#b23b48",
  green: "#86c06c",
  text: "#f7f0df",
  muted: "#a99d8c",
};

export function drawStudioRoom(ctx, frame = 0, state = {}) {
  drawPixelWall(ctx);
  drawWindow(ctx, frame);
  drawShelves(ctx);
  drawMemoryBoard(ctx, frame);
  drawDoorways(ctx, state);
  drawFloor(ctx);
  drawFloorClutter(ctx, frame);
  drawDesk(ctx);
  drawDeskLight(ctx, frame, state);
  drawInkdot(ctx, frame);
  drawStudioAtmosphere(ctx, frame, state);
}

export function drawDrawingBoard(ctx, panel, complete = false) {
  const x = panel.x;
  const y = panel.y;
  const w = panel.w;
  const h = panel.h;

  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x - 18, y - 20, w + 36, h + 42);
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(x - 14, y - 16, w + 28, h + 34);
  ctx.fillStyle = complete ? "#d7c8a6" : COLORS.paperShadow;
  ctx.fillRect(x - 6, y - 8, w + 12, h + 16);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "rgba(5,7,11,0.10)";
  for (let gx = x + 8; gx < x + w; gx += 16) ctx.fillRect(gx, y, 1, h);
  for (let gy = y + 8; gy < y + h; gy += 16) ctx.fillRect(x, gy, w, 1);
  ctx.fillStyle = "rgba(46,33,24,0.16)";
  for (let i = 0; i < 28; i++) {
    const sx = x + 10 + (i * 47) % Math.max(1, w - 20);
    const sy = y + 12 + (i * 31) % Math.max(1, h - 24);
    ctx.fillRect(sx, sy, i % 4 === 0 ? 5 : 2, 1);
  }

  ctx.fillStyle = COLORS.ink;
  drawCorner(ctx, x - 10, y - 12);
  drawCorner(ctx, x + w - 6, y - 12);
  drawCorner(ctx, x - 10, y + h - 4);
  drawCorner(ctx, x + w - 6, y + h - 4);

  ctx.fillStyle = complete ? COLORS.green : COLORS.gold;
  ctx.fillRect(x - 14, y - 16, 38, 6);
  ctx.fillRect(x + w - 24, y - 16, 38, 6);
  if (complete) {
    ctx.fillStyle = "rgba(125,211,252,0.16)";
    for (let yy = y + 12; yy < y + h - 10; yy += 22) ctx.fillRect(x + 10, yy, w - 20, 2);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(x + w - 54, y + h - 30, 34, 4);
    ctx.fillRect(x + w - 38, y + h - 46, 4, 34);
  }
}

export function drawStudioSketchbook(ctx, panel, frame = 0, ready = false) {
  const x = panel.x + 22;
  const y = panel.y + 26;
  const w = panel.w - 44;
  const h = panel.h - 58;
  const pulse = 0.5 + Math.sin(frame * 0.055) * 0.5;

  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x - 22, y - 22, w + 44, h + 48);
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(x - 16, y - 16, w + 32, h + 36);
  ctx.fillStyle = "#72523a";
  ctx.fillRect(x - 10, y - 8, w + 20, h + 24);
  ctx.fillStyle = "#3b2b20";
  ctx.fillRect(x - 4, y + 6, w + 8, h + 10);

  ctx.fillStyle = "#d8cfb8";
  ctx.fillRect(x, y, Math.floor(w / 2) - 6, h);
  ctx.fillStyle = "#f3ead5";
  ctx.fillRect(x + Math.floor(w / 2) + 6, y, Math.floor(w / 2) - 6, h);
  ctx.fillStyle = COLORS.paperShadow;
  ctx.fillRect(x + Math.floor(w / 2) - 6, y, 12, h);
  ctx.fillStyle = "rgba(5,7,11,0.16)";
  for (let yy = y + 18; yy < y + h - 18; yy += 20) {
    ctx.fillRect(x + 18, yy, Math.floor(w / 2) - 40, 2);
    ctx.fillRect(x + Math.floor(w / 2) + 28, yy + 4, Math.floor(w / 2) - 48, 2);
  }

  const cx = x + Math.floor(w * 0.68);
  const cy = y + Math.floor(h * 0.5);
  ctx.fillStyle = "rgba(125,211,252," + (ready ? 0.24 + pulse * 0.18 : 0.12) + ")";
  ctx.fillRect(cx - 54, cy - 30, 108, 60);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(cx - 48, cy - 24, 96, 48);
  ctx.fillStyle = "#101a25";
  ctx.fillRect(cx - 42, cy - 18, 84, 36);
  ctx.fillStyle = ready ? COLORS.cyan : COLORS.gold;
  ctx.fillRect(cx - 30, cy - 2, 60, 4);
  ctx.fillRect(cx - 2, cy - 20, 4, 40);

  ctx.fillStyle = ready ? COLORS.cyan : COLORS.muted;
  for (let i = 0; i < 10; i++) {
    const px = cx + Math.round(Math.cos(frame * 0.03 + i) * (42 + (i % 3) * 8));
    const py = cy + Math.round(Math.sin(frame * 0.04 + i * 1.7) * (24 + (i % 2) * 5));
    ctx.fillRect(px, py, i % 2 === 0 ? 4 : 2, i % 2 === 0 ? 2 : 4);
  }

  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x + 20, y + h - 42, 110, 22);
  pixelLabel(ctx, ready ? "E  DRAW" : "NIGHT DRAFT", x + 30, y + h - 26, 12, ready ? COLORS.gold : COLORS.text);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(x + w - 42, y + 14, 22, 6);
  ctx.fillRect(x + w - 36, y + 8, 6, 20);
}

export function drawReadoutPanel(ctx, x, y, w, h, title) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#111823";
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = "rgba(125,211,252,0.08)";
  for (let lineY = y + 12; lineY < y + h - 8; lineY += 12) ctx.fillRect(x + 8, lineY, w - 16, 1);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x, y, 4, h);
  pixelLabel(ctx, title, x + 14, y + 24, 14, COLORS.gold);
}

export function drawPixelButton(ctx, rect, text, state = "default") {
  const disabled = state === "disabled";
  const active = state === "active";
  const danger = state === "danger";
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = disabled ? "#5f5a52" : danger ? COLORS.red : active ? COLORS.gold : "#141a22";
  ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(rect.x + 5, rect.y + 5, rect.w - 10, 2);
  pixelLabel(ctx, text, rect.x + 10, rect.y + Math.floor(rect.h * 0.67), 13, disabled || active ? COLORS.ink : COLORS.text);
}

export function drawBottomPrompt(ctx, text) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, H - 72, W, 72);
  ctx.fillStyle = "#151a22";
  ctx.fillRect(0, H - 68, W, 4);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(66, H - 52, 18, 18);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(72, H - 46, 6, 6);
  pixelLabel(ctx, text, 96, H - 38, 15, COLORS.text);
}

export function drawStudioActor(ctx, actor, drawing = false) {
  const x = Math.floor(actor.x);
  drawProtagonistAt(ctx, {
    x,
    footY: Math.floor(actor.y + 36),
    facing: actor.facing,
    frame: actor.walkFrame ?? 0,
    walkSpeed: Math.abs(actor.vx ?? 0),
    drawing,
    showTank: false,
  });
}

export function drawInteractionHint(ctx, text, x, y, active = true) {
  const width = Math.max(118, text.length * 8 + 20);
  ctx.fillStyle = "rgba(5,7,11,0.76)";
  ctx.fillRect(x - width / 2, y - 26, width, 30);
  ctx.strokeStyle = active ? COLORS.gold : COLORS.muted;
  ctx.strokeRect(x - width / 2 + 0.5, y - 25.5, width - 1, 29);
  pixelLabel(ctx, text, x - width / 2 + 10, y - 6, 12, active ? COLORS.gold : COLORS.muted);
}

export function pixelLabel(ctx, text, x, y, size = 14, color = COLORS.text) {
  label(ctx, text, x + 2, y + 2, size, COLORS.ink);
  label(ctx, text, x, y, size, color);
}

function drawPixelWall(ctx) {
  const bands = [
    ["#303740", 0, 84],
    [COLORS.wallTop, 84, 126],
    [COLORS.wallMid, 126, 266],
    [COLORS.wallDark, 266, H],
  ];
  for (const [color, y, h] of bands) {
    ctx.fillStyle = color;
    ctx.fillRect(0, y, W, h);
  }
  ctx.fillStyle = "rgba(240,217,165,0.06)";
  for (let i = 0; i < 90; i++) {
    const x = (i * 61) % W;
    const y = 18 + ((i * 37) % 282);
    ctx.fillRect(x, y, i % 4 === 0 ? 5 : 2, 2);
  }
}

function drawWindow(ctx, frame) {
  const x = 630;
  const y = 58;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x - 6, y - 6, 236, 122);
  ctx.fillStyle = "#0b1320";
  ctx.fillRect(x, y, 224, 110);
  ctx.fillStyle = "#263b55";
  for (let i = 0; i < 9; i++) {
    const bx = x + 10 + i * 23;
    const bh = 16 + ((i * 13) % 48);
    ctx.fillRect(bx, y + 94 - bh, 16, bh);
    if ((i + frame) % 3 === 0) {
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(bx + 4, y + 86 - bh, 4, 4);
      ctx.fillStyle = "#263b55";
    }
  }
  ctx.fillStyle = "rgba(125,211,252,0.18)";
  ctx.fillRect(x + 12, y + 18, 200, 2);
  ctx.fillRect(x + 70, y, 4, 110);
  ctx.fillRect(x + 148, y, 4, 110);
}

function drawShelves(ctx) {
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(44, 74, 296, 12);
  ctx.fillRect(580, 210, 270, 12);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = i % 3 === 0 ? COLORS.gold : i % 3 === 1 ? "#8b8173" : "#5d6374";
    ctx.fillRect(60 + i * 24, 42 + (i % 2) * 8, 14, 32 + (i % 3) * 6);
  }
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#b23b48" : COLORS.cyan;
    ctx.fillRect(600 + i * 28, 174 + (i % 3) * 7, 18, 36 - (i % 3) * 4);
  }
}

function drawMemoryBoard(ctx, frame) {
  const x = 380;
  const y = 54;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x - 8, y - 8, 168, 108);
  ctx.fillStyle = "#1a1512";
  ctx.fillRect(x, y, 152, 92);
  ctx.fillStyle = "#5f432b";
  ctx.fillRect(x, y, 152, 6);
  ctx.fillRect(x, y + 86, 152, 6);
  ctx.fillRect(x, y, 6, 92);
  ctx.fillRect(x + 146, y, 6, 92);

  for (let i = 0; i < 5; i++) {
    const px = x + 18 + i * 25;
    const py = y + 18 + (i % 2) * 14;
    ctx.fillStyle = i % 2 === 0 ? "#d8cfb8" : "#f0d9a5";
    ctx.fillRect(px, py, 18, 22);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(px + 4, py + 5, 10, 2);
    ctx.fillRect(px + 4, py + 11, 8, 2);
  }

  ctx.fillStyle = "#b23b48";
  ctx.fillRect(x + 28, y + 66, 78, 3);
  ctx.fillRect(x + 84, y + 44, 3, 26);
  ctx.fillStyle = (frame % 80) < 40 ? COLORS.cyan : COLORS.gold;
  ctx.fillRect(x + 118, y + 60, 12, 12);
  pixelLabel(ctx, "BRIEF", x + 18, y + 82, 10, COLORS.muted);
}

function drawDoorways(ctx, state) {
  const shopActive = state.boardReady && !state.drawingActive;
  const companyActive = !state.drawingActive;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(618, 270, 118, 112);
  ctx.fillRect(754, 260, 126, 122);
  ctx.fillStyle = "#201821";
  ctx.fillRect(626, 278, 102, 96);
  ctx.fillStyle = "#182235";
  ctx.fillRect(762, 268, 110, 106);

  ctx.fillStyle = shopActive ? COLORS.gold : "#8b8173";
  ctx.fillRect(646, 300, 62, 5);
  ctx.fillRect(646, 320, 62, 5);
  ctx.fillRect(646, 340, 62, 5);
  ctx.fillStyle = companyActive ? COLORS.cyan : "#5d6374";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(782 + i * 18, 292, 10, 18);
    ctx.fillRect(782 + i * 18, 326, 10, 18);
  }

  pixelLabel(ctx, "SHOP", 652, 366, 12, shopActive ? COLORS.gold : COLORS.muted);
  pixelLabel(ctx, "WORK", 786, 366, 12, companyActive ? COLORS.cyan : COLORS.muted);
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, H - 154, W, 154);
  ctx.fillStyle = COLORS.floorLine;
  for (let y = H - 146; y < H; y += 18) ctx.fillRect(0, y, W, 2);
  for (let x = 0; x < W; x += 72) ctx.fillRect(x, H - 154, 2, 154);
}

function drawFloorClutter(ctx, frame) {
  ctx.fillStyle = "#0c0a09";
  ctx.fillRect(172, H - 118, 86, 10);
  ctx.fillStyle = "#2e2118";
  ctx.fillRect(178, H - 128, 74, 12);
  ctx.fillStyle = COLORS.paperShadow;
  ctx.fillRect(202, H - 146, 38, 20);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(208, H - 139, 26, 2);
  ctx.fillRect(210, H - 132, 18, 2);

  ctx.fillStyle = "#111823";
  ctx.fillRect(426, H - 118, 74, 12);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(438 + (frame % 34), H - 114, 6, 2);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(454, H - 140, 18, 24);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(472, H - 130, 8, 14);
}

function drawDesk(ctx) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(48, 396, 560, 28);
  ctx.fillStyle = COLORS.wood;
  ctx.fillRect(56, 388, 544, 28);
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(82, 416, 24, 92);
  ctx.fillRect(526, 416, 24, 92);
  ctx.fillRect(642, 356, 248, 22);
  ctx.fillStyle = COLORS.wood;
  ctx.fillRect(650, 348, 232, 22);
}

function drawDeskLight(ctx, frame, state) {
  const x = 512;
  const y = 320;
  const glow = state.drawingActive || state.drawingComplete ? 0.2 : 0.12;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = COLORS.gold;
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(148 + i * 24, 104 + i * 18, 370 - i * 34, 18);
  }
  ctx.restore();

  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x, y + 54, 94, 10);
  ctx.fillRect(x + 42, y + 24, 10, 34);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x + 20, y + 12, 54, 18);
  ctx.fillStyle = "#f7f0df";
  if ((frame % 90) < 84) ctx.fillRect(x + 30, y + 28, 34, 4);
}

function drawInkdot(ctx, frame) {
  const x = 804;
  const y = 386 + Math.sin(frame * 0.05) * 2;
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x - 18, y - 20, 36, 28);
  ctx.fillRect(x - 24, y - 10, 48, 18);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x - 8, y - 8, 4, 4);
  ctx.fillRect(x + 6, y - 8, 4, 4);
  ctx.fillStyle = "#151a22";
  ctx.fillRect(x - 30, y + 8, 60, 8);
}

function drawStudioAtmosphere(ctx, frame, state) {
  ctx.save();
  ctx.globalAlpha = state.drawingActive ? 0.24 : 0.14;
  ctx.fillStyle = state.drawingComplete ? COLORS.cyan : COLORS.gold;
  for (let i = 0; i < 52; i++) {
    const x = (i * 83 + frame * (i % 3 + 1)) % W;
    const y = 96 + ((i * 47 + Math.floor(frame * 0.3)) % 300);
    ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, 1);
  }
  ctx.restore();
}

function drawCorner(ctx, x, y) {
  ctx.fillRect(x, y, 14, 4);
  ctx.fillRect(x, y, 4, 14);
}
