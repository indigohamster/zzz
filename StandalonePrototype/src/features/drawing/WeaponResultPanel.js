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

  ctx.fillStyle = "#1f1e1c";
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.strokeStyle = "#f0d9a5";
  ctx.lineWidth = 1;
  ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

  label(ctx, "Weapon Result", panel.x + 16, panel.y + 24, 15, "#f0d9a5");
  label(ctx, `${archetype.displayName ?? "Sword"}`, panel.x + 16, panel.y + 50, 19, "#f8f3e7");
  label(ctx, `attack ${archetype.attackPattern ?? combat.attackPattern ?? "arcSlash"}`, panel.x + 178, panel.y + 50, 15, "#f8f3e7");

  label(ctx, `damage ${stats.damage ?? combat.damage ?? 12}`, panel.x + 16, panel.y + 78, 15, "#f8f3e7");
  label(ctx, `range ${stats.range ?? combat.range ?? 56}`, panel.x + 126, panel.y + 78, 15, "#f8f3e7");
  label(ctx, `speed ${formatAttackSpeed(stats, combat)}`, panel.x + 232, panel.y + 78, 15, "#f8f3e7");

  label(ctx, "shape", panel.x + 16, panel.y + 106, 13, "#a99d8c");
  label(ctx, `aspect ${formatNumber(metrics.aspectRatio, 2)}  coverage ${formatNumber(metrics.coverage, 2)}`, panel.x + 16, panel.y + 126, 13, "#f8f3e7");
  label(ctx, `closed ${formatNumber(metrics.closedShapeScore ?? metrics.closedness, 2)}  complexity ${formatNumber(metrics.complexity, 2)}`, panel.x + 16, panel.y + 144, 13, "#f8f3e7");

  label(ctx, `traits ${traits.join(", ")}`, panel.x + 16, panel.y + 168, 13, "#f8f3e7");
  label(ctx, `why ${formatTraitReasons(traitReasons)}`, panel.x + 16, panel.y + 190, 12, "#f8f3e7");
  drawEnterButton(ctx, label);
}

function drawEnterButton(ctx, label) {
  ctx.fillStyle = "#f0d9a5";
  ctx.fillRect(weaponResultEnterButton.x, weaponResultEnterButton.y, weaponResultEnterButton.w, weaponResultEnterButton.h);
  ctx.strokeStyle = "#0d0d0d";
  ctx.lineWidth = 2;
  ctx.strokeRect(weaponResultEnterButton.x, weaponResultEnterButton.y, weaponResultEnterButton.w, weaponResultEnterButton.h);
  label(ctx, "Enter Inkwell", weaponResultEnterButton.x + 22, weaponResultEnterButton.y + 23, 15, "#1f1e1c");
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

