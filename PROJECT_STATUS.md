# Project Status — Lingua Quest

_Last updated: 2026-11-05_

## TL;DR

- **Phase:** 1 (Foundations & movement prototype). **Feature-complete.** The one step left is a hands-on check on a real phone (see "Before calling Phase 1 done").
- **Build:** ✅ `npm run build` passes (strict TypeScript + Vite).
- **Playable:** walk, jump, one-way platforms, drop-through, signpost and gate interactions, emotes, settings,
  save/restore, keyboard controls, and landscape touch controls with multi-touch.
- **Screenshots:** `docs/screenshots/phase-1/` (desktop, landscape mobile, portrait, all 7 animation states)
  plus an art-bible review in its README.
- **Next:** Phase 2 (polished village + NPCs + dialogue). See `docs/ROADMAP.md`.

## Resume on another computer

```bash
git clone https://github.com/Jiahuichang/Lanburger.git
cd Lanburger
npm install
npm run dev          # http://localhost:5173
```

Requirements: Node 20.19+ or 22.12+ (required by Vite 8; developed on Node 24.11, npm 11.6).

Then in Claude Code:

> Read CLAUDE.md, PROJECT_STATUS.md and docs/ROADMAP.md. Check Phase 1 on a phone, then start Phase 2.

Useful URLs: `/?touch=1` (force touch controls), `/?reset=1` (wipe the save), `/?debug=1` (collision boxes and
animation hotkeys 1–7; also exposes `window.lq`).

## Automated play-test (optional)

`npm run playtest`, with `npm run dev` running in another terminal, drives the real game in headless **Google Chrome**
and rewrites `docs/screenshots/phase-1/`. It runs 29 checks covering movement, jumps, platforms, interactions, save,
languages, all animation states, multi-touch and the portrait overlay.

- It needs Google Chrome installed (or `CHROME_PATH=...`), plus permission to launch it. Uses `playwright-core`,
  which downloads no browser.
- **Optional.** If your computer can't launch Chrome (no permission), skip it. Test by hand in a browser instead:
  play on desktop, then use DevTools device mode at 812×375 with `?touch=1`.
- Last results (2026-11-05): one full run passed **29/29**. A later run, made right after a file change, failed the first
  5 desktop checks: the first frame stalled while headless Chrome compiled shaders, and the other 24 passed.
  I fixed it in two ways: the game now pre-compiles shaders during the splash (`renderer.compile` in
  `WorldScene.enter`), and the script waits until the game is actually running. **These two fixes haven't been
  re-run with the play-test yet**, because the run was stopped (no permission on that computer).

## Before calling Phase 1 done

1. On a real phone in landscape, open the dev server URL. Vite prints a "Network" address; the phone must be on the
   same Wi-Fi. Check: joystick + Jump at the same time, Interact near the sign, text readability, safe areas on a
   notched phone.
2. Optional: run `npm run playtest` once on a computer that allows it, to confirm the shader pre-compile fix.
3. Then mark Phase 1 ✅ in `docs/ROADMAP.md`.

## What exists

| Module | Files | Notes |
| ------ | ----- | ----- |
| Art bible in code | `src/art/*` | Tokens → CSS vars, Canvas2D painter (outer-silhouette ink, cel shading, grain) |
| Asset pipeline | `src/assets/AssetRegistry.ts`, `proceduralArt.ts` | All Phase-1 art is painted at runtime from tokens. `assets.override(key, url)` swaps in a PNG later |
| Core engine | `src/core/*` | Fixed-step loop, scene manager with cream fade + splash, event bus, `Game.ts` |
| RPG world | `src/world/*` | `WorldScene`, 7-layer parallax, AABB physics + one-way platforms, pollen/leaf particles, Mossbrook map (3600 units wide) |
| Character | `src/character/*` | Manifest-driven `CharacterView`, `PlayerController` (coyote time, jump buffer, variable jump, drop-through), generated PLACEHOLDER sheet |
| Input | `src/input/*` | Keyboard + floating joystick and Jump/Talk/Emote buttons (pointer events, multi-touch, safe areas) |
| UI | `src/ui/*` | HUD (level/XP/energy/acorns/target language), world prompt + speech bubble, settings panel, rotate overlay |
| i18n | `src/i18n/*` | UI strings in en / es / de / fr / zh-TW |
| Save | `src/save/*` | v1 schema, migration, autosave (5 s / tab hidden), energy regen, position restore |
| Contracts only | `src/learning/`, `src/npc/`, `src/minigames/` `types.ts` | Implementation in Phases 2–6 |
| Tooling | `scripts/playtest.mjs`, `.claude/launch.json` | Optional headless play-test; dev-server config for the Claude desktop app |

## Known issues / follow-ups

- The production JS bundle is about 610 kB (159 kB gzipped), mostly Three.js. That's fine for now. Consider code-splitting mini-games later.
- The `typescript` dependency is **7.0.2** (the native compiler). Pin `typescript@5` if any tool chokes on it.
- On compact phones (height ≤ 460px), the desktop "placeholder character" notice is hidden. The in-world PLACEHOLDER tag still labels the character.
- The interact button says "Talk" even when nothing is nearby. Phase 2 (NPCs) should revisit the contextual labels.
- The stump (x≈1000) must be jumped over. That's intended, but there's no visual hint yet.

## Decisions made (don't revisit without reason)

- Environment art and the placeholder are **painted at runtime** with Canvas2D, using palette tokens only.
- World view height is fixed at **540 units**. A character's body is about 96 units (frame `worldHeight` 128).
- Every parallax layer `Group` carries its layer's `renderOrder`. Three.js sorts by the nearest Group first, so this is required for correct depth.
- Incorrect-answer feedback is **warm orange** (`gentleWrong`), never red.
- Movement feel lives in `PlayerController.TUNING` (run 270, jump 830, gravity 2300, coyote 0.1 s, buffer 0.12 s). A held jump peaks at about 142 units, so every platform is ≤ 122 units above the one below it.
- Place names: Kingdom of Verdalia, Mossbrook Village, Whispering Grove (Snake), The Copper Kettle (Cooking), Acorn Speedway (Kart).
