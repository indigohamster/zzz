export const weaponResultEnterButton = { x: 704, y: 486, w: 164, h: 34 };

export function drawWeaponResultPanel(ctx, weapon, label) {
  const panel = { x: 548, y: 290, w: 360, h: 232 };
  const archetype = weapon?.archetype ?? {};
  const stats = weapon?.finalStats ?? {};
  const metrics = weapon?.metrics ?? {};
  const modifiers = Array.isArray(weapon?.modifiers) ? weapon.modifiers : [];
  const weaponTraits = Array.isArray(weapon?.traits) ? weapon.traits : [];
  const traitReasons = Array.isArray(weapon?.traitReasons) ? weapon.traitReasons : [];
  const combat = weapon?.combat ?? {};
  const traits = getTraits(weaponTraits, modifiers, combat);
  const briefMatch = weapon?.briefMatch;

  ctx.fillStyle = "#05070b";
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.fillStyle = "#121821";
  ctx.fillRect(panel.x + 4, panel.y + 4, panel.w - 8, panel.h - 8);
  ctx.strokeStyle = "#f0d9a5";
  ctx.lineWidth = 2;
  ctx.strokeRect(panel.x + 0.5, panel.y + 0.5, panel.w - 1, panel.h - 1);
  ctx.fillStyle = "#f0d9a5";
  ctx.fillRect(panel.x, panel.y, 5, panel.h);
  ctx.fillRect(panel.x + panel.w - 5, panel.y, 5, panel.h);
  ctx.fillStyle = "rgba(125,211,252,0.08)";
  for (let y = panel.y + 14; y < panel.y + panel.h - 12; y += 14) {
    ctx.fillRect(panel.x + 14, y, panel.w - 28, 1);
  }

  pixelLabel(ctx, label, "WEAPON RESULT", panel.x + 18, panel.y + 26, 15, "#f0d9a5");
  pixelLabel(ctx, label, `${archetype.displayName ?? "Sword"}`, panel.x + 18, panel.y + 54, 18, "#f8f3e7");
  pixelLabel(ctx, label, `attack ${archetype.attackPattern ?? combat.attackPattern ?? "arcSlash"}`, panel.x + 178, panel.y + 54, 14, "#7dd3fc");

  pixelLabel(ctx, label, `damage ${stats.damage ?? combat.damage ?? 12}`, panel.x + 18, panel.y + 84, 14, "#f8f3e7");
  pixelLabel(ctx, label, `range ${stats.range ?? combat.range ?? 56}`, panel.x + 126, panel.y + 84, 14, "#f8f3e7");
  pixelLabel(ctx, label, `speed ${formatAttackSpeed(stats, combat)}`, panel.x + 232, panel.y + 84, 14, "#f8f3e7");

  pixelLabel(ctx, label, "shape", panel.x + 18, panel.y + 112, 12, "#a99d8c");
  pixelLabel(ctx, label, `aspect ${formatNumber(metrics.aspectRatio, 2)}  coverage ${formatNumber(metrics.coverage, 2)}`, panel.x + 18, panel.y + 132, 12, "#f8f3e7");
  pixelLabel(ctx, label, `closed ${formatNumber(metrics.closedShapeScore ?? metrics.closedness, 2)}  complexity ${formatNumber(metrics.complexity, 2)}`, panel.x + 18, panel.y + 150, 12, "#f8f3e7");

  pixelLabel(ctx, label, `traits ${traits.join(", ")}`, panel.x + 18, panel.y + 176, 12, "#f8f3e7");
  if (briefMatch) {
    const score = Math.round((briefMatch.score ?? 0) * 100);
    const result = briefMatch.success ? "matched" : "missed";
    pixelLabel(ctx, label, `brief ${result} ${score}%  ${shorten(briefMatch.title ?? "brief", 22)}`, panel.x + 18, panel.y + 196, 11, briefMatch.success ? "#7dd3fc" : "#f2b84b");
  } else {
    pixelLabel(ctx, label, `why ${formatTraitReasons(traitReasons)}`, panel.x + 18, panel.y + 196, 11, "#f8f3e7");
  }
  drawEnterButton(ctx, label);
}

function drawEnterButton(ctx, label) {
  ctx.fillStyle = "#05070b";
  ctx.fillRect(weaponResultEnterButton.x, weaponResultEnterButton.y, weaponResultEnterButton.w, weaponResultEnterButton.h);
  ctx.fillStyle = "#f0d9a5";
  ctx.fillRect(weaponResultEnterButton.x + 3, weaponResultEnterButton.y + 3, weaponResultEnterButton.w - 6, weaponResultEnterButton.h - 6);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(weaponResultEnterButton.x + 6, weaponResultEnterButton.y + 6, weaponResultEnterButton.w - 12, 2);
  pixelLabel(ctx, label, "ENTER INKWELL", weaponResultEnterButton.x + 18, weaponResultEnterButton.y + 23, 14, "#1f1e1c");
}

function pixelLabel(ctx, label, text, x, y, size, color) {
  label(ctx, text, x + 2, y + 2, size, "#05070b");
  label(ctx, text, x, y, size, color);
}

function getTraits(weaponTraits, modifiers, combat) {
  const displayTraits = weaponTraits.map((trait) => trait.displayName ?? trait.id).filter(Boolean);
  const modifierTraits = modifiers.map((modifier) => modifier.displayName ?? modifier.id).filter(Boolean);
  const combatTraits = Array.isArray(combat.traits) ? combat.traits : [];
  const traits = displayTraits.length > 0 ? displayTraits : modifierTraits.length > 0 ? modifierTraits : combatTraits;
  return traits.length > 0 ? traits : ["plain"];
}

function formatTraitReasons(reasons) {
  if (reasons.length === 0) return "no trait trigger";
  return shorten(reasons[0], 48);
}

function shorten(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function formatAttackSpeed(stats, combat) {
  const attackSpeed = combat.attackSpeed ?? (stats.useTime ? 60 / stats.useTime : null);
  if (!Number.isFinite(attackSpeed)) return "1.0/s";
  return `${attackSpeed.toFixed(1)}/s`;
}

function formatNumber(value, digits) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.00";
  return number.toFixed(digits);
}

