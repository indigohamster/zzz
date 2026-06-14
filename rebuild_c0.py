# -*- coding: utf-8 -*-
import os

# Build the complete Chapter0.js
# All Chinese text uses unicode escapes to avoid any encoding issues
parts = []

parts.append("""// Chapter 0: Prologue \u2014 \u5e8f\u7ae0
// Walkable rental room \u2192 old sketchbook \u2192 Inkdot emerges \u2192 ink spread \u2192 enter ink realm.
import { H, W } from "../core/config.js";
import { label } from "../core/render.js";

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
    { speaker: "", text: "\u7535\u8111\u5c4f\u5e55\u4e0a\u8fd8\u4eae\u7740\u3002\u5ba2\u6237\u8981\u6c42\u518d\u6539\u4e00\u7248\u3002" },
    { speaker: "", text: "\u5df2\u7ecf\u662f\u7b2c\u4e94\u6b21\u4fee\u6539\u4e86\u3002" },
  ],
  tablet: [
    { speaker: "", text: "\u6570\u4f4d\u677f\u7684\u7b14\u5c16\u78e8\u635f\u5f97\u5389\u5bb3\u3002" },
    { speaker: "", text: "\u4eca\u665a\u8fd8\u6ca1\u6709\u52a8\u8fc7\u5b83\u3002" },
  ],
  manuscripts: [
    { speaker: "", text: "\u6563\u843d\u7684\u7a3f\u4ef6\u94fa\u4e86\u534a\u5f20\u684c\u5b50\u3002" },
    { speaker: "", text: "\u6709\u4e9b\u7ebf\u6761\u53cd\u590d\u64e6\u6539\uff0c\u7eb8\u9762\u90fd\u8d77\u4e86\u6bdb\u3002" },
  ],
  sketchbook_first: [
    { speaker: "", text: "\u4e66\u67b6\u4e0a\u6709\u4e00\u672c\u5f88\u65e7\u7684\u753b\u518c\u3002" },
    { speaker: "", text: "\u5c01\u9762\u5df2\u7ecf\u892a\u8272\uff0c\u8fb9\u89d2\u78e8\u5706\u4e86\u3002" },
  ],
  sketchbook_open: [
    { speaker: "", text: "\u7ffb\u5f00\u753b\u518c\uff0c\u91cc\u9762\u662f\u4f60\u5c0f\u65f6\u5019\u753b\u7684\u753b\u3002" },
    { speaker: "", text: "\u4e00\u53ea\u5c0f\u732b\u3002\u7ebf\u6761\u7b28\u62d9\uff0c\u4f46\u773c\u775b\u5f88\u4eae\u3002" },
    { speaker: "", text: "\u2026\u2026\u4f60\u51e0\u4e4e\u5fd8\u4e86\u5b83\u8fd8\u5728\u8fd9\u91cc\u3002" },
  ],
  inkdot_emerge: [
    { speaker: "\u58a8\u70b9", text: "\u597d\u4e45\u4e0d\u89c1\u3002" },
    { speaker: "\u58a8\u70b9", text: "\u2026\u2026" },
    { speaker: "\u58a8\u70b9", text: "\u4f60\u8fd8\u597d\u5417\uff1f" },
  ],
  ink_entry: [
    { speaker: "\u58a8\u70b9", text: "\u8fd9\u91cc\u8fd8\u662f\u8001\u6837\u5b50\u3002" },
    { speaker: "\u58a8\u70b9", text: "\u2026\u2026" },
    { speaker: "\u58a8\u70b9", text: "\u53c8\u597d\u50cf\u53d8\u4e86\u5f88\u591a\u3002" },
  ],
};

// ---- Interactable items in the room ----
function createItems() {
  return [
    {
      id: "desk",
      x: 180, y: 290, w: 160, h: 150,
      label: "\u7535\u8111\u684c",
      inspected: false,
      draw: drawDesk,
    },
    {
      id: "tablet",
      x: 620, y: 350, w: 70, h: 90,
      label: "\u6570\u4f4d\u677f",
      inspected: false,
      draw: drawTablet,
    },
    {
      id: "manuscripts",
      x: 350, y: 380, w: 100, h: 60,
      label: "\u6563\u843d\u7684\u7a3f\u4ef6",
      inspected: false,
      draw: drawManuscripts,
    },
    {
      id: "sketchbook",
      x: 500, y: 240, w: 50, h: 200,
      label: "\u65e7\u753b\u518c",
      inspected: false,
      draw: drawSketchbook,
    },
  ];
}
""")

with open(r"D:\InkwellDeep\StandalonePrototype\src\scenes\Chapter0.js", "w", encoding="utf-8") as f:
    for p in parts:
        f.write(p)

print("Part 1 written:", len(parts[0]), "bytes")
