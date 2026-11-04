# Lingua Quest — Instructions for Claude Code

Lingua Quest is a browser-based, side-scrolling fantasy RPG for learning languages. It is built with
**Three.js + TypeScript + Vite**. One cozy, hand-drawn chibi world holds the RPG and its three
integrated mini-games (Vocabulary Snake, Cooking Challenge, Language Kart Racing).

## Read these before you change anything

You MUST read the documents relevant to your change before you modify code or assets:

| If you touch…                                   | Read first                                                     |
| ----------------------------------------------- | -------------------------------------------------------------- |
| Anything (always)                               | `PROJECT_STATUS.md` — where work stopped, known issues, next steps |
| Anything (always)                               | `docs/ROADMAP.md` — current phase and its scope                |
| Gameplay, world, quests, NPCs, economy          | `docs/GAME_DESIGN.md`                                          |
| Any visual: colors, sprites, UI, VFX, layout    | `docs/ART_BIBLE.md` + `src/art/tokens.ts`                      |
| Code structure, modules, scenes, save, input    | `docs/TECH_ARCHITECTURE.md`                                    |
| Questions, lessons, review, languages, i18n     | `docs/LEARNING_DESIGN.md`                                      |
| Snake / Cooking / Kart or the mini-game framework | `docs/MINIGAME_DESIGN.md`                                    |
| Adding or replacing art, audio, fonts, manifests | `docs/ASSET_GUIDELINES.md`                                    |

## Hard rules

1. **Stack is fixed.** Three.js, TypeScript, Vite. Do not add Phaser, Unity, Godot, React, or React Three Fiber.
2. **One art bible.** Every color, radius, font and shadow comes from `src/art/tokens.ts` (it also
   generates the CSS variables). Never hard-code a hex value in a scene, mini-game or UI file.
   No generic demo graphics, realistic 3D assets, or a second UI style.
3. **The protagonist is a placeholder.** Do not design a final protagonist. Character art enters only
   through a `CharacterSpriteManifest` (see `src/character/`). Gameplay code must never import a
   specific character's art.
4. **Rendering is separate from logic.** Controllers (physics, AI, quest logic) never touch Three.js
   meshes directly; views never decide gameplay.
5. **No permanent blockers.** Energy, failed answers or lost mini-games may slow the player down but must
   always leave a free path forward (see `docs/GAME_DESIGN.md` → Energy).
6. **UI language ≠ target language.** Never mix them. UI strings live in `src/i18n/`; learning content
   lives in the learning content packs.
7. **Stay in phase.** Only build what `docs/ROADMAP.md` lists for the current phase. Do not start a later
   mini-game early.
8. **Save compatibility.** Changing the save shape means bumping `SAVE_VERSION` and adding a migration
   in `src/save/SaveSystem.ts`.

## Commands

```bash
npm install        # once
npm run dev        # dev server on http://localhost:5173
npm run build      # type-check (tsc) + production build — must pass before a phase is done
npm run preview    # serve the production build
```

Debug URL flags: `?touch=1` forces the mobile touch controls, `?reset=1` clears the save,
`?debug=1` shows collision boxes and the animation-state hotkeys (1–7).

## Quality gate for every phase

A phase is done only when: `npm run build` passes; the game is playable on desktop (keyboard) and in
landscape mobile (touch); no visual element breaks the art bible; scene transitions work; nothing can
block progression; earlier features still work; desktop and landscape-mobile screenshots are saved in
`docs/screenshots/phase-N/` and reviewed against `docs/ART_BIBLE.md`.
