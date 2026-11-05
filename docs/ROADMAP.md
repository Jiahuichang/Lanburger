# Roadmap — Lingua Quest

**Current phase: Phase 1 — feature-complete, pending a real-phone check.** Next: Phase 2. See `PROJECT_STATUS.md`.

Build one phase at a time. Each phase must pass the quality gate (bottom) before the next begins.

## Phase 1 — Foundations & movement prototype

- [x] Design docs: CLAUDE.md, GAME_DESIGN, ART_BIBLE, TECH_ARCHITECTURE, LEARNING_DESIGN, MINIGAME_DESIGN, ASSET_GUIDELINES, ROADMAP
- [x] Vite + TypeScript + Three.js scaffold, strict TS
- [x] Core engine: fixed-step loop, scene manager with fade transitions, event bus, `Game.ts`
- [x] Art tokens as single source of truth → CSS variables + canvas painter helpers
- [x] Parallax forest-village map (Mossbrook) with one-way platforms and painted procedural art
- [x] Placeholder protagonist (clearly labeled) via sprite-sheet manifest; states idle/walk/jump/fall/interact/celebrate/incorrect
- [x] Player controller: run, variable jump, coyote time, jump buffer, drop-through platforms
- [x] Input: keyboard + landscape touch (joystick + Jump/Interact/Action), multi-touch, safe areas
- [x] HUD shell (level, XP, energy), interaction prompt on the village signpost, settings (UI language / target language)
- [x] Save system v1 (position, profile, stats, settings) with autosave + migration hook
- [x] Interfaces only for learning, NPC/quest and mini-game modules
- [x] `index.html` + `main.ts` entry point; `npm run build` passes
- [x] Desktop + landscape-mobile screenshots in `docs/screenshots/phase-1/` (reviewed in its README)
- [ ] Hands-on check on a real phone in landscape (see `PROJECT_STATUS.md`)

## Phase 2 — Polished village & NPCs

- NPC system (manifest-driven NPC views, idle wander, facing the player)
- Dialogue system (branching graph, portrait panel, typewriter text, choices)
- 4 NPCs in Mossbrook (Elder Bramble, chef, mechanic, forest spirit) — art follows the art bible
- Village polish: more props, lighting pass, ambient sounds, map portals (door → interior stub)
- Inventory panel shell

## Phase 3 — Learning engine & first quest

- Learning engine: content packs, question runner, feedback/explanations, Leitner review queue
- Quest system (steps, state, rewards)
- Quest "First Words" end-to-end in all 5 target languages (native-speaker review)
- Word Journal (review screen)
- Energy rules incl. Practice Mode

## Phase 4 — Vocabulary Snake

- Mini-game framework (briefing → game → results → return point)
- Snake in Whispering Grove; integrated with quest + mastery

## Phase 5 — Cooking Challenge

- The Copper Kettle interior, order-comprehension gameplay, ingredients inventory

## Phase 6 — Language Kart Racing

- Acorn Speedway, question gates, power-ups, kart parts inventory

## Phase 7 — Polish, progression, retention

- Daily review streaks, cosmetic rewards, level-up ceremonies, music, VFX polish, onboarding,
  performance pass, accessibility pass

## Quality gate (every phase)

1. `npm run build` passes.
2. Playable on desktop (keyboard) and landscape mobile (touch).
3. No visual element outside the art bible.
4. No broken scene transitions.
5. No permanent progression blockers.
6. Previous features still work.
7. Desktop and landscape-mobile screenshots saved to `docs/screenshots/phase-N/` and reviewed against
   the art-bible checklist.
