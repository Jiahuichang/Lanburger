import type { Services } from '../core/Services';
import { t } from '../i18n';
import { Hud } from './Hud';
import { Prompt } from './Prompt';
import { SettingsPanel } from './SettingsPanel';
import { DialogueBox } from './DialogueBox';
import { LessonPanel } from './LessonPanel';
import { icons } from './icons';
import { Celebration, type CelebrationSpec } from './Celebration';
import { QuestTracker } from './QuestTracker';
import { Minimap } from './Minimap';
import { BagPanel, CollectionPanel, QuestsPanel } from './MenuPanels';

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
  dialogue!: DialogueBox;
  lesson!: LessonPanel;
  tracker!: QuestTracker;
  minimap!: Minimap;
  quests!: QuestsPanel;
  bag!: BagPanel;
  collection!: CollectionPanel;
  private celebration: Celebration;
  private rotate: HTMLElement;
  private toastEl: HTMLElement;
  private toastTimer = 0;
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
    // rewards show above every panel (but under the rotate overlay and the scene fade)
    this.celebration = new Celebration(layer('ui-celebrate'), (c) => {
      if (c.kind !== 'item' && c.kind !== 'building') this.services?.sfx.play('celebrate');
    });

    this.rotate = document.createElement('div');
    this.rotate.className = 'rotate-overlay';
    this.rotate.innerHTML = `<div class="rotate-icon">${icons.rotate}</div><h2></h2><p></p>`;
    root.append(this.rotate);

    this.fade = document.createElement('div');
    this.fade.className = 'scene-fade is-opaque';
    this.fade.innerHTML = `
      <div class="splash">
        <div class="splash-burger" aria-hidden="true"><i></i><i></i><i></i></div>
        <h1 class="splash-title">Lanburger</h1>
        <p class="splash-sub"></p>
        <p class="splash-loading"></p>
      </div>`;
    root.append(this.fade);

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'toast';
    this.toastEl.setAttribute('role', 'status');
    this.hudLayer.append(this.toastEl);
    this.relabelStatic();
  }

  /** Called once services exist (HUD/settings need save, input, events). */
  bind(services: Services): void {
    this.services = services;
    const motion = () => document.body.classList.toggle('reduce-motion', !!services.save.data.settings.reducedMotion);
    motion();
    services.save.onChange(motion);
    this.tracker = new QuestTracker(this.hudLayer, services);
    this.minimap = new Minimap(this.hudLayer);
    this.hud = new Hud(this.hudLayer, services);
    this.dialogue = new DialogueBox(this.hudLayer, services);
    this.settings = new SettingsPanel(this.modalLayer, services);
    this.lesson = new LessonPanel(this.modalLayer, services);
    this.quests = new QuestsPanel(this.modalLayer, services);
    this.bag = new BagPanel(this.modalLayer, services);
    this.collection = new CollectionPanel(this.modalLayer, services);
  }

  /** A modal sheet (not the dialogue box) is open. */
  get anyPanelOpen(): boolean {
    return !!(this.settings?.isOpen || this.lesson?.isOpen || this.quests?.isOpen || this.bag?.isOpen || this.collection?.isOpen);
  }

  /** Queue a reward banner. */
  celebrate(spec: CelebrationSpec): void {
    this.celebration.push(spec);
  }

  /** Reward banners still on screen or waiting. */
  get celebrating(): number {
    return this.celebration.pending;
  }

  /** Re-apply every UI string after a UI-language change. */
  relabel(): void {
    this.relabelStatic();
    this.hud?.refresh();
    this.tracker?.render();
    this.settings?.relabel();
    this.services?.input.touch.relabel();
  }

  /** A short message at the top of the screen (e.g. "Coming soon"). */
  toast(text: string, ms = 2400): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('is-shown');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('is-shown'), ms);
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
