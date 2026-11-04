# Mini-game Design — Lingua Quest

All three mini-games are **places in Verdalia**, entered through NPCs or locations, and they share one
framework, one art bible, one save and one learning engine. Camera and rules may change; the look, the
UI components, the fonts and the control placement do not.

## 1. Shared framework

```ts
interface MiniGameConfig {
  gameId: 'snake' | 'cooking' | 'kart';
  targetLanguage: LanguageCode;
  uiLanguage: LanguageCode;
  itemPool: string[];             // vocabulary ids — must already be taught
  difficulty: Difficulty;
  mode: 'normal' | 'practice';    // practice = no energy cost, reduced XP, no drops
  questId?: string; questStepIndex?: number;
  returnPoint: { mapId: string; x: number; y: number; facing: 1 | -1 };
}

interface MiniGameResult {
  gameId: string;
  completed: boolean;             // false = quit early (no penalty)
  score: number;
  answers: { questionId: string; itemIds: string[]; correct: boolean; ms: number }[];
  xpEarned: number;
  itemsEarned: Record<string, number>;
  questStepSatisfied: boolean;
}

interface MiniGame extends Scene {
  readonly gameId: MiniGameConfig['gameId'];
  start(config: MiniGameConfig): void;
  onFinish(cb: (result: MiniGameResult) => void): void;
}
```

**Flow:** NPC/location → *Briefing panel* (goal, words used, energy cost or Practice Mode) → mini-game →
*Results panel* (score, words right/wrong with explanations, XP, items) → `SceneManager.returnFromMiniGame`
→ player back at the return point; save, quests and mastery updated.

**Shared UI pieces:** Briefing panel, Results panel, question card, score/time pill, pause menu,
correct/incorrect feedback effects — all from `src/ui/`.

**Shared controls:** left thumb steers/moves, right thumb confirms/acts, pause top-right — same
placement as the RPG.

**Every answer** is reported to the learning engine (mastery + review queue).

## 2. Vocabulary Snake — Whispering Grove (Phase 4)

- **Entry:** the glowing grove gate at the east end of Mossbrook, guided by a forest-spirit NPC.
- **Camera:** top-down orthographic onto a mossy clearing framed by wooden logs.
- **Rules:** a prompt shows a concept (picture / UI-language word / audio). Magical fruits, leaves and
  mushrooms appear labeled with target-language words. Eat the correct one → grow + sparkle; wrong one →
  gentle shrink + explanation toast (no instant death). Hitting your tail or the log border costs a
  "heart" (3 per run); out of hearts ends the run with results — never a hard fail.
- **Controls:** joystick/arrow direction; right-thumb button = short dash.
- **Visuals:** forest clearing, moss, mushrooms, glowing fruit, wooden border decorations, fireflies.

## 3. Cooking Challenge — The Copper Kettle (Phase 5)

- **Entry:** the restaurant door in Mossbrook; chef NPC gives orders.
- **Camera:** fixed 2D kitchen view (side/three-quarter), same parallax painting style.
- **Rules:** customers order in the target language ("Quisiera una sopa con tomate y queso").
  The player taps/drags the right ingredients onto the pot in the right amounts, then serves.
  Wrong ingredient → the customer reacts kindly and the explanation highlights the misunderstood word.
  Difficulty adds quantities, negation ("without onions") and politeness forms.
- **Controls:** touch drag on mobile; keyboard selection on desktop (arrows + Enter); right thumb = serve.
- **Visuals:** cozy wooden kitchen, cream tiles, copper pots, cute round ingredients with faces optional.

## 4. Language Kart Racing — Acorn Speedway (Phase 6)

- **Entry:** the racing banner and the mechanic NPC at the village racing grounds.
- **Camera:** side-scrolling or top-down track (decide in Phase 6 prototype; both use orthographic).
- **Rules:** question gates appear on the track. Answer correctly (by steering into the right lane or
  tapping the answer) → boost, shortcut route, or a power-up (leaf shield, acorn bounce). Wrong → a short
  slowdown and an explanation banner; the race always continues. Rivals are friendly villagers.
- **Controls:** left thumb steer, right thumb = boost/use item; answer by lane or tap.
- **Visuals:** handmade wooden karts, forest dirt tracks, bunting and village banners, colorful props.

## 5. Consistency checklist for every mini-game

- [ ] Only tokens from `src/art/tokens.ts`; shared UI components; Fredoka type.
- [ ] Uses environmental motifs from the art bible (mushrooms, wood planks, leaves, bunting, lanterns).
- [ ] Entered from an in-world NPC/location; returns to the same spot.
- [ ] Practice Mode works at 0 energy.
- [ ] Every wrong answer shows an explanation.
- [ ] Results feed XP, inventory, quests and mastery through the shared save.
