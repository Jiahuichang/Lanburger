# Art Bible — Lingua Quest

This is the **single source of truth** for how Lingua Quest looks. The machine-readable half is
`src/art/tokens.ts`; it feeds both the Three.js painters and the CSS variables of the HTML UI.
If this document and `tokens.ts` disagree, fix one so they match — never fork the style.

## 1. Identity in one sentence

*A hand-drawn, chibi storybook forest: soft rounded shapes, warm wood, sage leaves, cream light and
clear sky, outlined in warm brown ink — never black, never realistic, never neon.*

Reference mood: classic 2D side-scrolling MMO villages (layered parallax, cute proportions, whimsy).
All art must be **original or properly licensed**. Do not copy or trace any existing game's art.

## 2. Palette

| Token            | Hex       | Use                                                |
| ---------------- | --------- | -------------------------------------------------- |
| `sage`           | `#9cbf8a` | Foliage, grass, primary nature hue                 |
| `sageDeep`       | `#6f9a64` | Foliage shadows, grass body                        |
| `sageDark`       | `#4f7a52` | Deepest foliage, far tree silhouettes              |
| `cream`          | `#fbf3e1` | Panels, highlights, light                          |
| `creamDeep`      | `#f1e2c2` | Panel inner fill, parchment                        |
| `wood`           | `#a8764a` | Wooden structures, buttons                         |
| `woodDeep`       | `#7a5232` | Wood shadow, borders                               |
| `woodLight`      | `#d3a774` | Wood highlights, planks                            |
| `sky`            | `#a8d8ef` | Sky top                                            |
| `skyLight`       | `#dff1f5` | Sky near horizon                                   |
| `earth`          | `#b98a5e` | Dirt                                               |
| `earthDeep`      | `#8a6142` | Dirt shadow                                        |
| `ink`            | `#4a3426` | All outlines and body text — warm brown, not black |
| `blossom`        | `#f4a9a8` | Flowers, hearts, "celebrate" accents               |
| `berry`          | `#d9707a` | Mushroom caps, alerts                              |
| `sun`            | `#ffd97a` | Lantern glow, XP, stars                            |
| `correct`        | `#7fbf6a` | Correct-answer feedback                            |
| `gentleWrong`    | `#e8a05c` | Incorrect-answer feedback (warm orange, not red)   |
| `energy`         | `#6fc3d9` | Energy meter                                       |

Rules: max one saturated accent per element. Far layers drift toward `skyLight` (aerial perspective,
see `haze` in tokens). Incorrect feedback is **warm orange**, never alarming red.

## 3. Line, shape and shading

- **Outline**: `ink` color, ~3 px at 1080p for characters/props, 2 px for small items, none for far layers.
  Lines wobble slightly (hand-drawn), never perfectly straight.
- **Shapes**: rounded everywhere. Minimum corner radius ~ 20 % of the shape's short side. No sharp spikes
  except deliberate leaf tips.
- **Shading**: two-tone cel shading + one soft highlight. Light comes from the **upper left**.
  Shadows are a darker, slightly cooler variant of the base color, never gray.
- **Texture**: subtle painted speckle/grain (opacity ≤ 8 %) to avoid flat vector look.

## 4. Proportions (characters)

- Chibi: head ≈ 45–50 % of total height; 2–2.5 heads tall.
- Big readable silhouette; eyes are the main facial feature.
- Standard character height: **96 world units** (≈ 1/5.5 of screen height).
- Feet pivot at the bottom center of the frame.
- **The protagonist's final design will be supplied.** Until then use the labeled PLACEHOLDER mannequin.

## 5. Environment layering (side-scroller)

| Layer        | Parallax factor | z      | Content                                              |
| ------------ | --------------- | ------ | ---------------------------------------------------- |
| Sky          | 0.0             | -100   | Gradient sky, soft clouds                            |
| Far          | 0.15            | -80    | Hazy hills, distant tree line                        |
| Mid-far      | 0.4             | -60    | Big rounded trees, distant rooftops                  |
| Mid          | 0.7             | -40    | Cottages, giant mushrooms, fences                    |
| Play         | 1.0             | 0      | Ground, platforms, props, NPCs, player               |
| Foreground   | 1.25            | 40     | Grass tufts, flowers, ferns (partially overlap feet) |
| FX           | 1.0             | 60     | Pollen motes, fireflies, falling leaves, light rays  |

Foreground elements must never hide the player's head or any interactive prompt.

## 6. Motifs (use these across all scenes and mini-games)

Rounded canopy trees · red-and-cream spotted mushrooms · wooden planks with visible pegs · rope and
little bunting flags · round cottage windows with warm light · lanterns · leaves and sprouts ·
acorns (the coin) · flower clusters in `blossom`/`sun`.

- **Snake** (Whispering Grove): top-down forest clearing, mossy ground, mushrooms/fruits as pickups, wooden border.
- **Cooking** (The Copper Kettle): warm wood kitchen, cream tiles, copper pots, cute round ingredients.
- **Kart** (Acorn Speedway): handmade wooden karts, dirt-and-grass track, village bunting, banners.

## 7. UI

- Panels: `cream` fill, `woodDeep` 3px border, radius `16px`, soft drop shadow (`shadow.panel`), a 2px inner
  `creamDeep` highlight. Looks like painted parchment on a wooden frame.
- Buttons: rounded pill or circle, `wood` → `woodLight` gradient, `ink` label, press = 4% scale-down + darker.
- Typography: **Fredoka** (rounded) for UI/Latin; fallback for Traditional Chinese: "Noto Sans TC",
  "PingFang TC", "Microsoft JhengHei". Learning text min **20px** on mobile; never below 14px anywhere.
- Icons: simple, rounded, outlined in `ink`, filled with palette colors. One icon style everywhere.
- Learning panels show the **target language large** and the UI-language gloss small beneath.

## 8. Motion and effects

- Easing: soft ease-out for UI (≈ 180 ms); squash & stretch for characters (≤ 12 %).
- Particles: pollen motes, fireflies, leaves; additive glow only for `sun`-colored lights.
- Feedback: correct = sparkle burst in `sun` + `correct`; incorrect = small wobble + `gentleWrong` puff, never screen shake.
- Scene transitions: soft leaf-tinted fade (cream → scene), 350 ms.

## 9. Forbidden

Realistic or PBR 3D models · pure black outlines or text · neon/saturated gradients · default browser
UI widgets left unstyled · stock "game demo" sprites · copying any existing game's characters, maps or UI.

## 10. Review checklist (run every phase)

- [ ] Every color comes from `tokens.ts`.
- [ ] Outlines are `ink`, not black.
- [ ] Shapes are rounded; light is upper-left.
- [ ] Far layers are hazier than near layers.
- [ ] UI panels/buttons use the shared components.
- [ ] Text is readable at 812×375 (landscape phone).
- [ ] Placeholder character is clearly labeled as placeholder.
