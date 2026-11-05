# Lanburger — Instructions for Claude Code

Lanburger is a browser-based, story-driven **top-down pixel-art RPG** for learning languages, built with
**Three.js + TypeScript + Vite**. The player is Lanburger, an original burger hero, exploring **Hello Town**
(the first village), meeting NPCs and learning through contextual quests. Three reusable mini-games
(Language Cooking, Vocabulary Snake, Language Kart Racing) come later.

Communicate with the user in **Traditional Chinese (Taiwan)**. All in-game UI text is **English**.

## Read these before you change anything

| If you touch…                                      | Read first                                                     |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Anything (always)                                  | `PROJECT_STATUS.md` — where work stopped, known issues          |
| Anything (always)                                  | `docs/IMPLEMENTATION_PLAN.md` — current phase (R1…), scope, decisions |
| Gameplay, story, NPCs, controls                    | `docs/GAME_DESIGN.md`                                          |
| Any visual: colors, sprites, tiles, UI, lighting   | `docs/ART_DIRECTION.md` + `src/art/tokens.ts`                  |
| Maps, buildings, unlock order                      | `docs/WORLD_MAP.md`                                            |
| Lessons, questions, review, languages              | `docs/LEARNING_SYSTEM.md`                                      |
| Quests, XP, energy, mastery, burger growth, save   | `docs/PROGRESSION_SYSTEM.md`                                   |
| Cooking / Snake / Kart or the mini-game framework  | `docs/MINIGAMES.md`                                            |

The older docs (`ART_BIBLE`, `LEARNING_DESIGN`, `MINIGAME_DESIGN`, `ROADMAP`, `TECH_ARCHITECTURE`,
`ASSET_GUIDELINES`) describe the retired Phase 1 side-scroller. Use them only for history.

## Hard rules

1. **Stack is fixed.** Three.js, TypeScript, Vite. No Phaser, Unity, Godot, React or React Three Fiber.
2. **One art direction.** Every color, radius and font comes from `src/art/tokens.ts`, which also generates the
   CSS variables. Never hard-code a hex value in a scene, mini-game or UI file. Pixel art stays on the grid:
   `NearestFilter`, integer positions, no smooth scaling.
3. **Characters enter only through manifests.** Lanburger and every NPC are drawn from a `CharacterSpriteManifest`
   (`src/character/hero.ts`, `src/character/npcs.ts`). Gameplay code never imports a specific character's art.
   New human NPCs are a `ChibiSpec` character card in `src/art/painted/characters.ts`, not new drawing code.
4. **Rendering is separate from logic.** Controllers and systems (movement, collision, quests, learning) never
   touch Three.js meshes. Views never decide gameplay.
5. **No permanent blockers.** Wrong answers may cost energy, but there is always a free way forward
   (`docs/PROGRESSION_SYSTEM.md` §3).
6. **UI language ≠ learning content.** UI strings live in `src/i18n/` (English only for now). Learning content and
   explanations live in content packs.
7. **Data-driven content.** Maps, NPCs, quests and lessons are data in `src/content/`. Reusable systems contain
   nothing village-specific.
8. **Stay in phase.** Only build what `docs/IMPLEMENTATION_PLAN.md` §5 lists for the current phase.
9. **Save compatibility.** Changing the save shape means bumping `SAVE_VERSION` and adding a migration in
   `src/save/SaveSystem.ts`.
10. **Friend photos are private.** They live in `references/private/` (git-ignored) and are never committed or
    shipped. Only the derived pixel sprites and text character cards go into the repo.

## Workflow across computers

The user works from several computers. **GitHub `main` (https://github.com/Jiahuichang/Lanburger) is the source of truth.**

- At the start of a session: `git pull` on `main`.
- At the end of a work session: update `PROJECT_STATUS.md`, commit, and push to `main`, so the next computer can pull
  and continue. Never force-push or overwrite remote work. If the remote has moved, pull and merge first.
- `AGENTS.md` only points other agents to this file. Keep the rules here, not there.
- The repo is **public**. Never commit friend photos, secrets or anything under `references/private/` (only its README is tracked).

## Commands

```bash
npm install        # once
npm run dev        # dev server on http://localhost:5173
npm run build      # type-check (tsc) + production build — must pass before a phase is done
npm run preview    # serve the production build
npm run playtest   # OPTIONAL headless-Chrome play-test (needs permission to launch Chrome)
```

Every push to `main` deploys the game to https://jiahuichang.github.io/Lanburger/ (GitHub Pages, `.github/workflows/deploy-pages.yml`).
Vite's `base` comes from `BASE_PATH`; keep asset URLs relative to it (no hard-coded `/…` paths in code).

Never run `npm run playtest` without the user's OK: it launches Chrome, and some of the user's computers don't allow it.

Debug URL flags: `?touch=1` forces touch controls, `?reset=1` clears the save, `?debug=1` shows collision boxes and
the animation hotkeys (1–6), `?test` exposes `window.lq` for scripts, `?gallery=1` opens the art gallery,
`?stage=deluxe&toppings=lettuce,cheese` previews Lanburger's growth without touching the save.

## Quality gate for every phase

A phase is done only when:
- `npm run build` passes.
- The game plays on desktop (keyboard) and on a landscape phone (touch).
- Nothing breaks `docs/ART_DIRECTION.md` §10.
- Scene transitions work, nothing can block progression, and earlier features still work.
- Desktop and landscape-mobile screenshots are saved in `docs/screenshots/<phase>/` and reviewed.
