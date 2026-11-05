# Project Status — Lanburger

_Last updated: 2026-11-05_

## TL;DR

- **The game was redesigned** (approved 2026-11-05). It is now **Lanburger**, a story-driven, top-down, pixel-art
  language RPG set in **Hello Town**. Learning languages: en, es, de, ja, zh-TW. The UI is English only. The plan is in
  `docs/IMPLEMENTATION_PLAN.md`, and all 8 decisions in its §7 use the recommended option.
- **Phase:** R1 (top-down foundations) is **done, pending a real-phone check**. Next: **R2, the art vertical slice**,
  which ends at an art review with the user.
- **Build:** ✅ `npm run build` passes (strict TypeScript + Vite).
- **Playable now:**
  - Walk around a greybox Hello Town in eight directions; Shift or pushing the stick to its rim runs.
  - Collision against buildings, trees, the stream, the forest edge and props, with corner sliding.
  - Cross the bridge.
  - Read signs and building doors, and inspect the 5 Word Lanterns (E / Talk). Emote with Q.
  - Settings: target language and lesson-explanation language.
  - Save v2 with migration from v1.
  - Desktop keyboard and landscape touch controls.
- **Screenshots:** `docs/screenshots/r1/`, with the art review in its README.

## Resume on another computer

```bash
git clone https://github.com/Jiahuichang/Lanburger.git
cd Lanburger
npm install
npm run dev          # http://localhost:5173
```

Needs Node 20.19+ or 22.12+ (required by Vite 8).

Then in Claude Code:

> Read CLAUDE.md, PROJECT_STATUS.md and docs/IMPLEMENTATION_PLAN.md. Continue with R2.

Useful URLs:
- `/?touch=1`: force the touch controls.
- `/?reset=1`: wipe the save.
- `/?debug=1`: show collision boxes and the animation hotkeys 1–6.
- `/?test`: expose `window.lq`.

## Before calling R1 done

1. On a real phone held in landscape, open the "Network" URL that Vite prints (the phone must be on the same Wi-Fi).
   - The joystick walks the player, and pushing it to the rim runs.
   - Talk works near a sign or a door.
   - Text is readable.
   - Safe areas look right on a notched phone.
   - The pixels look crisp, not blurry.
2. Optional, and only with the user's OK because it needs permission to launch Chrome: run `npm run playtest`.
   The script was rewritten for top-down play (about 18 checks) but **has not been run yet**.

## R2: what comes next (see IMPLEMENTATION_PLAN §5)

- A real Hello Town tileset with transition edges between grass, path and plaza, plus animated water.
- More detailed buildings with text signboards, and window light pools.
- The final Lanburger sprite: four directions, expressions, and topping layers for burger growth.
- One sample NPC with six-expression portraits.
- HUD polish.
- Then an **art review**: compare side by side with `references/lanburger-town.png` before producing art at scale.
- **Still missing from the user:** NPC style references and friend photos (they go in `references/private/`, which is
  git-ignored), plus more village references.

## What exists (R1)

| Module | Files | Notes |
| ------ | ----- | ----- |
| Art tokens | `src/art/tokens.ts`, `cssVars.ts` | Four-step color ramps sampled from the reference, UI palette, `duskTint`, pixel metrics, depth bands |
| Pixel painter | `src/art/pixel.ts` | Grid-exact `PixelCanvas`: shaded ellipses with Bayer dithering, auto-outline, nearest-filter textures |
| Greybox art | `src/art/greybox/*` | Tiles, props, buildings and the Lanburger sheet, all painted at runtime from ramps. R2 replaces them via `assets.override()` or new painters |
| Rendering | `src/render/*` | `PixelRenderer` (low-res target, integer zoom, sub-pixel camera shift), `TileMapView` (one merged ground mesh plus depth-sorted sprites), `ActorView` (manifest, four facings, flips, foot shadow), `LightLayer` (dusk multiply tint and additive light pools) |
| World logic | `src/world/*` | `MapSource` data format, `TileMap` (collision grid, solids, interactables, lights, spawns), `TopDownMover` (eight-direction movement, axis-separated collision, corner slide), `WorldScene` |
| Content | `src/content/maps/*` | Hello Town (80×60 tiles): 6 buildings, plaza and fountain, 5 Word Lanterns, stream and bridge, signs, about 90 props |
| Character | `src/character/*` | Manifest types (`Facing`, `RowRef`), `hero.ts` (the only place that knows the hero's art) |
| Input | `src/input/*` | Keyboard (WASD/arrows, Shift run, E/Enter/Space talk, Q emote, Esc settings) and touch (floating joystick with radial dead zone, Talk and Emote buttons, multi-touch) |
| UI | `src/ui/*` | Dark-panel HUD (portrait drawn from the sprite sheet, Lv, Energy/XP), menu buttons (Quests, Bag, Learn and Collection say "coming soon"), location and learning chips, prompt and speech bubble, settings, toast, rotate screen |
| Save | `src/save/*` | v2 schema (burger, lanterns, topic mastery, flags…). v1 → v2 migration: profile, stats and settings carry over, the position resets to the Hello Town spawn, and French learners are asked to pick again |
| Contracts | `src/learning`, `src/npc`, `src/minigames` | Types updated for the redesign; the systems arrive in R3–R9 |

## Known issues / follow-ups

- Greybox art gaps (path edges, static water, signboards without text): see `docs/screenshots/r1/README.md`. All of these are R2 work.
- The R1 screenshots were captured from the Claude app's built-in browser pane. That pane was hidden during testing,
  so frames were stepped from a script and the images are 800-wide JPEGs.
- The player's position is saved once per second, so closing the tab can lose up to 1 s of walking.
- `AGENTS.md` (instructions for Codex) was added outside Claude and still describes the old side-scroller. Update or delete it.
- The JS bundle is about 598 kB (156 kB gzipped), mostly Three.js.
- The `typescript` dependency is 7.0.2 (the native compiler). Pin `typescript@5` if a tool chokes on it.
- The save key is still `linguaquest.save`, kept on purpose so v1 saves migrate.

## Decisions made (don't revisit without reason)

- Top-down 3/4 view with 16 px tiles. The native view is about 360 art pixels tall, scaled by an integer zoom with nearest
  sampling (`PixelRenderer`).
- Map coordinates are pixels with y pointing down; Three.js uses y up, so a map point renders at (x, −y).
- Depth sorting uses the foot line (`z = actorBase + footY × 0.01`). Sprites are alpha-tested and depth-written, so draw
  order never matters.
- Dusk is the default mood: a multiplied `duskTint` over the map plus additive, dithered light pools.
- Lanburger is a burger creature (decision #1). R1 is the small "Slider" stage.
- Wrong-answer feedback is warm orange (`gentleWrong`), never red.
- Old docs (`ART_BIBLE`, `LEARNING_DESIGN`, `MINIGAME_DESIGN`, `ROADMAP`, `TECH_ARCHITECTURE`, `ASSET_GUIDELINES`) are history only.
