# -*- coding: utf-8 -*-
part3 = """
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
      drawPlayerSprite(ctx, player.x, player.y, player.facing, player.animFrame, isWalking);
    }
    if (phase === PHASE.EXPLORE && nearItem && !nearItem.inspected && !showingDialogue) {
      const px = nearItem.x + nearItem.w / 2 - 40;
      const py = nearItem.y - 16;
      ctx.fillStyle = "rgba(8, 7, 10, 0.75)";
      ctx.fillRect(px - 6, py - 4, 90, 22);
      ctx.fillStyle = "#f0d9a5";
      ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText("\u6309 E \u67e5\u770b " + nearItem.label, px, py + 13);
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
    }
  }

  function isDone() { return done; }

  return { start, update, draw, handleKey, handleClick, isDone };
}
"""

with open(r"D:\InkwellDeep\StandalonePrototype\src\scenes\Chapter0.js", "a", encoding="utf-8") as f:
    f.write(part3)
print("Part 3 appended:", len(part3), "bytes")
