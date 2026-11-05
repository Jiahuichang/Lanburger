# Phase 1 screenshots

Captured on 2026-11-05 by `npm run playtest` (headless Chrome driving the real game).

| File | What it shows |
| ---- | ------------- |
| `desktop-01-start.png` | 1280×720, fresh save, spawn point, controls hint |
| `desktop-02-signpost.png` | Signpost speech bubble after pressing E |
| `desktop-03-platform.png` | Standing on a one-way wooden platform |
| `desktop-04-celebrate.png` | Celebrate emote (Q) |
| `desktop-05-village.png` | Village middle: cottage, giant mushroom, crates, platforms |
| `desktop-06-grove-gate.png` | Locked Whispering Grove gate at the east end |
| `desktop-07-settings.png` | Settings: menu language / target language |
| `desktop-08-zh-TW-ui.png` | UI switched to Traditional Chinese, still learning Spanish |
| `anim-1…7-*.png` | Placeholder character in each animation state (debug hotkeys 1–7, collision box visible) |
| `mobile-01-start.png` | 812×375 landscape phone, touch controls |
| `mobile-02-joystick-jump.png` | Joystick held + Jump pressed at the same time (multi-touch) |
| `mobile-03-signpost.png` | Interact button highlighted, speech bubble open |
| `mobile-04-portrait-rotate.png` | Portrait phone → "turn your device" screen |

## Art-bible review (ART_BIBLE §10)

- [x] Every color comes from `tokens.ts`. No hex values in `src/` outside `tokens.ts`; `styles.css` uses only token variables.
      (Only exceptions: the static `index.html` `theme-color` and `public/favicon.svg`, which can't import tokens. Both use palette values.)
- [x] Outlines are warm `ink` brown, never black. Overlapping shapes show one outer outline.
- [x] Shapes are rounded. Shading falls on the lower right (light from the upper left).
- [x] Far layers are hazier than near ones (hills → tree line → village → play layer).
- [x] UI panels, chips, buttons and the speech bubble all use the shared components.
- [x] No text is smaller than 14px. Readable at 812×375.
- [x] The placeholder character is clearly labeled (PLACEHOLDER tag, "?" emblem, desktop notice).

Known gap: these were captured in software-rendered headless Chrome, not on a real phone.
