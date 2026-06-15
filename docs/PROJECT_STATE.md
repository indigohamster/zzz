# Project State — Inkwell Deep (墨境)

## Current Phase
Canvas Rift (画稿裂口) Integration

## Core Loop Status
```
chapter0 → opening → studio → (T) InkwellExperiment → feedback → work → studio
                                                         └→ studio (experiment onFinish)
```

## Recently Implemented: Canvas Rift System (v3)

### Files Modified
- `src/scenes/InkwellExperiment.js` — v3 rewrite: full CanvasRift + RiftWorld integration
- `src/ecology/RiftWorld.js` — v2: added worldState.finished signal, nested rift support
- `src/ecology/MapLayers.js` — new: depth layer definitions (was missing, caused import error)

### Canvas Rift Features
- **5 Rift Types**: warm (温馨画稿), waste (废稿世界), ai_tainted (AI污染区), memory (记忆画稿), unknown (未知作者)
- **5 Visual Styles**: torn_paper, burning_sketch, twisted_frame, floating_page, inverted_sketchbook
- **Depth-based Spawning**: shallow (10%), middle (20%), deep (35%), danger zone (guaranteed)
- **RiftWorld Sub-maps**: 5 unique world types with creatures, items, exit portals
- **Nested Rifts**: rifts can appear inside rift worlds (nestChance per type)
- **Exit Randomization**: player returns to map at a different position than entry
- **Discovery Tracking**: run.riftsEntered, run.riftTypes, run.totalRiftDiscoveries

### Map Structure (Layered)
```
Shallow (y: 2-14):   Paper Shallows — safe, entrance, strange blob, sketch fox
Middle  (y: 18-32):  Graphite Depths — dark zone, revision wraiths, rift spawns
Deep    (y: 36-48):  Ink Abyss — template wolves, deep entity, guaranteed rift
```

### Key Bindings in Experiment
- WASD / Arrows: move
- E: interact (enter rift, exit map)
- J: discovery journal
- T (from studio): enter experiment

### Known Issues
- Main inkwell scene (Enter from studio) has `artworkPct is not defined` - tracked in BUG_LOG.md
- Experiment scene (T from studio) is separate and unaffected

### Next Steps (per user vision)
- Add more creature variety in rift worlds
- Implement drawing canvas integration with rift discoveries
- Add artwork completion tied to rift progress
