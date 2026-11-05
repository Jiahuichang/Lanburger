# Asset Guidelines — Lingua Quest

> ⚠️ **Superseded (2026-11-05):** this document describes the Phase 1 side-scroller (Lingua Quest / Mossbrook).
> The game is being redesigned as **Lanburger**, a top-down pixel-art RPG. Draft replacement: `ART_DIRECTION.md §3 and §9 (to be merged after approval)`.
> The redesign plan was approved. Keep this document for history only; do not build from it.

## 1. Licensing

- Every asset must be **original** (made for this project) or carry a license that allows commercial
  use and modification (CC0, CC-BY with credit, or purchased). Record each third-party asset in
  `public/assets/CREDITS.md` (name, author, license, URL, files).
- Never use ripped, traced or "inspired-copy" art, audio or fonts from existing games.

## 2. Folder layout

```
public/assets/
  characters/<id>/sheet.png + manifest.json
  npcs/<id>/sheet.png + manifest.json
  environments/<mapId>/<layer>-*.png
  props/<name>.png
  ui/icons/<name>.svg
  audio/sfx/<name>.ogg   audio/music/<name>.ogg
  audio/voice/<lang>/<itemId>.mp3
  CREDITS.md
```

In Phase 1 the environment and placeholder character are **painted at runtime** (`src/assets/proceduralArt.ts`,
`src/character/placeholderCharacter.ts`) with the art-bible palette. Hand-drawn PNGs replace them
key-by-key through `AssetRegistry` without touching gameplay code.

## 3. Character sprite sheets

- One **row per animation state**, frames left → right, all frames the same size.
- Required rows (order is defined in the manifest, not hard-coded):
  `idle`, `walk`, `jump`, `fall`, `interact`, `celebrate`, `incorrect`.
- Frame size: 256 × 256 px recommended (character ≈ 200 px tall inside), transparent background,
  straight (non-premultiplied) alpha, PNG.
- Pivot: bottom-center between the feet (`pivot: { x: 0.5, y: ~0.06 }`).
- Character faces **right** in the sheet; the engine mirrors for left.
- Suggested frame counts / fps: idle 4@6, walk 6@10, jump 2@8, fall 2@8, interact 4@10, celebrate 6@10, incorrect 6@10.

Manifest (`manifest.json`):

```json
{
  "id": "hero",
  "image": "sheet.png",
  "frameWidth": 256,
  "frameHeight": 256,
  "pivot": { "x": 0.5, "y": 0.06 },
  "worldHeight": 96,
  "label": "",
  "animations": {
    "idle":      { "row": 0, "frames": 4, "fps": 6,  "loop": true },
    "walk":      { "row": 1, "frames": 6, "fps": 10, "loop": true },
    "jump":      { "row": 2, "frames": 2, "fps": 8,  "loop": false },
    "fall":      { "row": 3, "frames": 2, "fps": 8,  "loop": true },
    "interact":  { "row": 4, "frames": 4, "fps": 10, "loop": false },
    "celebrate": { "row": 5, "frames": 6, "fps": 10, "loop": false },
    "incorrect": { "row": 6, "frames": 6, "fps": 10, "loop": false }
  }
}
```

`worldHeight` is the height in world units of one full frame (not the visible body); keep characters
≈ 96 units of visible body. `label`, if set, is drawn above the character (the placeholder uses `PLACEHOLDER`).

### Replacing the placeholder protagonist

1. Put `sheet.png` + `manifest.json` in `public/assets/characters/hero/`.
2. In `src/character/heroManifest.ts`, switch `HERO_SOURCE` from `'placeholder'` to `'/assets/characters/hero/manifest.json'`.
3. Run the game, press `?debug=1` hotkeys 1–7 to check every state. No controller changes are needed.

## 4. Environment art

- Paint at **2× the on-screen size** (camera height 540 units → paint layers at 1080 px tall).
- Tileable ground strips: width a power of two (512/1024), seamless left/right.
- Far layers: lower contrast, hazier (mix toward `skyLight`), no outlines.
- Export PNG; large opaque backgrounds may be WebP/JPG.

## 5. UI and icons

- Icons as SVG, 24-unit grid, 2px `ink` stroke, rounded caps/joins, palette fills.
- No raster text in images (text must be translatable).

## 6. Audio

- SFX: OGG + MP3 fallback, normalized to −14 LUFS, < 2 s.
- Voice clips per target language: native speakers, `audio/voice/<lang>/<itemId>.mp3`.
- Audio is always optional for gameplay.

## 7. Fonts

- Fredoka (SIL OFL) via `@fontsource/fredoka`.
- Traditional Chinese falls back to system fonts (PingFang TC / Microsoft JhengHei / Noto Sans TC).

## 8. Budgets

Textures ≤ 2048 × 2048; one character sheet ≤ 2048 × 2048; per-map texture memory ≤ 64 MB; compress
large PNGs before committing.
