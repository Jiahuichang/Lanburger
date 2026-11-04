# Game Design — Lingua Quest

## 1. Pitch

A cozy, hand-drawn fantasy village where every errand is a small language lesson. The player walks,
jumps and chats their way through a side-scrolling world. Villagers teach words and phrases, quests
ask the player to use them, and three arcade mini-games put that vocabulary under light, friendly pressure.

**Design pillars**

1. **One world.** The RPG and the mini-games share one place, one art bible, one save and one progression.
2. **Teach first, then play.** Nothing is tested before it is taught (see `LEARNING_DESIGN.md`).
3. **Cozy, never punishing.** Mistakes come with explanations, not game-overs. Nothing blocks progress for good.
4. **Thumb-friendly.** Every system works in landscape on a phone, with two thumbs.

## 2. World

The Kingdom of **Verdalia** is a ring of regions around the forest village of **Mossbrook**.

| Region              | Role                                   | Unlock                         | Phase |
| ------------------- | -------------------------------------- | ------------------------------ | ----- |
| Mossbrook Village   | Hub. Main NPCs, first quests, shops    | Start                          | 1–3   |
| Whispering Grove    | Enchanted Forest → Vocabulary Snake    | Finish quest "First Words"     | 4     |
| The Copper Kettle   | Village Restaurant → Cooking Challenge | Finish quest "A Hungry Guest"  | 5     |
| Acorn Speedway      | Village Racing Grounds → Kart Racing   | Reach player level 4           | 6     |
| (Later) Lantern Bay, Cloudpeak | Post-launch regions           | Later                          | 7+    |

Each region is a side-scrolling map. A map is made of parallax layers (sky → far → mid → play → foreground),
one-way platforms you can jump up through (MapleStory-style), and **portals** (doors, paths, signposts)
that lead to other maps or mini-games.

## 3. Player loop

```
Explore village ─▶ Talk to NPC ─▶ TEACH (new words) ─▶ GUIDED PRACTICE (in dialogue)
      ▲                                                        │
      │                                                        ▼
  REVIEW (spaced) ◀── FEEDBACK + REWARDS ◀── GAME CHALLENGE (quest task or mini-game)
```

A session should take 5–15 minutes and finish at least one small quest step.

## 4. Controls

| Action           | Keyboard                 | Touch (landscape)               |
| ---------------- | ------------------------ | ------------------------------- |
| Move             | ← → / A D                | Left-thumb joystick             |
| Drop through platform | ↓ / S + Jump        | Joystick down + Jump            |
| Jump             | Space / W / ↑            | Right thumb — big **Jump**      |
| Interact / talk  | E / Enter                | Right thumb — **Interact**      |
| Contextual action | Q / Shift               | Right thumb — **Action** (emote, use item) |
| Menu             | Esc                      | Top-right menu button           |

Mini-games keep the same layout: left thumb = steer/move, right thumb = confirm/act.

## 5. Characters

- **Protagonist**: final artwork will be supplied later. Until then a clearly labeled **PLACEHOLDER**
  mannequin is used. Required animation states: idle, walk, jump (rise), fall, interact, celebrate,
  incorrect-answer reaction.
- **NPCs** (Phase 2+): every NPC has an id, display name per UI language, home map, a sprite manifest,
  a dialogue graph and optional quest hooks. NPC art follows the same chibi proportions as the protagonist.

## 6. Systems

### 6.1 Experience and levels
- XP comes from quest steps, correct answers, mini-games and daily review.
- Level curve: `xpToNext(level) = 40 + 20 × (level − 1)`. Levels unlock regions and cosmetic rewards, never core learning content.

### 6.2 Energy (never a blocker)
- Max 20 energy. Mini-game runs cost 2–4 energy; talking, exploring, learning and **review cost nothing**.
- Energy refills +1 every 3 minutes of real time and fully on level up.
- **At 0 energy** the player can still: explore, talk, do every teach and guided-practice step, and play
  any mini-game in **Practice Mode** (no energy cost, reduced XP, no item drops). Quest progress still counts.
- Losing a mini-game never costs extra energy.

### 6.3 Inventory and rewards
- Item categories: *ingredients* (Cooking), *kart parts* (Kart), *keepsakes* (cosmetic), *quest items*.
- Rewards: XP, coins ("acorns"), items, vocabulary stickers in the **Word Journal**.
- Quest items cannot be lost or sold.

### 6.4 Quests
- A quest is a list of steps. Step types: `talk`, `learn` (teach lesson), `practice` (guided questions),
  `challenge` (mini-game or quest task with a target score), `deliver` (bring an item), `review`.
- Quest state: `locked → available → active(stepIndex) → complete`. Stored in the shared save.
- Failing a `challenge` step leaves the quest on that step with a hint; retrying is always allowed.

### 6.5 Save
- Local, automatic (every few seconds, on scene change, and when the tab is hidden).
- A save holds: profile, languages, position (map + coordinates), XP, level, energy, inventory, quests,
  vocabulary mastery, settings. See `TECH_ARCHITECTURE.md` → Save.

## 7. First quest (Phase 3 target): "First Words"

1. Talk to **Elder Bramble** at the village square.
2. TEACH: 5 greeting words in the target language (with audio where available).
3. GUIDED PRACTICE: 4 dialogue questions with hints.
4. CHALLENGE: greet 3 villagers correctly.
5. FEEDBACK + reward: 30 XP, "Greeting Leaf" keepsake; Whispering Grove path opens.
6. REVIEW: greetings are added to the review queue.

## 8. Mini-game entry and return

Mini-games are entered from in-world NPCs or locations (a grove gate, a restaurant counter, a racing
banner). Entering stores a **return point** (map, x, y, facing). Finishing or quitting a mini-game goes
back to that point, applies rewards, and updates quest state. See `MINIGAME_DESIGN.md`.
