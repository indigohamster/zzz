# -*- coding: utf-8 -*-
part2 = """// ---- Item drawing helpers ----
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
  ctx.strokeStyle = "#c5b99a";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 20 + i * 12);
    ctx.quadraticCurveTo(x + 35, y + 10 + i * 10, x + 65, y + 18 + i * 12);
    ctx.stroke();
  }
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

// ---- Player drawing ----
function drawPlayerSprite(ctx, px, py, facing, animFrame, isWalking) {
  const walkBob = isWalking ? Math.sin(animFrame * 0.15) * 2 : 0;
  const y = py + walkBob;
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(px, FLOOR_Y, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const stride = isWalking ? Math.sin(animFrame * 0.15) * 3 : 0;
  ctx.fillStyle = "#181818";
  ctx.fillRect(px - 2, y + 18 + stride, 5, 14);
  ctx.fillRect(px - 2, y + 18 - stride, 5, 14);
  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(px - 3, y + 30 + stride, 7, 4);
  ctx.fillRect(px - 3, y + 30 - stride, 7, 4);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(px - 6, y + 2, 12, 18);
  ctx.fillStyle = "#222";
  ctx.fillRect(px - 6, y + 2, 12, 4);
  ctx.fillStyle = "#2a2a2a";
  const armSwing = isWalking ? Math.sin(animFrame * 0.15) * 2 : 0;
  ctx.fillRect(px + 4, y + 4 + armSwing, 4, 14);
  ctx.fillRect(px - 8, y + 4 - armSwing, 4, 14);
  ctx.fillStyle = "#e8b89d";
  ctx.beginPath();
  ctx.arc(px, y - 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#101010";
  ctx.beginPath();
  ctx.arc(px, y - 5, 8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#101010";
  ctx.fillRect(px + 3, y - 4, 2, 2);
}

// ---- Room background ----
function drawRoom(ctx, frame) {
  ctx.fillStyle = "#3a3630";
  ctx.fillRect(0, 0, W, FLOOR_Y);
  ctx.strokeStyle = "#4a4540";
  ctx.lineWidth = 1;
  for (let wy = 0; wy < FLOOR_Y; wy += 60) {
    ctx.beginPath();
    ctx.moveTo(0, wy);
    ctx.lineTo(W, wy);
    ctx.stroke();
  }
  drawWindow(ctx, 60, 50, 140, 160, frame);
  ctx.fillStyle = "#4d4030";
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  ctx.strokeStyle = "#5a4d3e";
  ctx.lineWidth = 1;
  for (let fx = 0; fx < W; fx += 80) {
    ctx.beginPath();
    ctx.moveTo(fx, FLOOR_Y);
    ctx.lineTo(fx, H);
    ctx.stroke();
  }
  drawLamp(ctx, 780, 310, frame);
  ctx.fillStyle = "#f5f0e5";
  ctx.fillRect(720, 80, 60, 70);
  ctx.strokeStyle = "#2a2824";
  ctx.lineWidth = 1;
  ctx.strokeRect(720, 80, 60, 70);
  ctx.fillStyle = "#c5b99a";
  for (let cr = 0; cr < 5; cr++) {
    for (let cc = 0; cc < 7; cc++) {
      ctx.fillRect(726 + cc * 8, 102 + cr * 10, 5, 4);
    }
  }
}

function drawWindow(ctx, x, y, w, h, frame) {
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#0a0a18";
  ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
  const moonX = x + w - 30, moonY = y + 30;
  ctx.fillStyle = "#e8e0c8";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a18";
  ctx.beginPath();
  ctx.arc(moonX + 5, moonY - 3, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c8d8e8";
  for (let i = 0; i < 8; i++) {
    const sx = x + 15 + ((i * 17 + frame * 0.3) % (w - 30));
    const sy = y + 15 + (i * 13 % (h - 30));
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  ctx.fillRect(x, y + h / 2 - 2, w, 4);
}

function drawLamp(ctx, x, y, frame) {
  ctx.fillStyle = "#3d2d20";
  ctx.fillRect(x - 15, y + 60, 60, 8);
  ctx.fillRect(x + 10, y + 68, 8, 60);
  ctx.fillRect(x + 35, y + 68, 8, 60);
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(x + 10, y + 40, 34, 20);
  ctx.fillStyle = "#f0d9a5";
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 40);
  ctx.lineTo(x + 49, y + 40);
  ctx.lineTo(x + 38, y + 10);
  ctx.lineTo(x + 16, y + 10);
  ctx.fill();
  const flicker = 0.06 + 0.02 * Math.sin(frame * 0.08);
  const glowGrad = ctx.createRadialGradient(x + 27, y + 35, 4, x + 27, y + 10, 90);
  glowGrad.addColorStop(0, "rgba(255, 220, 150, " + flicker.toFixed(2) + ")");
  glowGrad.addColorStop(1, "rgba(255, 220, 150, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x + 27, y + 10, 90, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Ink spread effect ----
function drawInkSpread(ctx, progress, originX, originY) {
  ctx.fillStyle = "rgba(5, 5, 15, " + (progress * 0.7).toFixed(2) + ")";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#0a0a20";
  ctx.lineWidth = 2 + progress * 4;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const length = 30 + progress * 400;
    const tx = originX + Math.cos(angle) * length;
    const ty = originY + Math.sin(angle) * length;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    const cpDist = length * 0.4;
    ctx.quadraticCurveTo(
      originX + Math.cos(angle + 0.5) * cpDist,
      originY + Math.sin(angle + 0.5) * cpDist,
      tx, ty
    );
    ctx.stroke();
  }
  const pr = 10 + progress * 150;
  const pg = ctx.createRadialGradient(originX, originY, pr * 0.1, originX, originY, pr);
  pg.addColorStop(0, "rgba(40, 60, 140, 0.9)");
  pg.addColorStop(0.5, "rgba(20, 40, 100, 0.4)");
  pg.addColorStop(1, "rgba(10, 20, 60, 0)");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(originX, originY, pr, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Inkdot drawing ----
function drawInkdot(ctx, x, y, frame, alpha) {
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  const bounce = Math.sin(frame * 0.06) * 2;
  const glowGrad = ctx.createRadialGradient(x, y + bounce, 2, x, y + bounce, 25);
  glowGrad.addColorStop(0, "rgba(80, 120, 255, 0.5)");
  glowGrad.addColorStop(1, "rgba(20, 40, 100, 0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y + bounce, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(x, y + bounce, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 6 + bounce);
  ctx.lineTo(x - 14, y - 18 + bounce);
  ctx.lineTo(x - 2, y - 8 + bounce);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 6 + bounce);
  ctx.lineTo(x + 14, y - 18 + bounce);
  ctx.lineTo(x + 2, y - 8 + bounce);
  ctx.fill();
  ctx.fillStyle = "#80b0ff";
  ctx.beginPath();
  ctx.arc(x - 3, y - 1 + bounce, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 3, y - 1 + bounce, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---- Dialogue box ----
function drawDialogueBox(ctx, speaker, text) {
  const boxH = 68, boxY = H - boxH;
  ctx.fillStyle = "rgba(8, 7, 10, 0.88)";
  ctx.fillRect(0, boxY, W, boxH);
  ctx.strokeStyle = "#3a3630";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, boxY);
  ctx.lineTo(W, boxY);
  ctx.stroke();
  if (speaker) {
    ctx.fillStyle = "#f0d9a5";
    ctx.font = '15px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(speaker, 40, boxY + 24);
  }
  ctx.fillStyle = "#e8e0d0";
  ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText(text, 40, speaker ? boxY + 44 : boxY + 28);
  const alpha = 0.4 + 0.3 * Math.sin(Date.now() * 0.004);
  ctx.fillStyle = "rgba(200, 190, 170, " + alpha.toFixed(2) + ")";
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText("\u6309 Enter \u6216\u7a7a\u683c\u7ee7\u7eed", W - 170, boxY + 56);
}
"""

with open(r"D:\InkwellDeep\StandalonePrototype\src\scenes\Chapter0.js", "a", encoding="utf-8") as f:
    f.write(part2)
print("Part 2 appended:", len(part2), "bytes")
