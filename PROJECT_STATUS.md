# Project Status — Lanburger

_Last updated: 2026-11-08_

## TL;DR

- **Game:** Lanburger, a story-driven, top-down, pixel-art language RPG in **Hello Town**. The plan is
  `docs/IMPLEMENTATION_PLAN.md` (all decisions approved).
- **Phase:** R1–R5 are done. **The Hello Town vertical slice is complete**: the main quest "Welcome to Hello Town!"
  takes a new player from the Mayor through Maggie's Greetings lessons and a chat with Remy to lighting the first
  Word Lantern. That earns XP and levels, Lettuce, and opens the Burger Bistro.
- **Re-prioritized (2026-11-06):** before adding more village content, build a complete Spanish curriculum.
  R6A (planning, `docs/SPANISH_CURRICULUM.md`) is done: all 7 decisions answered.
- **R6B (2026-11-08): built, waiting for sign-off.** Spanish Greetings is now syllabus units 1 (Saludos) and 2
  (Presentarse): 6 lessons, new question types, several right answers, error-specific feedback, the player's
  Spanish forms (-o/-a), Remy (tú) and Mayor Bun (usted) practice chats, harder review over time, and story
  completion shown apart from mastery. The user chose to start R6B **without** the Airlearn reference screens;
  §6 of the curriculum is final for now and can be tuned when they arrive. Sign-off still needs: the Spanish
  teacher's review, and a real-phone check. Details below and in `docs/screenshots/r6b/README.md`.
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
    Maggie (smiling eyes, blue skirt) is the Language Academy teacher and leads the Greetings lesson in R4; she stands at the Academy door.
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

> Read CLAUDE.md, PROJECT_STATUS.md, docs/IMPLEMENTATION_PLAN.md and docs/SPANISH_CURRICULUM.md. R6B is built; help me sign it off (teacher review, real-phone check), then plan R6C.

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

## R6B: what was built (2026-11-08)

- **Content** (`src/content/learning/greetings/es-topic.ts`, `es.ts`): Spanish Greetings is a language-specific
  version of the Greetings topic (same id, so lanterns, quests and flags are unchanged). Unit 1 Saludos =
  lessons `greetings-1…3` (Hello & Goodbye; Morning to Night; How’s It Going?), unit 2 Presentarse =
  `greetings-4…6` (What’s Your Name?; Nice to Meet You; Polite “You”). 22 phrases, every lesson has a goal,
  a short rule, a sound tip (unit 0 spread over the lessons) and contrast notes. ¿Cómo estás?, Mucho gusto
  and ¿Cómo está usted? carry `level: 'A2'` and show “Common phrase · beyond A1”. Mexican usage
  (¡Buen día! accepted). The other 4 languages keep their 3 shared lessons.
- **Engine** (`src/learning/LessonSession.ts`, `answers.ts`): stages of SPANISH_CURRICULUM §6.1 in order:
  examples → meaning / target / listening (interleaved, never 3 of a kind in a row) → fill-blank and word
  order → typed answer → replies. Replies accept several answers (and say “Also right: …”). Wrong answers
  get specific feedback: wrong time of day, tú instead of usted (and back), goodbye instead of hello, or a
  per-option note for fill-blanks. Typed answers forgive capitals, ¡¿, accents and ñ→n (with a tip); one
  letter off is “Almost!” with no energy cost; `{name}` matches any name. Review questions get harder by
  Leitner box (0–1 recognise, 2–3 listen/order, 4–5 type). Typing is only offered for packs with
  `typing: true` (Spanish now).
- **Spanish forms**: Maggie asks -o or -a in lesson 5, before encantado/encantada. Saved in
  `profile.grammaticalGender`; Settings → “Spanish forms for Lanburger” changes it. The other gender’s form
  counts as right with a gentle tip.
- **Save v3** (`SAVE_VERSION = 3`, `migrateV2toV3`): adds `profile.grammaticalGender` (null) and
  `settings.listening` (true). Lesson flags keep their meaning by position, so old Spanish players keep
  their story progress and can replay lessons.
- **Audio** (`src/audio/Voice.ts`): voices in the order es-MX → es-US → es-419 → any non-es-ES Spanish voice.
  Settings → “Listening questions” On/Off. A listening question can always be switched to reading.
- **NPCs and quests**: Maggie's lesson menu is generated from the topic for the player's language
  (`src/dialogue/lessonMenu.ts`: “Next: Lesson n” + “Replay a lesson”). Remy's chat uses unit 1. New side
  quest **Proper Introductions** (Spanish only, `requires.languages`): lessons 4–6, then a usted chat with
  Mayor Bun (`chat:greetings/usted`). Maggie has unit-done lines.
- **Completion vs mastery**: finishing a unit's lessons and its chat sets `unit:<id>` (celebration, +10 XP).
  Stars now measure mastery only (★ every phrase right at least once, ★★ average box ≥ 60 %, ★★★ all box ≥ 4).
  The Collection shows “Lessons n/6 · Unit 1 · Saludos ✓” apart from the stars.
- Checked by script in headless Chromium (results in `docs/screenshots/r6b/README.md`). `npm run build` passes.

### Before calling R6B done

1. 👩‍🏫 A Spanish teacher (Mexican usage) reviews `es-topic.ts` and `es.ts`, plus the zh-TW explanations, then
   set `reviewed: true`. Open points for them: is ¡Buen día! fine as an accepted answer; should the other
   gender's form count as right; señora Bun (Mayor Bun is a woman in the story).
2. 🧪 On a real landscape phone: typed answers with the on-screen keyboard (does it cover the input?), the
   special-letter buttons, es-MX voice on iOS and Android, listening questions with the silent switch on.
3. Optional: the Airlearn reference screens, to tune the lesson flow (§6).

## R6A / R6B decisions (see docs/SPANISH_CURRICULUM.md)

- R6A (docs only): the audit and syllabus draft are written. Waiting on the user for:
  - **decided 2026-11-06: Latin American Spanish is the main variety.** That means ustedes, seseo, and vos/vosotros
    only as notes. A Latin American TTS voice replaces es-ES in R6B. Vocabulary follows **Mexico** (changed from
    pan-Latin American the same day): standard Mexican everyday words, with both forms taught when Mexico uses two.
    Other Latin American forms and Spain's are notes. Voice order: es-MX → es-US → es-419 (§7.1);
  - **decided: the player picks Lanburger's Spanish forms** (-o or -a, e.g. encantado/encantada), and can change it
    in Settings. Maggie asks before the first gendered word. R6B adds a profile field, which means SAVE_VERSION 3
    and a migration (§7.2);
  - **decided: tú with townsfolk, friends and Maggie; usted with Mayor Bun and unfamiliar adults; ustedes for
    every plural; vos only as a note;**
  - **decided: A1 is split.** Hello Town is A1.1 (units 0–8 on its 5 lanterns); a second village is A1.2 (units
    9–12) (§5.1);
  - **decided: device text-to-speech plus listening questions; short typed answers on phones, forgiving case,
    accents and ¡¿ (with a hint); speaking questions later;**
  - **decided: keep ¿Cómo estás? / Mucho gusto in Greetings, tagged as common phrases above A1** (PCIC lists them at A2);
  - **decided: the user will find a Spanish reviewer** (Mexican usage). Units 1–2 and the zh-TW explanations must
    be reviewed before R6B sign-off. All 7 key decisions are answered;
  - the Airlearn course list and screenshots (originals only, for reference).
  The teaching flow (§6) is final only after both arrive.
- R6B: Greetings becomes Spanish units 1–2. It needs new question types (listen-choose, order-words, fill-blank,
  short typed answers), several correct answers per question, error-specific feedback, NPC use (Remy, plus Mayor
  Bun using usted), and review that gets harder over time. Story completion and mastery are recorded and shown
  separately.
- Other languages keep their current content; no big content additions for them in this round.
- A native Spanish teacher review is needed before R6B sign-off (`reviewed: false` today).
- The R5 phone checklist is in `docs/screenshots/r5/README.md`.

## Answer feedback (2026-11-06, user request)

- `src/audio/Sfx.ts`: original sound effects synthesized with Web Audio (no audio files): correct, a 3+ streak,
  a gentle wrong, a lesson-complete fanfare, and a chime for reward banners. Settings → Sound effects On/Off
  (`settings.sfxVolume`, no save change). It's a service: `services.sfx`.
- The lesson card:
  - Correct: the chosen answer pops with a green glow and pixel sparks, and the +XP pill bounces in.
  - Streak: from 3 first-try correct answers in a row, a "★ N in a row!" badge.
  - Wrong: the chosen answer shakes gently.
  - Finish: the "Lesson complete!" title pops with a spark burst, and the learned phrases slide in one by one.
- `settings.reducedMotion` (body class `reduce-motion`) and the OS reduced-motion setting turn the animations off.
- Checked by script in the built-in browser: sounds fire, the audio context runs, the animations run (the pane was
  hidden, so they were checked from computed styles). 🧪 Not yet heard or seen on a real phone. On iOS, check that
  sound plays after the first tap, and with the silent switch on.

## Background music (2026-11-06, user request)

- `src/audio/Music.ts` is a small look-ahead sequencer on Web Audio.
  - Five soft synth instruments: flute, pluck, pad, bass, music-box bell.
  - A generated reverb.
  - Crossfades between maps, quieter during lessons, and silence while the tab is hidden.
  - It starts after the player's first tap or key press (browser rule).
- Songs are content: `src/content/music/index.ts`, with the song format in `src/audio/songs.ts`. Maps pick one
  with `MapSource.music`.
  - "Hello Town Waltz": F major, 3/4. A flute melody; on every second loop a bell doubles it an octave up.
  - "Chalk and Sunlight": the Academy's music-box tune in C major.
  - Both are original compositions. The mood brief was warm, nostalgic, loopable town music; no existing game's
    melody is used.
- Settings → Music On/Off (`settings.musicVolume`).
- A song can name a recorded `file` (under `public/`) that replaces the synth: a produced or licensed track can go
  in later without code changes.
- Checked in the built-in browser: plays, loops, crossfades, ducks, turns off. Level: peak about 0.18, so no
  clipping. 🧪 Not yet heard on a real phone or speakers; the mix and tempo may need tuning by ear.

## R5: what was added

- Quests: `src/quest/QuestSystem.ts` (pure). State steps (explore / visit / learn / practice) are read from save flags,
  so they can be done early and never go backwards; talk / interact steps count only while current.
  Content is in `src/content/quests/`.
- Progress: `src/progress/Progression.ts` (XP table, level ups refill energy, growth stage by level, topic stars) and
  `ProgressDirector.ts` (applies rules to the save, emits `quest:changed`, `progress:xp`, `progress:level`,
  `hero:changed`, `lantern:lit`, shows celebrations). It is a service: `services.progress`.
- Unlocks: `lantern:<topic>`, `topping:<id>`, `building:<id>`. Buildings can have an `openBlurb`.
- NPC dialogue rules (`NpcDefinition.dialogues`): by flag, by current quest step, or by finished quest. Quest
  balloons: `!` for the current goal, `?` for a turn-in.
- Learning: a new `chat` session mode (reply questions with a townsperson, no energy cost), plus XP per answer.
- UI: `QuestTracker`, `Minimap`, `Celebration` banners, and the `QuestsPanel`, `BagPanel` and `CollectionPanel` sheets.
  HUD buttons show a red dot when something is new.
- Save shape unchanged (still v2): quests, flags, inventory, lanterns, topicMastery and burger already existed.
- Screenshots: `docs/screenshots/r5/`.

## R4: what was added

- Content: `src/content/learning/` holds the topic (items, meanings in en and zh-TW, 3 lessons, reply pairs), packs per
  target language (forms, readings, language notes) and the support-language explanation templates.
- Engine: `LessonSession` (pure; explain, examples, 3 question types, feedback and retry, reveal after 2 misses, one grade
  per item per session), `Srs` (Leitner boxes 0–5), and `LearningDirector` (glue to save, energy and UI).
- UI: `LessonPanel` (target text tagged with its language, Listen via the Web Speech API, keyboard and touch).
- Maggie's dialogue offers the lessons (choices gated by flags, ✓ when done); the Practice Corner restores 5 energy;
  the HUD's Learn button opens a review of due items.

## R3: what was added

- Dialogue graphs (`src/content/dialogues/`), `DialogueRunner` (pure logic), and `DialogueBox` UI: portrait, typewriter
  text, choices; keyboard, mouse and touch. Story flags are saved immediately after each conversation.
- `NpcBrain`: strolls near home, stops and faces the player, plays a talk animation. `PetBrain`: Mochi follows Noah.
  Actors collide with each other.
- Warps: building `enter`, plus `warp` objects. Language Academy interior map with indoor lighting. The location
  (indoor or outdoor) is saved.
- Screenshots: `docs/screenshots/r3/`.

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
- The JS bundle is about 766 kB (211 kB gzipped), mostly Three.js.
- A Spanish lesson now has 11–17 questions (lesson 6 is the longest, about 4 minutes). Shorten it if
  playtesting shows it drags.
- Lesson flags (`lesson:greetings-N`) are shared by every language, as before: switching languages keeps
  story progress, so lessons can show ✓ that were done in another language.
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
