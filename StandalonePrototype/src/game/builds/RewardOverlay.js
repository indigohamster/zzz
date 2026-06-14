import { H, W } from "../../core/config.js";
import { label } from "../../core/render.js";

const PANEL_W = 720;
const CARD_W = 206;
const CARD_H = 168;
const CARD_GAP = 18;

export function createRewardOverlay() {
  let visible = false;
  let currentKind = "relic";
let choices = [];
  let onPick = null;
  const cards = [];

  function showRelicChoices(nextChoices, nextOnPick) {
    showChoices("relic", nextChoices, nextOnPick);
  }

  function showEvolutionChoices(nextChoices, nextOnPick) {
    showChoices("evolution", nextChoices, nextOnPick);
  }

  function showChoices(kind, nextChoices, nextOnPick) {
    currentKind = kind;
    choices = Array.isArray(nextChoices) ? nextChoices.slice(0, 3) : [];
    onPick = typeof nextOnPick === "function" ? nextOnPick : null;
    visible = choices.length > 0;
    layoutCards();
  }

  function hide() {
    visible = false;
    choices = [];
    onPick = null;
    cards.length = 0;
  }

  function render(ctx) {
    if (!visible) return;
    ctx.save();
    ctx.fillStyle = "rgba(8, 7, 10, 0.78)";
    ctx.fillRect(0, 0, W, H);

    const panelX = Math.floor((W - PANEL_W) / 2);
    const panelY = 118;
    ctx.fillStyle = "#f1ead9";
    ctx.fillRect(panelX, panelY, PANEL_W, 292);
    ctx.strokeStyle = "#1f1e1c";
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, PANEL_W, 292);

    const title = currentKind === "evolution" ? "Weapon evolution" : "Choose an ink relic";
    const subtitle = currentKind === "evolution"
      ? "Your weapon grows stronger with each evolution."
      : "The chosen relic joins this night's build.";
    label(ctx, title, panelX + 32, panelY + 42, 24, "#24211f");
    label(ctx, subtitle, panelX + 32, panelY + 70, 14, "#5c554c");

    for (let i = 0; i < choices.length; i++) drawCard(ctx, choices[i], cards[i], i, currentKind);
    ctx.restore();
  }

  function handleClick(x, y) {
    if (!visible) return false;
    const index = cards.findIndex((card) => pointInRect(x, y, card));
    if (index < 0) return true;
    const relic = choices[index];
    if (relic && onPick) onPick(relic);
    return true;
  }

  function isVisible() {
    return visible;
  }

  function layoutCards() {
    cards.length = 0;
    const totalW = CARD_W * choices.length + CARD_GAP * Math.max(0, choices.length - 1);
    const startX = Math.floor((W - totalW) / 2);
    const y = 218;
    for (let i = 0; i < choices.length; i++) {
      cards.push({ x: startX + i * (CARD_W + CARD_GAP), y, w: CARD_W, h: CARD_H });
    }
  }

  return { showRelicChoices, showEvolutionChoices, hide, render, handleClick, isVisible };
}

function drawCard(ctx, item, rect, index, kind) {
  ctx.fillStyle = index === 0 ? "#1f1e1c" : "#2b2925";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "#f0d9a5";
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  label(ctx, item.name, rect.x + 14, rect.y + 28, 17, "#f7f0df");
  wrapLabel(ctx, item.desc, rect.x + 14, rect.y + 58, rect.w - 28, 13, "#d8cfb8", 4);

  // Bottom tags: relics show tags, evolutions show weaponType + level badge
  if (kind === "evolution") {
    const badge = `${item.weaponType ?? ""}  Lv.${item.levelRequired ?? 1}`;
    label(ctx, badge, rect.x + 14, rect.y + rect.h - 20, 12, "#f0d9a5");
    // type tag
    ctx.fillStyle = "#3b2f1a";
    ctx.fillRect(rect.x + rect.w - 54, rect.y + 8, 42, 18);
    label(ctx, "EVO", rect.x + rect.w - 52, rect.y + 22, 11, "#f0d9a5");
  } else {
    const tags = (item.tags ?? []).join(" / ");
    label(ctx, tags, rect.x + 14, rect.y + rect.h - 20, 12, "#f0d9a5");
  }
}

function wrapLabel(ctx, text, x, y, maxWidth, size, color, maxLines) {
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  const words = String(text ?? "").split(" ");
  let line = "";
  let lineCount = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      label(ctx, line, x, y + lineCount * 19, size, color);
      line = word;
      lineCount++;
      if (lineCount >= maxLines) return;
    } else {
      line = next;
    }
  }
  if (line && lineCount < maxLines) label(ctx, line, x, y + lineCount * 19, size, color);
}

function pointInRect(x, y, rect) {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}
