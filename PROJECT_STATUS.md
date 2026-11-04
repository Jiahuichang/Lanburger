# Project Status — Lingua Quest

_Last updated: 2026-11-04 · Development paused mid-Phase 1 so work can continue on another computer._

## TL;DR

- **Phase:** 1 (Foundations & movement prototype). **In progress (about 60% done).**
- **Docs:** all complete (CLAUDE.md + 7 design docs).
- **Code:** engine core, input, save, i18n, the character system and physics are written. The village
  scene, procedural environment art, UI and entry point are **not written yet**.
- **Build:** ❌ `npm run build` fails right now, because two imported modules don't exist yet (see Known issues).
  This is expected at this point. It is not a regression.
- **Never run in a browser yet.** No screenshots yet.

## Resume on a new computer

```bash
git clone https://github.com/Jiahuichang/Lanburger.git
cd Lanburger
npm install
npx tsc --noEmit      # expect the 2 known errors below until Phase 1 is finished
```

Then in Claude Code, start with:

> Read CLAUDE.md, PROJECT_STATUS.md and docs/ROADMAP.md, then continue Phase 1 from "Remaining Phase 1 work".

Requirements: Node 20+ (developed on Node 24.11, npm 11.6).

## Completed

### Documentation
| File | Contents |
| ---- | -------- |
| `CLAUDE.md` | Rules for future Claude Code sessions, a doc-reading table, commands, the quality gate |
| `docs/GAME_DESIGN.md` | World (Verdalia / Mossbrook), loop, controls, XP, energy (never blocks), quests, save, first quest |
| `docs/ART_BIBLE.md` | Palette, line/shape/shading rules, chibi proportions, parallax layer table, UI, motion, forbidden list, review checklist |
| `docs/TECH_ARCHITECTURE.md` | Module map, rendering (540-unit ortho view), loop, scenes, character art/logic split, physics, input, save, mini-game framework |
| `docs/LEARNING_DESIGN.md` | 5 languages, Teach → Practice → Challenge → Feedback → Review, Question schema, Leitner SRS, feedback rules |
| `docs/MINIGAME_DESIGN.md` | Shared framework (config/result/return point), Snake, Cooking, Kart specs, consistency checklist |
| `docs/ASSET_GUIDELINES.md` | Licensing, folder layout, sprite-sheet + manifest format, steps to replace the placeholder |
| `docs/ROADMAP.md` | Phases 1–7 and the quality gate |

### Source (`src/`)
| Module | Files | State |
| ------ | ----- | ----- |
| Art bible in code | `art/tokens.ts`, `art/color.ts`, `art/cssVars.ts`, `art/painter.ts` | Done. Tokens → CSS vars; Canvas2D painter (wobbly ink shapes, cel shading, grain, textures) |
| Core engine | `core/EventBus.ts`, `GameLoop.ts`, `Scene.ts`, `SceneManager.ts`, `Services.ts` | Done, except `core/Game.ts` (not written) |
| Input | `input/actions.ts`, `KeyboardSource.ts`, `TouchControls.ts`, `InputManager.ts` | Done. Keyboard + multi-touch joystick and buttons. CSS for them not written yet |
| Save | `save/schema.ts`, `save/SaveSystem.ts` | Done. Versioned, migration hook, autosave, energy regen |
| i18n (UI language) | `i18n/index.ts` + `en/es/de/fr/zh-TW.ts` | Done for Phase 1 strings |
| Character system | `character/types.ts`, `CharacterView.ts`, `PlayerController.ts`, `placeholderCharacter.ts`, `heroManifest.ts` | Written, not yet tested in a browser. The placeholder mannequin is generated as a real sprite sheet + manifest (7 states) |
| Physics | `world/Physics.ts` | Done. Solids + one-way platforms + `surfaceBelow` for shadows |
| Contracts only | `learning/types.ts`, `npc/types.ts`, `minigames/types.ts` | Types only, as planned for Phase 1 |

Project config: `package.json` (three, @fontsource/fredoka, typescript, vite, @types/three), `tsconfig.json` (strict),
`vite.config.ts`, `.gitignore`.

## Remaining Phase 1 work (in order)

1. **`src/assets/proceduralArt.ts`**: painted environment art built with `art/painter.ts`. It must export
   `softShadowTexture()` (already imported by `CharacterView`). Planned painters: sky gradient, clouds,
   tileable hill bands, far tree line, big trees, cottages, giant mushroom, tileable ground strip, wooden
   one-way platforms, signpost, lantern post, fence, barrel, crate, flowers, grass tufts, ferns, bushes,
   rocks, bunting, the locked Whispering Grove gate, a glow sprite, a leaf, light rays.
2. **`src/assets/AssetRegistry.ts`**: keyed texture cache.
3. **`src/world/`**: `maps/types.ts`, `maps/mossbrook.ts` (about 3600 units wide; ground at y=0; a stump solid;
   about 6 one-way platforms; props; a signpost interactable; a locked east gate), `ParallaxBackground.ts`
   (layers from `tokens.layers`), `Particles.ts` (pollen as `THREE.Points`, about 10 falling leaves), `WorldScene.ts`
   (ortho camera with a 540-unit view height, smoothed follow and look-ahead clamped to the map, interpolation,
   interact/emote handling, `?debug=1` collision boxes + hotkeys 1–7, position autosave).
4. **`src/ui/`**: `UiRoot.ts` (imported by `core/Services.ts`), `styles.css` (token CSS vars only),
   `Hud.ts` (badge, level, XP bar, energy bar, target-language chip, settings button),
   `Prompt.ts` (world-anchored prompt + speech bubble), `SettingsPanel.ts` (UI language / target language,
   never equal), `RotateOverlay.ts` (portrait warning), and the fade overlay and splash.
5. **`src/core/Game.ts`** + **`src/main.ts`** + **`index.html`**: renderer (pixel ratio capped at 2, sRGB), loop wiring
   (`input.sample` → steps → `consumeEdges`), `await document.fonts.load('600 20px Fredoka')` before painting
   labels, `?touch=1` / `?reset=1` / `?debug=1` flags, `viewport-fit=cover` meta.
6. `npm run build` passes. Play-test on desktop and landscape mobile (812×375, `?touch=1`).
7. Save screenshots to `docs/screenshots/phase-1/` (desktop + landscape mobile). Run the ART_BIBLE §10 checklist.
8. Mark Phase 1 done in `docs/ROADMAP.md`.

## Known issues

- **Build fails (expected, Phase 1 unfinished):**
  - `src/character/CharacterView.ts` imports `softShadowTexture` from `../assets/proceduralArt`, which doesn't exist yet.
  - `src/core/Services.ts` imports `UiRoot` from `../ui/UiRoot`, which doesn't exist yet.
- No `index.html` / `main.ts` yet, so `npm run dev` shows nothing.
- `CharacterView`'s PLACEHOLDER tag and the "?" chest emblem draw with the Fredoka canvas font. `main.ts` must wait
  for the font before creating characters, or the tag falls back to a system font.
- The `?debug=1`, `?touch=1` and `?reset=1` flags are documented in CLAUDE.md but not wired up yet (step 5).
- The placeholder character's poses haven't been checked visually. Expect some tuning of limb angles and offsets.
- The `typescript` dependency resolved to **7.0.2** (the native compiler). If it causes trouble, pin `typescript@5`.

## Decisions made (don't revisit without reason)

- Environment art and the placeholder are **painted at runtime** with Canvas2D, using palette tokens only.
  Real PNGs replace them key by key later.
- World view height is fixed at **540 units**. A standard character's body is about **96 units** (frame `worldHeight` 128).
- Incorrect-answer feedback is **warm orange** (`gentleWrong`), never red.
- Movement feel lives in `PlayerController.TUNING` (run 270, jump 830, gravity 2300, coyote 0.1 s, buffer 0.12 s).
- Place names: Kingdom of Verdalia, Mossbrook Village, Whispering Grove (Snake), The Copper Kettle (Cooking),
  Acorn Speedway (Kart).
