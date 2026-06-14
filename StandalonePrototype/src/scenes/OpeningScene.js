import { H, W } from "../core/config.js";
import { drawPaperBackground, label } from "../core/render.js";

// Opening scene phases
const PHASE = {
  COMMUTE: 0,       // 下班路上
  ARRIVE: 1,        // 到家门口
  STUDIO: 2,        // 进入工作室
  INKDOT: 3,        // 墨点出现
  PORTAL: 4,        // 墨境入口开启
  DONE: 5,          // 过渡完成
};

// Phase timings in frames (60fps)
const PHASE_DURATION = {
  [PHASE.COMMUTE]: 180,   // 3 seconds
  [PHASE.ARRIVE]: 120,    // 2 seconds
  [PHASE.STUDIO]: 150,    // 2.5 seconds
  [PHASE.INKDOT]: 200,    // ~3.3 seconds
  [PHASE.PORTAL]: 240,    // 4 seconds
};

// Narrative text per phase
const NARRATIVE = {
  [PHASE.COMMUTE]: {
    title: "下班路上",
    lines: [
      "地铁穿过城市的腹地。",
      "车窗上映着一张疲倦但未放弃的脸。",
      "你是一个创作者——给别人画分镜、画角色、画那些不属于自己的故事。",
      "但你的手还记得，有些线条只属于你自己。",
    ],
  },
  [PHASE.ARRIVE]: {
    title: "到家",
    lines: [
      "老楼房的走廊灯光忽明忽暗。",
      "钥匙转动的声音在深夜里格外清晰。",
      "你推开门，工作室的灯自动亮了起来。",
      "桌上摊着昨晚未完成的草稿。",
    ],
  },
  [PHASE.STUDIO]: {
    title: "工作室",
    lines: [
      "这是你真正的领地。",
      "墙上钉满了草图和废稿——每一张都是深夜的产物。",
      "白天你在 Zhou 的工作室画商稿，只有夜晚属于自己。",
      "桌角的小墨点安静地蜷在那里，好像在等你。",
    ],
  },
  [PHASE.INKDOT]: {
    title: "墨点",
    lines: [
      "它叫 Inkdot，你也不知道它是什么时候出现的。",
      "最初只是草稿纸上的一个意外墨渍，后来它开始动了。",
      "它陪着你度过了无数个深夜，看着你画出又撕掉一张张稿纸。",
      "今夜，它的身体开始发光——一种你从未见过的深蓝色。",
    ],
  },
  [PHASE.PORTAL]: {
    title: "墨境",
    lines: [
      "草稿纸上的墨迹开始流动，像活过来一样向中心汇聚。",
      "一个幽深的入口在纸面上展开——墨境的门开了。",
      "Inkdot 跳了进去，回头看着你，好像在催促。",
      "你深吸一口气，拿起笔。这是你的夜晚，你的武器，你的故事。",
    ],
  },
};

export function createOpeningScene({ canvas, ctx, keys, mouse, onDone }) {
  let phase = PHASE.COMMUTE;
  let phaseFrame = 0;
  let done = false;
  let textReveal = 0; // characters revealed per line

  function start() {
    phase = PHASE.COMMUTE;
    phaseFrame = 0;
    done = false;
    textReveal = 0;
  }

  function advancePhase() {
    if (phase >= PHASE.PORTAL) {
      done = true;
      if (onDone) onDone();
      return;
    }
    phase++;
    phaseFrame = 0;
    textReveal = 0;
  }

  function update() {
    if (done) return;
    phaseFrame++;

    // Reveal text gradually
    const narrative = NARRATIVE[phase];
    if (narrative) {
      const totalChars = narrative.lines.reduce((sum, l) => sum + l.length, 0);
      if (textReveal < totalChars) {
        textReveal += 2.5; // chars per frame reveal rate
      }
    }

    // Auto-advance after phase duration, or on Enter/click
    const duration = PHASE_DURATION[phase] ?? 300;
    if (phaseFrame >= duration) {
      advancePhase();
    }
  }

  function handleKey(key) {
    if (done) return;
    if (key === "enter" || key === " ") {
      advancePhase();
    }
  }

  function handleClick() {
    if (done) return;
    advancePhase();
  }

  function draw() {
    if (done) return;
    drawPaperBackground(ctx);

    const narrative = NARRATIVE[phase];
    if (!narrative) return;

    const progress = Math.min(1, phaseFrame / (PHASE_DURATION[phase] ?? 300));

    // Draw phase-specific background elements
    switch (phase) {
      case PHASE.COMMUTE:
        drawCommuteBackground(progress);
        break;
      case PHASE.ARRIVE:
        drawArriveBackground(progress);
        break;
      case PHASE.STUDIO:
        drawStudioBackground(progress);
        break;
      case PHASE.INKDOT:
        drawInkdotBackground(progress);
        break;
      case PHASE.PORTAL:
        drawPortalBackground(progress);
        break;
    }

    // Draw narrative text
    drawNarrative(narrative);

    // Draw bottom hint
    const alpha = 0.4 + 0.3 * Math.sin(phaseFrame * 0.05);
    ctx.fillStyle = `rgba(36, 33, 31, ${alpha.toFixed(2)})`;
    ctx.font = "14px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText("按 Enter 或点击继续", W - 180, H - 24);
  }

  function drawCommuteBackground(progress) {
    // Dark city silhouette at night
    const bgColor = lerpColor("#1a1a2e", "#16213e", progress);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Streetlights
    for (let i = 0; i < 5; i++) {
      const lx = 80 + i * 180;
      const ly = 100;
      const glow = 0.3 + 0.2 * Math.sin(phaseFrame * 0.03 + i);
      drawStreetlight(lx, ly, glow);
    }

    // Buildings silhouette
    drawCitySilhouette(progress);

    // Moving ground (scrolling effect)
    const scroll = phaseFrame * 0.8;
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = "#1a1a2a";
    for (let x = -(scroll % 40); x < W + 40; x += 40) {
      ctx.fillRect(x, H - 56, 20, 3);
    }

    // Tiny walking figure silhouette
    const walkX = W * (0.2 + progress * 0.3);
    const walkY = H - 74;
    drawWalkingFigure(walkX, walkY, phaseFrame);
  }

  function drawArriveBackground(progress) {
    // Dark hallway, door at the end
    ctx.fillStyle = "#1c1c22";
    ctx.fillRect(0, 0, W, H);

    // Hallway perspective
    const doorX = W / 2;
    const doorY = H / 2;
    const doorW = 80 + progress * 60;
    const doorH = 180 + progress * 40;

    // Hallway walls
    ctx.fillStyle = "#252530";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(doorX - doorW / 2, doorY - doorH / 2);
    ctx.lineTo(doorX - doorW / 2, doorY + doorH / 2);
    ctx.lineTo(0, H);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(doorX + doorW / 2, doorY - doorH / 2);
    ctx.lineTo(doorX + doorW / 2, doorY + doorH / 2);
    ctx.lineTo(W, H);
    ctx.fill();

    // Door
    ctx.fillStyle = "#3d3226";
    ctx.fillRect(doorX - doorW / 2, doorY - doorH / 2, doorW, doorH);
    ctx.strokeStyle = "#5a4a3a";
    ctx.lineWidth = 3;
    ctx.strokeRect(doorX - doorW / 2, doorY - doorH / 2, doorW, doorH);

    // Door handle
    ctx.fillStyle = "#d4b87a";
    ctx.beginPath();
    ctx.arc(doorX + doorW * 0.25, doorY + doorH * 0.05, 6, 0, Math.PI * 2);
    ctx.fill();

    // Light under the door
    if (progress > 0.4) {
      const la = (progress - 0.4) / 0.6;
      ctx.fillStyle = `rgba(248, 243, 220, ${(la * 0.6).toFixed(2)})`;
      ctx.fillRect(doorX - doorW * 0.35, doorY + doorH / 2, doorW * 0.7, 4);
    }
  }

  function drawStudioBackground(progress) {
    // Warm studio interior
    drawPaperBackground(ctx);

    // Wall sketches - faint lines
    ctx.strokeStyle = "#c5b99a";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const sx = 40 + i * 140;
      const sy = 30;
      // Sketch frame
      ctx.strokeRect(sx, sy, 100, 120);
      // Faint sketch lines inside
      const alpha = 0.15 + 0.05 * Math.sin(i * 1.7);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(sx + 20, sy + 90);
      ctx.lineTo(sx + 50, sy + 30);
      ctx.lineTo(sx + 80, sy + 70);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Desk
    ctx.fillStyle = "#3d3226";
    ctx.fillRect(60, H - 100, W - 120, 20);
    ctx.fillStyle = "#5a4a3a";
    ctx.fillRect(60, H - 80, W - 120, 4);

    // Desk lamp glow
    const lampX = W - 180;
    const lampY = H - 150;
    ctx.fillStyle = "#f0d9a5";
    ctx.beginPath();
    ctx.moveTo(lampX, lampY);
    ctx.lineTo(lampX - 20, lampY + 30);
    ctx.lineTo(lampX + 20, lampY + 30);
    ctx.fill();
    ctx.fillStyle = "rgba(240, 217, 165, 0.15)";
    ctx.beginPath();
    ctx.arc(lampX, lampY + 40, 80, 0, Math.PI * 2);
    ctx.fill();

    // Paper on desk
    ctx.fillStyle = "#f8f3e7";
    ctx.fillRect(W / 2 - 60, H - 120, 120, 30);
  }

  function drawInkdotBackground(progress) {
    // Same as studio but with inkdot glowing
    drawStudioBackground(0);

    // Darken slightly
    ctx.fillStyle = "rgba(8, 7, 12, 0.3)";
    ctx.fillRect(0, 0, W, H);

    // Inkdot - small creature on the desk
    const dotX = W / 2 + 40;
    const dotY = H - 140;
    const bounce = Math.sin(phaseFrame * 0.06) * 3;

    // Glow
    const glowAlpha = 0.1 + progress * 0.3;
    const glowR = 30 + progress * 40;
    const glowGradient = ctx.createRadialGradient(dotX, dotY + bounce, 4, dotX, dotY + bounce, glowR);
    glowGradient.addColorStop(0, "rgba(80, 120, 255, 0.6)");
    glowGradient.addColorStop(0.5, "rgba(40, 60, 180, 0.3)");
    glowGradient.addColorStop(1, "rgba(20, 30, 100, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(dotX, dotY + bounce, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Inkdot body
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(dotX, dotY + bounce, 12, 0, Math.PI * 2);
    ctx.fill();

    // Inkdot eyes
    ctx.fillStyle = "#80b0ff";
    ctx.beginPath();
    ctx.arc(dotX - 4, dotY - 2 + bounce, 3, 0, Math.PI * 2);
    ctx.arc(dotX + 4, dotY - 2 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    // Ink dots floating around
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + phaseFrame * 0.01;
      const dist = 40 + Math.sin(phaseFrame * 0.04 + i) * 15;
      const ix = dotX + Math.cos(angle) * dist;
      const iy = dotY + bounce + Math.sin(angle) * dist;
      const isize = 2 + Math.abs(Math.sin(phaseFrame * 0.05 + i)) * 4;

      ctx.fillStyle = "rgba(30, 60, 160, 0.5)";
      ctx.beginPath();
      ctx.arc(ix, iy, isize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPortalBackground(progress) {
    // Dark void encroaching
    const darkAlpha = 0.3 + progress * 0.5;
    ctx.fillStyle = `rgba(8, 7, 12, ${darkAlpha.toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);

    // Ink tendrils from edges
    ctx.strokeStyle = "#1a1a3e";
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const edgeX = i < 6 ? 0 : W;
      const edgeY = (i % 6) * (H / 5) + H / 10;
      const targetX = W / 2;
      const targetY = H / 2;
      const t = Math.min(1, progress * 1.5);

      ctx.beginPath();
      ctx.moveTo(edgeX, edgeY);
      const cp1x = edgeX + (targetX - edgeX) * 0.3 * t;
      const cp1y = edgeY + (Math.sin(phaseFrame * 0.02 + i) * 30) * t;
      const cp2x = edgeX + (targetX - edgeX) * 0.7 * t;
      const cp2y = targetY + (Math.cos(phaseFrame * 0.02 + i) * 30) * t;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, targetY, targetX, targetY);
      ctx.stroke();
    }

    // Portal opening at center
    const portalX = W / 2;
    const portalY = H / 2;
    const portalR = 20 + progress * 100;

    // Outer ring
    const outerGradient = ctx.createRadialGradient(portalX, portalY, portalR * 0.4, portalX, portalY, portalR);
    outerGradient.addColorStop(0, "rgba(20, 40, 100, 0.8)");
    outerGradient.addColorStop(0.6, "rgba(40, 80, 200, 0.3)");
    outerGradient.addColorStop(1, "rgba(10, 20, 60, 0)");
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(portalX, portalY, portalR, 0, Math.PI * 2);
    ctx.fill();

    // Inner portal - rotating ink swirl
    ctx.save();
    ctx.translate(portalX, portalY);
    ctx.rotate(phaseFrame * 0.03);
    const innerR = portalR * 0.5;
    ctx.strokeStyle = "rgba(100, 160, 255, 0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const a = (i / 3) * Math.PI * 2;
      for (let r = 0; r <= innerR; r += 2) {
        const angle = a + r * 0.06;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (r === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Tiny inkdot silhouette near portal
    const dotPX = portalX - portalR * 0.8;
    const dotPY = portalY + 5 * Math.sin(phaseFrame * 0.05);
    ctx.fillStyle = "#0a0a18";
    ctx.beginPath();
    ctx.arc(dotPX, dotPY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5080cc";
    ctx.beginPath();
    ctx.arc(dotPX - 2, dotPY - 1, 1.5, 0, Math.PI * 2);
    ctx.arc(dotPX + 2, dotPY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNarrative(narrative) {
    // Calculate revealed text
    let remaining = textReveal;
    const revealedLines = narrative.lines.map((line) => {
      if (remaining <= 0) return "";
      if (remaining >= line.length) {
        remaining -= line.length;
        return line;
      }
      const revealed = line.slice(0, Math.floor(remaining));
      remaining = 0;
      return revealed;
    });

    // Title
    ctx.fillStyle = "#24211f";
    ctx.font = "26px Segoe UI, Microsoft YaHei, sans-serif";
    ctx.fillText(narrative.title, 70, H - 220);

    // Lines
    ctx.font = "17px Segoe UI, Microsoft YaHei, sans-serif";
    for (let i = 0; i < revealedLines.length; i++) {
      const text = revealedLines[i];
      if (!text) continue;
      // Fade in the current-revealing line
      const isRevealingLine = remaining < narrative.lines[i]?.length && remaining > -2.5;
      const color = isRevealingLine ? "#3a362f" : "#24211f";
      ctx.fillStyle = color;
      ctx.fillText(text, 70, H - 180 + i * 30);
    }
  }

  function drawStreetlight(x, y, glow) {
    // Pole
    ctx.fillStyle = "#3a3a4a";
    ctx.fillRect(x - 1, y, 3, H - y);

    // Lamp head
    ctx.fillStyle = "#4a4a5a";
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x + 6, y + 10);
    ctx.lineTo(x - 6, y + 10);
    ctx.fill();

    // Glow
    const gradient = ctx.createRadialGradient(x, y + 10, 4, x, y + 20, 60);
    gradient.addColorStop(0, `rgba(255, 220, 150, ${(glow * 0.5).toFixed(2)})`);
    gradient.addColorStop(1, "rgba(255, 220, 150, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y + 20, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCitySilhouette(progress) {
    const buildings = [
      { x: 10, w: 70, h: 140 },
      { x: 90, w: 50, h: 200 },
      { x: 150, w: 90, h: 120 },
      { x: 250, w: 60, h: 180 },
      { x: 320, w: 80, h: 150 },
      { x: 410, w: 50, h: 220 },
      { x: 470, w: 100, h: 160 },
      { x: 580, w: 70, h: 190 },
      { x: 660, w: 80, h: 130 },
      { x: 750, w: 60, h: 200 },
      { x: 820, w: 90, h: 150 },
      { x: 920, w: 50, h: 170 },
    ];

    // Scroll buildings
    const scroll = phaseFrame * 0.3;
    ctx.fillStyle = "#141420";
    for (const b of buildings) {
      const bx = ((b.x - scroll) % (W + 200)) - 100;
      ctx.fillRect(bx, H - 60 - b.h, b.w, b.h);

      // Windows
      ctx.fillStyle = "#2a2a40";
      for (let wy = H - 60 - b.h + 10; wy < H - 70; wy += 18) {
        for (let wx = bx + 6; wx < bx + b.w - 6; wx += 12) {
          if (Math.random() > 0.3) {
            const winGlow = 0.2 + 0.2 * Math.sin((wy * 100 + wx + phaseFrame * 0.02));
            ctx.fillStyle = `rgba(255, 220, 140, ${winGlow.toFixed(2)})`;
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
    }
  }

  function drawWalkingFigure(x, y, frame) {
    const walkCycle = Math.sin(frame * 0.1) * 3;
    ctx.fillStyle = "#0a0a14";
    // Body
    ctx.fillRect(x - 3, y - 20, 6, 20);
    // Head
    ctx.beginPath();
    ctx.arc(x, y - 24, 5, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.fillRect(x - 3, y, 2, 6 + walkCycle);
    ctx.fillRect(x + 1, y, 2, 6 - walkCycle);
    // Bag
    ctx.fillRect(x + 3, y - 14, 4, 8);
  }

  function lerpColor(a, b, t) {
    const ah = parseInt(a.replace("#", ""), 16);
    const bh = parseInt(b.replace("#", ""), 16);
    const ar = (ah >> 16) & 0xff;
    const ag = (ah >> 8) & 0xff;
    const ab = ah & 0xff;
    const br = (bh >> 16) & 0xff;
    const bg = (bh >> 8) & 0xff;
    const bb = bh & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `rgb(${rr}, ${rg}, ${rb})`;
  }

  function isDone() {
    return done;
  }

  return { start, update, draw, handleKey, handleClick, isDone };
}
