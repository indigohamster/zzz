import { TILE } from "../core/config.js?v=27";
import { MAP_LAYERS } from "./MapLayers.js?v=4";

export const LAYER_VISUALS = {
  shallow: {
    id: "shallow",
    name: "浅层草稿区",
    uiName: "SHALLOW / 草稿浅层",
    accent: "#f0d9a5",
    secondary: "#7dd3fc",
    danger: "#b23b48",
    outline: "#05070b",
    particle: "#f5efe0",
    haze: "rgba(240,217,165,0.06)",
    scan: "rgba(125,211,252,0.035)",
    bands: [
      [[94, 116, 132], [9, 13, 24]],
      [[118, 136, 142], [14, 21, 34]],
      [[176, 166, 128], [24, 29, 42]],
      [[221, 205, 166], [52, 52, 61]],
    ],
    parallax: ["#4d6872", "#405363", "#6d6a5f"],
    tileLight: "#f1ead9",
    tileMid: "#cdbf9a",
    tileDark: "#6e5f45",
  },
  middle: {
    id: "middle",
    name: "中层废稿区",
    uiName: "MIDDLE / 废稿中层",
    accent: "#b58b42",
    secondary: "#8b8173",
    danger: "#d9794d",
    outline: "#05070b",
    particle: "#d8cfb8",
    haze: "rgba(181,139,66,0.07)",
    scan: "rgba(216,207,184,0.028)",
    bands: [
      [[48, 55, 64], [8, 10, 16]],
      [[64, 64, 70], [14, 17, 24]],
      [[78, 73, 64], [24, 24, 30]],
      [[95, 82, 64], [37, 34, 39]],
    ],
    parallax: ["#39424e", "#4a4540", "#5a4b3c"],
    tileLight: "#b3b7c8",
    tileMid: "#5d6374",
    tileDark: "#222633",
  },
  deep: {
    id: "deep",
    name: "深层模板污染区",
    uiName: "DEEP / 模板深层",
    accent: "#7dd3fc",
    secondary: "#8b6b9e",
    danger: "#b23b48",
    outline: "#02040a",
    particle: "#7dd3fc",
    haze: "rgba(125,211,252,0.09)",
    scan: "rgba(139,107,158,0.055)",
    bands: [
      [[15, 24, 40], [3, 5, 12]],
      [[19, 31, 50], [6, 9, 18]],
      [[29, 36, 58], [9, 12, 24]],
      [[42, 44, 68], [12, 14, 28]],
    ],
    parallax: ["#13233a", "#1c2438", "#2a263d"],
    tileLight: "#79a8c8",
    tileMid: "#18243a",
    tileDark: "#060912",
  },
};

export function getLayerThemeById(layerId) {
  return LAYER_VISUALS[layerId] ?? LAYER_VISUALS.shallow;
}

export function getLayerIdByTileY(tileY) {
  const deep = MAP_LAYERS.find((layer) => layer.id === "deep");
  const middle = MAP_LAYERS.find((layer) => layer.id === "middle");
  if (deep && tileY >= deep.yRange[0]) return "deep";
  if (middle && tileY >= middle.yRange[0]) return "middle";
  return "shallow";
}

export function getLayerThemeByTileY(tileY) {
  return getLayerThemeById(getLayerIdByTileY(tileY));
}

export function getLayerThemeByCameraY(cameraY) {
  return getLayerThemeByTileY(Math.floor(cameraY / TILE) + 28);
}
