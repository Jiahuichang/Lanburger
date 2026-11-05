# Learning Design — Lingua Quest

> ⚠️ **Superseded (2026-11-05):** this document describes the Phase 1 side-scroller (Lingua Quest / Mossbrook).
> The game is being redesigned as **Lanburger**, a top-down pixel-art RPG. Draft replacement: `LEARNING_SYSTEM.md`.
> The redesign plan was approved. Keep this document for history only; do not build from it.

## 1. Languages

| Code    | Language                     | Notes                                               |
| ------- | ---------------------------- | --------------------------------------------------- |
| `en`    | English                      |                                                     |
| `es`    | Spanish                      | Latin-American default; note regional variants      |
| `de`    | German                       | Show noun gender + article (der/die/das)            |
| `fr`    | French                       | Show gender + elision rules where relevant          |
| `zh-TW` | Traditional Chinese (Taiwan) | Traditional characters + Zhuyin (ㄅㄆㄇ) and/or Pinyin toggle; Taiwan vocabulary |

**UI language** (menus, buttons, explanations) and **target language** (what is being learned) are two
separate settings in the profile. Any pair is allowed except the same language twice.
UI strings live in `src/i18n/`; learning content lives in content packs (`src/learning/content/`).
Explanations are written in the **UI language**.

## 2. Sequence: Teach → Guided Practice → Game Challenge → Feedback → Review

| Step              | What happens                                                         | Failure cost |
| ----------------- | -------------------------------------------------------------------- | ------------ |
| **Teach**         | NPC introduces 3–6 items: word, picture, audio, example sentence     | none         |
| **Guided Practice** | 3–5 questions in dialogue; hints available; the NPC helps          | none         |
| **Game Challenge** | Quest task or mini-game uses the same items under light pressure    | energy only (Practice Mode is free) |
| **Feedback**      | Every wrong answer shows the correct answer + a short explanation    | none         |
| **Review**        | Items enter a spaced-repetition queue; daily review in the Word Journal | none      |

Rule: **an item may only appear in a challenge after it was taught.** The engine enforces this by
checking `MasteryRecord.taughtAt`.

## 3. Question schema

```ts
type LanguageCode = 'en' | 'es' | 'de' | 'fr' | 'zh-TW';
type Difficulty = 1 | 2 | 3 | 4 | 5;
type QuestionKind = 'choose-translation' | 'choose-picture' | 'listen-choose' | 'fill-blank' | 'order-words' | 'match-pairs';

interface Question {
  id: string;
  objective: string;              // learning objective id, e.g. "greet.basic"
  targetLanguage: LanguageCode;
  difficulty: Difficulty;
  kind: QuestionKind;
  prompt: LocalizedText;          // shown in UI language, may embed target-language text
  promptTarget?: string;          // target-language text to display large
  choices: Choice[];              // { id, text, image?, audio? }
  correctChoiceId: string;        // or correctOrder for 'order-words'
  explanation: LocalizedText;     // why the answer is right / common mistake
  audio?: string;                 // asset key; optional
  review: {
    itemIds: string[];            // vocabulary items practised
    tags: string[];               // e.g. ["greeting", "formal"]
    introducedIn?: string;        // lesson id
  };
}
```

`LocalizedText = Partial<Record<LanguageCode, string>>` keyed by UI language.

## 4. Vocabulary items and mastery

```ts
interface VocabItem { id; concept; forms: Record<LanguageCode, { text; romanization?; gender?; audio? }>; image?; }

interface MasteryRecord {
  itemId: string;
  taughtAt?: number;
  box: 0 | 1 | 2 | 3 | 4 | 5;     // Leitner box
  dueAt: number;
  correct: number;
  wrong: number;
  lastSeenAt: number;
}
```

Spaced repetition (Leitner): correct → box+1, wrong → box 1. Intervals: 0 = new, 1 = 10 min, 2 = 1 day,
3 = 3 days, 4 = 7 days, 5 = 21 days. Mastery stars in the Word Journal = box (0–5).

## 5. Feedback rules

- Correct: short praise in the UI language, sparkle effect, the character's **celebrate** animation.
- Incorrect: the character's **incorrect** reaction (gentle, comic), the correct answer highlighted, an
  explanation (≤ 2 sentences) and, when audio exists, a replay button. Never "Game Over".
- After 2 wrong answers on the same question, the next attempt shows a hint (e.g., first letter).
- Tone: warm, specific, never shaming.

## 6. Difficulty

Difficulty 1–5 controls distractor similarity, time pressure in mini-games, and whether pictures/audio
are shown. The engine picks difficulty from recent accuracy (target ≈ 80 % correct).

## 7. Accessibility

- Learning text ≥ 20 px on phones; target-language text displayed larger than glosses.
- Audio is optional everywhere; nothing requires sound.
- Color is never the only signal (icons + text for correct/incorrect).
- Reduced-motion setting disables screen-space effects.

## 8. Content production

Content packs are JSON/TS per target language and theme (e.g. `greetings.es.ts`). Each pack lists
vocabulary items, lessons (teach scripts), and questions. Content is reviewed by a native speaker
before shipping; zh-TW uses Taiwan usage (e.g. 腳踏車, not 自行车).
