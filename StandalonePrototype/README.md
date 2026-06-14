# Inkwell Deep Standalone Prototype

This is a standalone browser prototype for the first Inkwell Deep loop:

1. Draw a weapon in the night studio.
2. Convert drawing process into weapon stats.
3. Enter a Terraria-like ink world.
4. Fight, dig, place blocks, open treasure rooms, defeat a nightly boss, and choose when to return.

## Run

Open `index.html` directly in a browser, or serve this folder with any static file server.

## Studio Controls

- Hold left mouse: draw
- `R`: clear drawing
- `Enter`: enter Inkwell after drawing

## Inkwell Controls

- `A / D`: move
- `Space`: jump / double jump
- `Shift`: dash
- Left mouse: attack / mine nearby tile
- Right mouse: place paper block
- `1 / 2`: switch tool mode
- `E`: open nearby chest or enter a boss portal
- `F`: return and generate draft feedback

## Current Goal

Prove the base loop before choosing a heavier engine:

- drawing metrics
- weapon stat conversion
- larger randomized nightly dungeon maps
- detailed tile generation and neighbor-aware tile rendering
- 8px dense tile grid for a Terraria-like visible tile density
- side-view movement with double jump and dash
- digging and placing
- melee combat
- morning feedback
- 90-second timed nightly Inkwell combat run
- deadline choice: submit, overtime, or all-nighter
- treasure room chests and Boss rewards
- boss-death return portal, so the player chooses when to leave
- randomized Boss variants with distinct skills and resistance profiles
- persistent upgrade materials plus nightly collectible items
- isolated protagonist sprite module based on the character design document

## Code Layout

- `src/main.js`: scene flow, studio UI, morning feedback
- `src/game/GameState.js`: global day, phase, brief, weapon, status, relation state
- `src/game/DayCycle.js`: lightweight Morning/Work/Free/Inkwell/Settlement phase controller
- `src/features/drawing/DrawingCanvas.js`: studio drawing surface and transparent weapon image export
- `src/features/drawing/StrokeRecorder.js`: stroke process capture and drawing metrics
- `src/features/drawing/WeaponProfile.js`: Drawing metrics to WeaponProfile combat conversion
- `src/scenes/inkwell.js`: Inkwell scene orchestrator, similar to a small `Main`
- `src/inkwell/TileMap.js`: tile arrays and tile read/write API
- `src/inkwell/WorldGen.js`: world generation passes
- `src/inkwell/TileDrawing.js`: neighbor-aware tile drawing and tile texture details
- `src/inkwell/Background.js`: parallax paper/cave background rendering
- `src/inkwell/Lighting.js`: Terraria-like darkness and radial light pass
- `src/inkwell/Player.js`: player movement, jumping, mining, placing
- `src/inkwell/WeaponRenderer.js`: render the player's exported drawing as held and attacking weapons
- `src/inkwell/NPC.js`: enemy storage, AI update, drawing
- `src/inkwell/BossCatalog.js`: randomized Boss variant definitions
- `src/inkwell/Loot.js`: treasure chests, materials, items, Boss rewards
- `src/inkwell/Portal.js`: boss-death return portal
- `src/inkwell/Physics.js`: tile collision and ground probing
- `src/inkwell/InkwellConfig.js`: combat scene tuning constants
- `src/inkwell/Noise.js`: deterministic noise helpers for world generation
- `src/characters/protagonist/`: protagonist visual module
- `src/core/config.js`: shared resolution, tile, and world constants
- `src/core/render.js`: shared drawing helpers
