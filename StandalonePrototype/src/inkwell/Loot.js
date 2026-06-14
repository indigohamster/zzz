import { TILE } from "../core/config.js";
import { label } from "../core/render.js";

const MATERIALS = {
  graphiteDust: { name: "Graphite Dust", color: "#77756e" },
  inkDrop: { name: "Ink Drop", color: "#302a48" },
  correctionMark: { name: "Correction Mark", color: "#b23b48" },
  templateShard: { name: "Template Shard", color: "#e9e6de" },
};

const ITEMS = [
  { id: "steady_wrist", name: "Steady Wrist", color: "#f0d9a5", apply: ({ player }) => { player.maxInkBonus += 12; } },
  { id: "old_margin_note", name: "Old Margin Note", color: "#d8cfb8", apply: ({ weapon }) => { weapon.damage += 4; } },
  { id: "crooked_ruler", name: "Crooked Ruler", color: "#8d1d25", apply: ({ weapon }) => { weapon.reach += 8; } },
  { id: "warm_lamp", name: "Warm Lamp", color: "#f2b84b", apply: ({ player }) => { player.hp = Math.min(100, player.hp + 18); } },
];

export function createLootManager({ tileMap, player, weapon, run }) {
  const pickups = [];
  const chests = [];
  const inventory = {
    graphiteDust: 0,
    inkDrop: 0,
    correctionMark: 0,
    templateShard: 0,
    items: [],
  };

  function reset() {
    pickups.length = 0;
    chests.length = 0;
    inventory.items = [];
    spawnTreasureChests();
    player.maxInkBonus = 0;
  }

  function spawnTreasureChests() {
    const rooms = tileMap.getRooms().filter((room) => room.type === "treasure");
    for (const room of rooms) {
      chests.push({
        x: (room.x + Math.floor(room.w / 2)) * TILE,
        y: (room.y + room.h - 7) * TILE,
        opened: false,
      });
    }
  }

  function openNearestChest() {
    for (const chest of chests) {
      if (chest.opened) continue;
      if (Math.hypot(player.x - chest.x, player.y - chest.y) > 42) continue;
      chest.opened = true;
      dropMaterial("graphiteDust", chest.x - 18, chest.y - 18, 4);
      dropMaterial("inkDrop", chest.x + 2, chest.y - 22, 3);
      dropItem(pickItem(0), chest.x + 20, chest.y - 18);
      run.chestsOpened++;
      return true;
    }
    return false;
  }

  function dropBossRewards(x, y) {
    inventory.templateShard += 2;
    inventory.correctionMark += 4;
    inventory.inkDrop += 6;
    run.materialsCollected += 12;
    const item = pickItem(run.kills + run.chestsOpened);
    inventory.items.push(item.name);
    item.apply({ player, weapon });
    player.ink = Math.min(100 + player.maxInkBonus, player.ink + player.maxInkBonus);
    run.itemsCollected++;
    run.bossRewards++;
  }

  function dropMaterial(kind, x, y, amount) {
    pickups.push({ type: "material", kind, amount, x, y, vx: (Math.random() - 0.5) * 1.4, vy: -1.8 - Math.random(), picked: false });
  }

  function dropItem(item, x, y) {
    pickups.push({ type: "item", item, x, y, vx: (Math.random() - 0.5) * 1.1, vy: -2.2, picked: false });
  }

  function pickItem(seed) {
    return ITEMS[seed % ITEMS.length];
  }

  function update() {
    for (const pickup of pickups) {
      if (pickup.picked) continue;
      pickup.vy = Math.min(3, pickup.vy + 0.12);
      pickup.x += pickup.vx;
      pickup.y += pickup.vy;
      if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 22) collect(pickup);
    }
  }

  function collect(pickup) {
    pickup.picked = true;
    if (pickup.type === "material") {
      inventory[pickup.kind] += pickup.amount;
      run.materialsCollected += pickup.amount;
      return;
    }
    inventory.items.push(pickup.item.name);
    pickup.item.apply({ player, weapon });
    player.ink = Math.min(100 + player.maxInkBonus, player.ink + player.maxInkBonus);
    run.itemsCollected++;
  }

  function draw(ctx, cameraX, cameraY) {
    for (const chest of chests) drawChest(ctx, chest, cameraX, cameraY);
    for (const pickup of pickups) {
      if (pickup.picked) continue;
      if (pickup.type === "material") drawMaterial(ctx, pickup, cameraX, cameraY);
      else drawItem(ctx, pickup, cameraX, cameraY);
    }
  }

  function drawChest(ctx, chest, cameraX, cameraY) {
    const x = Math.floor(chest.x - cameraX);
    const y = Math.floor(chest.y - cameraY);
    ctx.fillStyle = chest.opened ? "#6f6658" : "#b58b42";
    ctx.fillRect(x - 9, y - 7, 18, 12);
    ctx.fillStyle = "#2a2928";
    ctx.fillRect(x - 9, y - 2, 18, 2);
    ctx.fillStyle = "#f1ead9";
    ctx.fillRect(x - 2, y - 4, 4, 4);
    if (!chest.opened && Math.hypot(player.x - chest.x, player.y - chest.y) < 42) {
      label(ctx, "E open", x - 18, y - 14, 11, "#f7f0df");
    }
  }

  function drawMaterial(ctx, pickup, cameraX, cameraY) {
    const x = Math.floor(pickup.x - cameraX);
    const y = Math.floor(pickup.y - cameraY);
    const mat = MATERIALS[pickup.kind];
    ctx.fillStyle = mat.color;
    ctx.fillRect(x - 3, y - 3, 6, 6);
    ctx.fillStyle = "#f1ead9";
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  function drawItem(ctx, pickup, cameraX, cameraY) {
    const x = Math.floor(pickup.x - cameraX);
    const y = Math.floor(pickup.y - cameraY);
    ctx.fillStyle = pickup.item.color;
    ctx.fillRect(x - 6, y - 6, 12, 12);
    ctx.strokeStyle = "#1d1c1a";
    ctx.strokeRect(x - 6.5, y - 6.5, 13, 13);
  }

  function drawInventory(ctx, x, y) {
    label(ctx, `mat G${inventory.graphiteDust} I${inventory.inkDrop} C${inventory.correctionMark} T${inventory.templateShard}`, x, y, 12, "#f7f0df");
    if (inventory.items.length > 0) label(ctx, `items ${inventory.items.slice(-2).join(", ")}`, x, y + 18, 12, "#f7f0df");
  }

  function hasActivePickups() {
    return pickups.some((pickup) => !pickup.picked);
  }

  return { reset, update, draw, drawInventory, openNearestChest, dropBossRewards, hasActivePickups, inventory };
}
