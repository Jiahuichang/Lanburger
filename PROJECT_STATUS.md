# Project Status — Lanburger

_Last updated: 2026-11-05_

## TL;DR

- **Game:** Lanburger, a story-driven, top-down, pixel-art language RPG in **Hello Town**. The plan is
  `docs/IMPLEMENTATION_PLAN.md` (all decisions approved).
- **Phase:** R1 (top-down foundations) is done. **R2 (art vertical slice) is done and waiting for the user's art review**
  (`docs/screenshots/r2/README.md`). Next: **R3, NPCs, dialogue and building interiors**.
- **Build:** ✅ `npm run build` passes. Every push to `main` deploys to GitHub Pages.
- **New in R2:**
  - Tile transitions (grass edges, rounded corners, river banks, forest edges, bridge rails), animated water,
    English signboards in a pixel font, window light.
  - Final Lanburger: 4 growth stages and 5 topping layers, walk/talk/celebrate/oops/learn, 6 expression portraits.
  - Mayor Bun, the first NPC: a shared chibi painter driven by character cards, 6 portraits, a quest balloon, and she
    faces the player and says a line.
  - `?gallery=1` art gallery and the `?stage=` / `?toppings=` growth preview.
- **NPCs (2026-11-05):**
  - Friends: Jeremy (Racing Garage, center-parted hair), Jonas (Travel Station) and Summy (General Store) are in town.
    Maggie is drawn (smiling eyes, blue skirt) but her role is still undecided; the suggestion is Language Academy teacher.
  - Original townsfolk with personality-inspired cards: Remy, Theo and Ash in Town Square, Noah with his dog Mochi by the stream.
  - Cards: `docs/CHARACTERS.md`. Pets: `src/art/painted/pets.ts` (talk to Mochi too).

## Play online (any phone, no install)

**https://jiahuichang.github.io/Lanburger/** is rebuilt automatically on every push to `main`
(`.github/workflows/deploy-pages.yml`, about 1–2 minutes). Add `?touch=1` or `?reset=1` as usual.
One-time setup: repo Settings → Pages → Source: **GitHub Actions**.

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

1. On a real phone held in landscape, open https://jiahuichang.github.io/Lanburger/ (or the Vite "Network" URL on the same Wi-Fi).
   - The joystick walks the player, and pushing it to the rim runs.
   - Talk works near a sign or a door.
   - Text is readable.
   - Safe areas look right on a notched phone.
   - The pixels look crisp, not blurry.
2. Optional, and only with the user's OK because it needs permission to launch Chrome: run `npm run playtest`.
   The script was rewritten for top-down play (about 18 checks) but **has not been run yet**.

## R3: what comes next (see IMPLEMENTATION_PLAN §5)

- Apply the user's R2 art review feedback first.
- NPC system: idle wandering, facing the player, balloons (`!` quest, `?` turn in, `…` small talk).
- Dialogue system: portrait panel with six expressions, typewriter text, choices, a dialogue graph format in `src/content/`.
- Building entry: door → Language Academy interior map → back outside (scene transition, return spawn).
- Original NPCs: Ms. Sesame (Academy) and one townsperson. Friend NPCs wait for photos and an approved character card.
- **Still missing from the user:** NPC style references and friend photos (`references/private/`, git-ignored), and
  more village references.

## What exists (R1)

| Module | Files | Notes |
| ------ | ----- | ----- |
| Art tokens | `src/art/tokens.ts`, `cssVars.ts` | Four-step color ramps sampled from the reference, UI palette, `duskTint`, pixel metrics, depth bands |
| Pixel painter | `src/art/pixel.ts` | Grid-exact `PixelCanvas`: shaded ellipses with Bayer dithering, auto-outline, nearest-filter textures |
| Painted art | `src/art/painted/*` | Tiles and transition overlays, water frames, props, buildings with signboards, Lanburger (stages, toppings, portraits), the chibi NPC painter and character cards. `src/art/pixelFont.ts` is a 5×7 sign font |
| Rendering | `src/render/*` | `PixelRenderer` (low-res target, integer zoom, sub-pixel camera shift), `TileMapView` (one merged ground mesh plus depth-sorted sprites), `ActorView` (manifest, four facings, flips, foot shadow), `LightLayer` (dusk multiply tint and additive light pools) |
| World logic | `src/world/*` | `MapSource` data format, `TileMap` (collision grid, solids, interactables, lights, spawns), `TopDownMover` (eight-direction movement, axis-separated collision, corner slide), `WorldScene` |
| Content | `src/content/maps/*` | Hello Town (80×60 tiles): 6 buildings, plaza and fountain, 5 Word Lanterns, stream and bridge, signs, about 90 props |
| Character | `src/character/*` | Manifest types (`Facing`, `RowRef`, `Expression`, portraits, paper-doll layers), `hero.ts` and `npcs.ts` (the only places that know character art) |
| NPCs | `src/content/npcs/*`, `src/npc/types.ts` | NPC definitions (tile position, sprite/portrait key, greeting, quest hooks). Spawned by `WorldScene` |
| Dev tools | `src/dev/Gallery.ts` | `?gallery=1` art review page |
| Input | `src/input/*` | Keyboard (WASD/arrows, Shift run, E/Enter/Space talk, Q emote, Esc settings) and touch (floating joystick with radial dead zone, Talk and Emote buttons, multi-touch) |
| UI | `src/ui/*` | Dark-panel HUD (portrait drawn from the sprite sheet, Lv, Energy/XP), menu buttons (Quests, Bag, Learn and Collection say "coming soon"), location and learning chips, prompt and speech bubble, settings, toast, rotate screen |
| Save | `src/save/*` | v2 schema (burger, lanterns, topic mastery, flags…). v1 → v2 migration: profile, stats and settings carry over, the position resets to the Hello Town spawn, and French learners are asked to pick again |
| Contracts | `src/learning`, `src/npc`, `src/minigames` | Types updated for the redesign; the systems arrive in R3–R9 |

## Known issues / follow-ups

- Greybox art gaps (path edges, static water, signboards without text): see `docs/screenshots/r1/README.md`. All of these are R2 work.
- The R1 screenshots were captured from the Claude app's built-in browser pane. That pane was hidden during testing,
  so frames were stepped from a script and the images are 800-wide JPEGs.
- The player's position is saved once per second, so closing the tab can lose up to 1 s of walking.
- GitHub Pages deploy: on Linux, `npm ci` rejects the lockfile, because rolldown lists optional bindings for platforms
  (s390x, openharmony) that npm records without a version. The workflow falls back to `npm install` and reports the
  reason as a public annotation. Deploys work (first success 2026-11-05). Re-check after the next Vite/rolldown update.
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
