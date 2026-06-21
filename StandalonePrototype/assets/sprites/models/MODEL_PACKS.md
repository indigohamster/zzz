# Model Pack Layout

Each model lives in a type folder, then its own model folder, and is imported by
`src/core/SpriteAssets.js`.

Type folders:

- `player/`: playable character models.
- `companions/`: companion or pet-like actors.
- `story_npcs/`: Inkwell exploration NPCs and named story figures.
- `office_npcs/`: daytime office cast and client-side characters.
- `monsters/`: normal hostile creatures and exploration threats.
- `bosses/`: large encounter or set-piece enemies.

Required files:

- `base.png`: full transparent character sprite.
- `config.json`: model metadata, anchor, display name, and animation table.
- `idle_strip.png`: idle or float loop.
- `walk_strip.png`: walk, hostile, or heavy motion loop.
- `talk_strip.png`: active conversation, client feedback, or short reaction loop.
- `run_strip.png`: faster locomotion loop for actors that need a separate run state.
- `draw_strip.png`: drawing, crafting, or focused work loop when the actor has one.
- `jump_strip.png`: jump, lift, or airborne loop when the actor has one.
- `hurt_strip.png`: 3-frame hit reaction.
- `animations/<action>/frame_00.png`: separated frames for each authored action.
- `frame_data.json`: per-action frame list, timing, and foot/contact anchors.
- `anchor_preview.png`: visual QA sheet showing each frame's anchor and floor line.
- `portrait.png`: 96x96 UI/dialog portrait.
- `icon.png`: 64x64 map, task, or compact UI icon.
- `silhouette.png`: single-color shape for placeholders, shadows, and locked entries.

The game currently uses `base.png` as fallback and prefers the animation strips when
they are loaded. Each polished model should keep its foot/contact anchor stable
across all frames, then copy those anchors into `SpriteAssets.js` so runtime
animation does not drift or bounce incorrectly. Future richer models can add more
strips and list them in `config.json` before wiring them into `SpriteAssets.js`.
