/**
 * OPTIONAL automated play-test + screenshots for the phase quality gate (CLAUDE.md).
 * Drives the real game in headless Google Chrome: keyboard on desktop, multi-touch on a landscape phone.
 * Needs permission to launch Chrome — never run it without the user's OK.
 *
 *   npm run dev            (in another terminal)
 *   npm run playtest       → screenshots in docs/screenshots/r1/
 *
 * Env: BASE_URL (default http://localhost:5173), CHROME_PATH (default: system Google Chrome), OUT_DIR.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? 'docs/screenshots/r1';
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : process.platform === 'win32'
      ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
      : '/usr/bin/google-chrome');

mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function open(context, query) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${BASE}/?test${query}`);
  await page.waitForFunction(() => window.lq?.scenes?.current?.player && !window.lq.scenes.isTransitioning, null, { timeout: 20000 });
  await sleep(900);
  return { page, errors };
}

const state = (page) =>
  page.evaluate(() => {
    const s = window.lq.scenes.current;
    return { x: s.player.x, y: s.player.y, facing: s.player.facing, anim: s.player.animState, nearby: s.nearby?.id ?? null };
  });
const place = (page, x, y, facing = 'down') =>
  page.evaluate(([x, y, f]) => window.lq.scenes.current.player.place(x, y, f), [x, y, facing]);

async function hold(page, keys, ms) {
  for (const k of keys) await page.keyboard.down(k);
  await sleep(ms);
  for (const k of keys) await page.keyboard.up(k);
  await sleep(120);
}

// ───────────────────────── desktop (keyboard)
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const { page, errors } = await open(context, '&reset=1');
  await page.screenshot({ path: `${OUT}/pt-desktop-01-start.png` });

  const s0 = await state(page);
  await hold(page, ['ArrowLeft'], 600);
  const s1 = await state(page);
  check('walks left with the arrow keys', s1.x < s0.x - 25 && s1.facing === 'left', `${s0.x.toFixed(0)} → ${s1.x.toFixed(0)}`);

  await hold(page, ['KeyW', 'KeyD'], 500);
  const s2 = await state(page);
  check('walks diagonally (W + D)', s2.x > s1.x + 10 && s2.y < s1.y - 10);

  await place(page, 300, 650, 'right');
  await hold(page, ['ArrowRight'], 500);
  const walk = (await state(page)).x - 300;
  await place(page, 300, 650, 'right');
  await hold(page, ['ArrowRight', 'ShiftLeft'], 500);
  const run = (await state(page)).x - 300;
  check('Shift runs faster than walking', run > walk * 1.3, `walk ${walk.toFixed(0)} px, run ${run.toFixed(0)} px`);

  await place(page, 300, 700, 'down');
  await hold(page, ['ArrowDown'], 900);
  check('the stream blocks the player', (await state(page)).y < 736);

  await place(page, 640, 700, 'down');
  await hold(page, ['ArrowDown'], 2200);
  check('the bridge crosses the stream', (await state(page)).y > 780);

  await place(page, 1056, 330, 'up');
  await hold(page, ['ArrowUp'], 1200);
  check('buildings are solid', (await state(page)).y >= 278);

  await place(page, 224, 300, 'up');
  await hold(page, ['ArrowUp'], 500);
  const door = await state(page);
  await page.keyboard.press('KeyE');
  await sleep(400);
  const bubble = await page.evaluate(() => document.querySelector('.speech-bubble.is-shown .speech-title')?.textContent);
  check('E at the Academy door shows its name', door.nearby === 'language-academy:door' && bubble === 'Language Academy', bubble ?? 'no bubble');
  await page.screenshot({ path: `${OUT}/pt-desktop-02-door.png` });

  await place(page, 500, 425, 'right');
  await sleep(200);
  await page.keyboard.press('KeyE');
  await sleep(400);
  const lantern = await page.evaluate(() => document.querySelector('.speech-bubble.is-shown .speech-body')?.textContent ?? '');
  check('Word Lantern explains how to light it', lantern.includes('Greetings'));

  await page.keyboard.press('KeyQ');
  await sleep(120);
  check('Q plays the celebrate emote', (await state(page)).anim === 'celebrate');

  await page.keyboard.press('Escape');
  await sleep(300);
  await page.selectOption('.sel-target', 'ja');
  const chip = await page.evaluate(() => document.querySelector('.hud-learning span').textContent);
  check('settings switch the target language (menus stay English)', chip.includes('日本語') && chip.startsWith('Learning'), chip);
  await page.screenshot({ path: `${OUT}/pt-desktop-03-settings.png` });
  await page.keyboard.press('Escape');

  await place(page, 300, 650, 'left');
  await sleep(1300);
  await page.goto(`${BASE}/?test`);
  await page.waitForFunction(() => window.lq?.scenes?.current?.player, null, { timeout: 20000 });
  const restored = await state(page);
  check('save restores position after reload', Math.abs(restored.x - 300) < 4 && Math.abs(restored.y - 650) < 4, `${restored.x},${restored.y}`);

  check('no console errors (desktop)', errors.length === 0, errors.join(' | '));
  await context.close();
}

// ───────────────────────── debug flags
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const { page } = await open(context, '&debug=1');
  const states = [];
  for (let k = 1; k <= 6; k++) {
    await page.keyboard.press(`Digit${k}`);
    await sleep(100);
    states.push((await state(page)).anim);
  }
  check('debug hotkeys 1–6 preview animation states', new Set(states).size >= 4, states.join(','));
  await page.screenshot({ path: `${OUT}/pt-desktop-04-debug.png` });
  await context.close();
}

// ───────────────────────── landscape phone (touch)
{
  const context = await browser.newContext({ viewport: { width: 812, height: 375 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const { page, errors } = await open(context, '&touch=1');
  check('touch controls are visible', await page.isVisible('.touch-controls'));
  check('pixel zoom is an integer ≥ 2 on a phone', await page.evaluate(() => window.lq.pixel.zoom >= 2));
  await page.screenshot({ path: `${OUT}/pt-mobile-01-start.png` });

  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await place(page, 584, 640, 'up');
  const s0 = await state(page);
  const stick = { x: 110, y: 290, id: 1 };
  await touch('touchStart', [stick]);
  await touch('touchMove', [{ ...stick, y: 240 }]);
  await sleep(250);
  // second thumb taps Talk while the stick is still held (multi-touch)
  const btn = await page.locator('.touch-btn--interact').boundingBox();
  const talk = { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2, id: 2 };
  await touch('touchStart', [{ ...stick, y: 240 }, talk]);
  await touch('touchEnd', [{ ...stick, y: 240 }]);
  await sleep(150);
  await touch('touchEnd', []);
  await sleep(300);
  const s1 = await state(page);
  check('joystick walks the player up', s1.y < s0.y - 4, `${s0.y.toFixed(0)} → ${s1.y.toFixed(0)}`);
  const read = await page.evaluate(() => document.querySelector('.speech-bubble.is-shown .speech-title')?.textContent);
  check('Talk button (second thumb) reads the welcome sign', read === 'Welcome to Hello Town!', read ?? 'no bubble');
  await page.screenshot({ path: `${OUT}/pt-mobile-02-sign.png` });

  await page.setViewportSize({ width: 375, height: 812 });
  await sleep(300);
  check('portrait phones get the rotate screen', await page.isVisible('.rotate-overlay'));
  check('no console errors (mobile)', errors.length === 0, errors.join(' | '));
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
