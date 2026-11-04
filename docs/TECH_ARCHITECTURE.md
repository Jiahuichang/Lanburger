# Technical Architecture — Lingua Quest

## 1. Stack

- **Three.js** (WebGL renderer, `OrthographicCamera` for side-scrolling maps)
- **TypeScript** (strict)
- **Vite** (dev server, build)
- HTML/CSS overlay for all UI and touch controls
- `localStorage` for progress (behind `SaveSystem`, so it can be swapped later)

## 2. Module map

```
src/
  main.ts                 Boot: tokens → CSS vars, save, input, renderer, first scene
  core/                   Core Engine
    Game.ts               Owns renderer, loop, scene manager, services
    GameLoop.ts           Fixed-step update (60 Hz) + per-frame render
    SceneManager.ts       Scene stack, fade transitions, return points
    Scene.ts              Scene interface (enter/exit/update/render/resize)
    EventBus.ts           Typed pub/sub between modules
    Services.ts           Service locator type passed to scenes
  art/                    Art bible in code
    tokens.ts             Palette, radii, shadows, fonts, layer table (single source of truth)
    cssVars.ts            Writes tokens to :root CSS variables
    painter.ts            Canvas2D "hand-painted" drawing helpers (wobbly ink lines, cel shading, grain)
  assets/                 Asset Pipeline
    AssetRegistry.ts      Keyed, cached textures (procedural or loaded from /public/assets)
    proceduralArt.ts      Phase-1 environment art painted at runtime with painter.ts
  character/              Character System
    types.ts              AnimState, CharacterSpriteManifest
    CharacterView.ts      Renders any manifest (sprite sheet → animated quad). No gameplay logic.
    placeholderCharacter.ts  Generates the labeled PLACEHOLDER sprite sheet + manifest
    PlayerController.ts   Movement/physics/state machine. Knows nothing about art.
  world/                  RPG World
    maps/types.ts         MapDefinition (size, platforms, props, portals, spawn)
    maps/mossbrook.ts     First playable map
    Physics.ts            AABB vs. solid ground + one-way platforms
    ParallaxBackground.ts Builds parallax layers from the art-bible layer table
    Particles.ts          Ambient pollen / leaves
    WorldScene.ts         Generic side-scrolling map scene
  input/                  Input System
    actions.ts            Action names + InputState snapshot
    InputManager.ts       Merges keyboard + touch into one snapshot per frame
    KeyboardSource.ts
    TouchControls.ts      Joystick + action buttons (multi-touch, pointer events)
  ui/                     Shared UI
    styles.css            Components built only from token CSS variables
    Hud.ts                Player badge, XP, energy
    Prompt.ts             Interaction prompt / speech bubble
    SettingsPanel.ts      UI language / target language
    RotateOverlay.ts      Portrait-mode "rotate your device"
  i18n/                   UI strings per UI language (NOT learning content)
  save/                   Progress & Save System
    schema.ts             SaveData type + defaults + SAVE_VERSION
    SaveSystem.ts         Load / migrate / autosave
  learning/               Learning Engine           (Phase 3 — types only in Phase 1)
  npc/                    NPC & Quest System        (Phase 2–3 — types only in Phase 1)
  minigames/              Mini-game Framework + games (Phase 4–6 — interface only in Phase 1)
```

Dependency direction (no cycles): `core ← world/minigames ← main`. `art`, `input`, `save`, `i18n`,
`learning` are leaf services. `character` depends on `art` + `assets` only. UI depends on `art` tokens and
`i18n`, never on Three.js.

## 3. Rendering

- One `WebGLRenderer`, pixel ratio capped at 2, `outputColorSpace = SRGB`.
- **World units**: the camera always shows **540 units of height**; width follows the aspect ratio.
  Landscape phones therefore show more world sideways, never less vertically.
- All materials are unlit (`MeshBasicMaterial`) — lighting is painted into textures per the art bible;
  glows use additive blending.
- Draw order is explicit: each layer has a z and `renderOrder` from `tokens.layers`.
- Parallax: layer `x = cameraX × (1 − factor)`; the camera follows the player with smoothing and
  look-ahead, clamped to map bounds.

## 4. Game loop

`GameLoop` runs `update(dt = 1/60)` in a fixed-step accumulator (max 5 steps/frame to avoid spirals)
then `render(alpha)` once per animation frame. Input is sampled once per frame and shared by all steps.

## 5. Scenes

```ts
interface Scene {
  readonly id: string;
  enter(ctx: SceneContext): void | Promise<void>;
  exit(): void;
  update(dt: number): void;
  render(alpha: number): void;
  resize(w: number, h: number): void;
}
```

`SceneManager.goTo(id, params)` fades out, exits the old scene, enters the new one, fades in.
`SceneManager.pushMiniGame(id, returnPoint)` / `returnFromMiniGame(result)` implement mini-game entry/return.

## 6. Character system (art/logic separation)

```
PlayerController (physics, state machine)  ──AnimState + facing──▶  CharacterView (sprite sheet)
                                                                         ▲
                                     CharacterSpriteManifest (PNG + frames per state)
```

- `CharacterSpriteManifest` describes a sprite sheet: frame size, pivot, world height, and a row per
  `AnimState` with frame count, fps and loop flag.
- The Phase-1 placeholder sheet is **generated** at runtime in the same manifest format, so swapping in
  the final protagonist means adding a PNG + manifest — no gameplay changes.

## 7. Physics

Simple and deterministic: gravity, max fall speed, coyote time (0.1 s), jump buffering (0.12 s), variable
jump height (release early → lower jump). Collisions: solid ground segments + **one-way platforms**
(only collide when falling from above; ↓ + Jump drops through). Map bounds are soft walls.

## 8. Input

`InputManager` produces one `InputState` per frame:
`{ moveX, moveY, jumpPressed, jumpHeld, interactPressed, actionPressed, menuPressed }`.
Keyboard and touch write into the same state, so gameplay never knows the device. Touch controls are
pointer-event based (true multi-touch via `pointerId`), sit inside `env(safe-area-inset-*)`, and appear
on coarse-pointer devices or with `?touch=1`.

## 9. Save

```ts
interface SaveData {
  version: number;
  profile: { name; uiLanguage; targetLanguage; createdAt };
  location: { mapId; x; y; facing };
  stats: { level; xp; energy; energyUpdatedAt; acorns };
  inventory: Record<itemId, count>;
  quests: Record<questId, QuestProgress>;
  vocabulary: Record<itemId, MasteryRecord>;
  settings: { musicVolume; sfxVolume; reducedMotion };
}
```

Stored under `linguaquest.save`. `SaveSystem.load()` validates, migrates by `version`, and falls back
to defaults on corrupt data (never crashes). Autosave every 5 s while dirty, on scene change, and on
`visibilitychange → hidden`.

## 10. Mini-game framework (Phase 4+)

See `MINIGAME_DESIGN.md`. Each mini-game implements `MiniGame` (a `Scene` plus `MiniGameConfig` in and
`MiniGameResult` out). It may use its own camera (top-down for Snake, chase/top-down for Kart, fixed for
Cooking) but must use shared tokens, UI components, input and learning engine.

## 11. Performance targets

60 fps on a mid-range phone; ≤ 150 draw calls per map; textures ≤ 2048 px; total initial download
≤ 3 MB (Phase 1 ≈ Three.js + code + one font).

## 12. Debug flags

`?touch=1` force touch UI · `?reset=1` wipe save · `?debug=1` collision boxes + animation hotkeys 1–7.
