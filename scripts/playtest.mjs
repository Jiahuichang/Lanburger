/**
 * Automated play-test + screenshots for the phase quality gate (CLAUDE.md).
 * Drives the real game in headless Chrome: keyboard on desktop, multi-touch on landscape mobile.
 *
 *   npm run dev            (in another terminal)
 *   npm run playtest       → screenshots in docs/screenshots/phase-1/
 *
 * Env: BASE_URL (default http://localhost:5173), CHROME_PATH (default: system Google Chrome).
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? 'docs/screenshots/phase-1';
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
  await page.waitForFunction(() => window.lq?.scenes?.current && !window.lq.scenes.isTransitioning, null, { timeout: 20000 });
  // wait until the simulation is really ticking (player has settled on the ground)
  await page.waitForFunction(() => window.lq.scenes.current.player?.onGround, null, { timeout: 20000 });
  await sleep(600);
  return { page, errors };
}

const state = (page) =>
  page.evaluate(() => {
    const p = window.lq.scenes.current.player;
    return { x: p.body.x, y: p.body.y, onGround: p.onGround, anim: p.animState };
  });

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await sleep(ms);
  await page.keyboard.up(key);
}

async function walkTo(page, targetX) {
  let lastX = null;
  for (let i = 0; i < 80; i++) {
    const s = await state(page);
    if (Math.abs(s.x - targetX) < 14) break;
    const key = s.x < targetX ? 'ArrowRight' : 'ArrowLeft';
    if (lastX !== null && Math.abs(s.x - lastX) < 4) {
      // blocked (e.g. the tree stump): jump over it like a player would
      await page.keyboard.down(key);
      await hold(page, 'Space', 300);
      await sleep(250);
      await page.keyboard.up(key);
    } else {
      await hold(page, key, Math.min(260, Math.abs(s.x - targetX) * 2.2));
    }
    lastX = s.x;
  }
  await sleep(250);
}

// ───────────────────────── desktop (keyboard)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const { page, errors } = await open(ctx, '&reset=1');
  await page.screenshot({ path: `${OUT}/desktop-01-start.png` });

  let s = await state(page);
  check('spawns on the ground', s.onGround && Math.abs(s.y) < 1, JSON.stringify(s));

  await hold(page, 'ArrowRight', 500);
  const moved = await state(page);
  check('walks right with arrow key', moved.x > s.x + 60, `x ${s.x.toFixed(0)} → ${moved.x.toFixed(0)}`);

  await page.keyboard.down('Space');
  let peak = 0;
  for (let i = 0; i < 12; i++) {
    await sleep(40);
    peak = Math.max(peak, (await state(page)).y);
  }
  await page.keyboard.up('Space');
  await sleep(700);
  check('full jump reaches > 120 units', peak > 120, `peak ${peak.toFixed(0)}`);
  check('lands again', (await state(page)).onGround);

  await page.keyboard.press('Space'); // tap = short hop
  let hop = 0;
  for (let i = 0; i < 12; i++) {
    await sleep(40);
    hop = Math.max(hop, (await state(page)).y);
  }
  await sleep(600);
  check('tap jump is lower than held jump (variable height)', hop < peak - 20, `tap ${hop.toFixed(0)} vs held ${peak.toFixed(0)}`);

  // signpost interaction
  await walkTo(page, 420);
  const prompt = await page.locator('.world-prompt').evaluate((e) => e.classList.contains('is-shown'));
  check('interaction prompt appears near the signpost', prompt);
  await page.keyboard.press('KeyE');
  await sleep(500);
  const bubble = await page.locator('.speech-bubble').evaluate((e) => e.classList.contains('is-shown'));
  check('E opens the sign speech bubble', bubble);
  await page.screenshot({ path: `${OUT}/desktop-02-signpost.png` });

  // one-way platform: jump up through it from below and stand on it (platform x 560–760, y 120)
  await walkTo(page, 640);
  await hold(page, 'Space', 420);
  await sleep(700);
  s = await state(page);
  check('jumps up through a one-way platform and stands on it', s.onGround && Math.abs(s.y - 120) < 1, JSON.stringify(s));
  await page.screenshot({ path: `${OUT}/desktop-03-platform.png` });

  // drop through
  await page.keyboard.down('ArrowDown');
  await sleep(120);
  await page.keyboard.press('Space');
  await sleep(120);
  await page.keyboard.up('ArrowDown');
  await sleep(800);
  s = await state(page);
  check('Down + Jump drops through the platform', s.onGround && Math.abs(s.y) < 1, JSON.stringify(s));

  // celebrate emote
  await page.keyboard.press('KeyQ');
  await sleep(250);
  s = await state(page);
  check('Q plays the celebrate animation', s.anim === 'celebrate', s.anim);
  await page.screenshot({ path: `${OUT}/desktop-04-celebrate.png` });
  await sleep(1000);

  // treehouse platforms near the big tree
  await walkTo(page, 1500);
  await page.screenshot({ path: `${OUT}/desktop-05-village.png` });

  // east end: locked grove gate
  await walkTo(page, 3400);
  await page.keyboard.press('KeyE');
  await sleep(500);
  check('locked grove gate explains how it opens', await page.locator('.speech-bubble').evaluate((e) => e.classList.contains('is-shown')));
  await page.screenshot({ path: `${OUT}/desktop-06-grove-gate.png` });

  // save + reload restores position
  const before = await state(page);
  await sleep(1300);
  await page.goto(`${BASE}/?test`); // no reset this time
  await page.waitForFunction(() => window.lq?.scenes?.current && !window.lq.scenes.isTransitioning);
  await sleep(500);
  const after = await state(page);
  check('position persists across reload', Math.abs(after.x - before.x) < 40, `${before.x.toFixed(0)} → ${after.x.toFixed(0)}`);

  // settings: switch UI language to Traditional Chinese, target stays different
  await page.click('.hud-settings');
  await sleep(300);
  await page.screenshot({ path: `${OUT}/desktop-07-settings.png` });
  await page.selectOption('.sel-ui', 'zh-TW');
  await sleep(200);
  const langs = await page.evaluate(() => window.lq.save.data.profile);
  check('UI language and target language stay different', langs.uiLanguage !== langs.targetLanguage, `${langs.uiLanguage} / ${langs.targetLanguage}`);
  await page.selectOption('.sel-target', 'zh-TW');
  await sleep(200);
  const swapped = await page.evaluate(() => window.lq.save.data.profile);
  check('choosing the UI language as target swaps them', swapped.uiLanguage !== swapped.targetLanguage, `${swapped.uiLanguage} / ${swapped.targetLanguage}`);
  await page.selectOption('.sel-ui', 'zh-TW');
  await page.selectOption('.sel-target', 'es');
  await page.click('.modal-done');
  await sleep(400);
  await page.screenshot({ path: `${OUT}/desktop-08-zh-TW-ui.png` });

  check('no console errors (desktop)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ───────────────────────── animation sheet review (all 7 states)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const { page } = await open(ctx, '&reset=1&debug=1');
  const states = ['idle', 'walk', 'jump', 'fall', 'interact', 'celebrate', 'incorrect'];
  for (let i = 0; i < states.length; i++) {
    await page.keyboard.press(`Digit${i + 1}`);
    await sleep(i === 4 || i >= 5 ? 250 : 400);
    const anim = (await state(page)).anim;
    check(`debug hotkey ${i + 1} shows "${states[i]}"`, anim === states[i], anim);
    const box = await page.evaluate(() => {
      const sc = window.lq.scenes.current;
      const v = sc.view.object.position.clone().project(sc.camera);
      return { x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight };
    });
    await page.screenshot({
      path: `${OUT}/anim-${i + 1}-${states[i]}.png`,
      clip: { x: box.x - 90, y: box.y - 190, width: 180, height: 210 },
    });
  }
  await ctx.close();
}

// ───────────────────────── landscape phone (multi-touch)
{
  const ctx = await browser.newContext({
    viewport: { width: 812, height: 375 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const { page, errors } = await open(ctx, '&reset=1');
  await page.screenshot({ path: `${OUT}/mobile-01-start.png` });
  check('touch controls visible on a touch device', await page.locator('.touch-controls').evaluate((e) => getComputedStyle(e).display !== 'none'));

  const cdp = await ctx.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  const jump = await page.locator('.touch-btn--jump').boundingBox();
  const jx = jump.x + jump.width / 2;
  const jy = jump.y + jump.height / 2;

  const s0 = await state(page);
  // left thumb: joystick drag right and hold
  await touch('touchStart', [{ x: 110, y: 290, id: 1 }]);
  await touch('touchMove', [{ x: 170, y: 290, id: 1 }]);
  await sleep(450);
  // right thumb presses Jump while the left thumb keeps holding (multi-touch)
  await touch('touchStart', [{ x: 170, y: 290, id: 1 }, { x: jx, y: jy, id: 2 }]);
  let peak = 0;
  for (let i = 0; i < 8; i++) {
    await sleep(40);
    peak = Math.max(peak, (await state(page)).y);
  }
  await page.screenshot({ path: `${OUT}/mobile-02-joystick-jump.png` });
  await touch('touchEnd', [{ x: 170, y: 290, id: 1 }]);
  await touch('touchEnd', []);
  await sleep(700);
  const s1 = await state(page);
  check('joystick moves the player', s1.x > s0.x + 60, `x ${s0.x.toFixed(0)} → ${s1.x.toFixed(0)}`);
  check('Jump button works while joystick is held (multi-touch)', peak > 60, `peak ${peak.toFixed(0)}`);

  // walk to sign with joystick, then tap Interact
  for (let i = 0; i < 20; i++) {
    const s = await state(page);
    if (Math.abs(s.x - 420) < 20) break;
    const dir = s.x < 420 ? 1 : -1;
    await touch('touchStart', [{ x: 110, y: 290, id: 1 }]);
    await touch('touchMove', [{ x: 110 + dir * 40, y: 290, id: 1 }]);
    await sleep(Math.min(250, Math.abs(s.x - 420) * 2));
    await touch('touchEnd', []);
    await sleep(150);
  }
  await sleep(300);
  const hinted = await page.locator('.touch-btn--interact').evaluate((e) => e.classList.contains('is-hinted'));
  check('Interact button highlights near the signpost', hinted);
  await page.locator('.touch-btn--interact').tap();
  await sleep(500);
  check('Interact tap opens the speech bubble', await page.locator('.speech-bubble').evaluate((e) => e.classList.contains('is-shown')));
  await page.screenshot({ path: `${OUT}/mobile-03-signpost.png` });
  check('no console errors (mobile)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ───────────────────────── portrait phone → rotate hint
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const { page } = await open(ctx, '');
  check('portrait phone shows the rotate-device overlay', await page.locator('.rotate-overlay').evaluate((e) => getComputedStyle(e).display === 'flex'));
  await page.screenshot({ path: `${OUT}/mobile-04-portrait-rotate.png` });
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
