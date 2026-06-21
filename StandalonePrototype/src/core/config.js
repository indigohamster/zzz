import { TUNING } from "./TuningConfig.js?v=3";

export const W = 960;
export const H = 540;
export const TILE = 8;
export const WORLD_W = TUNING.world.widthTiles;
export const WORLD_H = TUNING.world.heightTiles;

export const Tile = { Air: 0, Paper: 1, Graphite: 2, Ink: 3 };

export const tileColors = {
  [Tile.Paper]: ["#cdbf9a", "#8d7656"],
  [Tile.Graphite]: ["#5d6374", "#2d3140"],
  [Tile.Ink]: ["#18243a", "#070b16"],
};
