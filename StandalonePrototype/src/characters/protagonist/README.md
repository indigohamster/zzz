# Protagonist Sprite Module

Source reference: character design document on the Desktop.

The first pass keeps the sprite intentionally compact so it can be swapped for richer pixel art later:

- 12x20-ish pixel-art character.
- Messy short black hair.
- Tired but focused expression.
- Loose dark gray hoodie.
- Black cargo pants.
- White canvas shoes with ink stains.
- Natural skin tone.
- Ink-blue accent.
- Pencil held in the right hand.
- Old headphone cord detail.

Implementation:

- `ProtagonistSprite.js` exports `drawProtagonist`.
- Player logic stays in `src/inkwell/Player.js`.
- Sprite drawing is isolated here so later art revisions do not touch movement/combat logic.
