import type { Services } from '../core/Services';
import { t } from '../i18n';
import { Hud } from './Hud';
import { Prompt } from './Prompt';
import { SettingsPanel } from './SettingsPanel';
import { icons } from './icons';

/**
 * The HTML overlay. Layers (bottom → top): world prompts, HUD, touch controls, modals,
 * rotate-device overlay, scene fade (which doubles as the boot splash).
 */
export class UiRoot {
  readonly worldLayer: HTMLElement;
  readonly hudLayer: HTMLElement;
  readonly controlsLayer: HTMLElement;
  readonly modalLayer: HTMLElement;
  readonly fade: HTMLElement;
  readonly prompt: Prompt;
  hud!: Hud;
  settings!: SettingsPanel;
  private rotate: HTMLElement;
  private services?: Services;

  constructor(readonly root: HTMLElement) {
    const layer = (cls: string) => {
      const e = document.createElement('div');
      e.className = `ui-layer ${cls}`;
      root.append(e);
      return e;
    };
    this.worldLayer = layer('ui-world');
    this.hudLayer = layer('ui-hud');
    this.controlsLayer = layer('ui-controls');
    this.modalLayer = layer('ui-modal');
    this.prompt = new Prompt(this.worldLayer);

    this.rotate = document.createElement('div');
    this.rotate.className = 'rotate-overlay';
    this.rotate.innerHTML = `<div class="rotate-icon">${icons.rotate}</div><h2></h2><p></p>`;
    root.append(this.rotate);

    this.fade = document.createElement('div');
    this.fade.className = 'scene-fade is-opaque';
    this.fade.innerHTML = `
      <div class="splash">
        <div class="splash-leaf">${icons.leaf}</div>
        <h1 class="splash-title">Lingua Quest</h1>
        <p class="splash-sub"></p>
        <p class="splash-loading"></p>
      </div>`;
    root.append(this.fade);
    this.relabelStatic();
  }

  /** Called once services exist (HUD/settings need save, input, events). */
  bind(services: Services): void {
    this.services = services;
    this.hud = new Hud(this.hudLayer, services);
    this.settings = new SettingsPanel(this.modalLayer, services);
  }

  /** Re-apply every UI string after a UI-language change. */
  relabel(): void {
    this.relabelStatic();
    this.hud?.refresh();
    this.settings?.relabel();
    this.services?.input.touch.relabel();
  }

  /** Remove the boot splash once the first scene has faded in. */
  finishSplash(): void {
    window.setTimeout(() => this.fade.querySelector('.splash')?.remove(), 600);
  }

  private relabelStatic(): void {
    this.rotate.querySelector('h2')!.textContent = t('rotate.title');
    this.rotate.querySelector('p')!.textContent = t('rotate.body');
    const sub = this.fade.querySelector('.splash-sub');
    if (sub) sub.textContent = t('splash.subtitle');
    const loading = this.fade.querySelector('.splash-loading');
    if (loading) loading.textContent = t('splash.loading');
  }
}
