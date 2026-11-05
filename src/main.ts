import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './ui/styles.css';

import { applyCssTokens } from './art/cssVars';
import { Game } from './core/Game';
import { setUiLanguage } from './i18n';
import { SaveSystem } from './save/SaveSystem';
import { UiRoot } from './ui/UiRoot';
import { WorldScene } from './world/WorldScene';

async function boot(): Promise<void> {
  applyCssTokens();

  const params = new URLSearchParams(location.search);
  const flags = {
    debug: params.has('debug'),
    forceTouch: params.has('touch'),
    heroPreview:
      params.has('stage') || params.has('toppings')
        ? { stage: params.get('stage') ?? undefined, toppings: params.get('toppings')?.split(',') }
        : undefined,
  };

  // ?gallery=1 shows the art gallery for reviews instead of the game
  if (params.has('gallery')) {
    const { showGallery } = await import('./dev/Gallery');
    await showGallery(document.getElementById('ui')!);
    return;
  }

  const save = new SaveSystem();
  if (params.has('reset')) save.reset();
  setUiLanguage('en');

  const ui = new UiRoot(document.getElementById('ui')!);

  // HUD text uses Fredoka; wait briefly so the first frame doesn't flash a fallback font.
  await Promise.race([
    Promise.all(['500 14px Fredoka', '600 14px Fredoka', '700 20px Fredoka'].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  const game = new Game(document.getElementById('game')!, ui, save, flags);
  const { scenes } = game.services;
  scenes.register('world', () => new WorldScene());
  game.start();
  await scenes.goTo('world');
  ui.finishSplash();
  // A Phase 1 save that was learning French (no longer offered) asks for a new language once.
  if (save.data.flags.needsLanguagePick) ui.settings.open();

  // ?debug or ?test exposes services for the console and scripts/playtest.mjs
  if (flags.debug || params.has('test')) Object.assign(window, { lq: game.services });
}

boot().catch((err) => {
  console.error(err);
  const el = document.querySelector('.splash-loading');
  if (el) el.textContent = String(err?.message ?? err);
});
