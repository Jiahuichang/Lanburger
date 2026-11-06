import { icons } from './icons';

export interface CelebrationSpec {
  title: string;
  body: string;
  kind: 'level' | 'growth' | 'quest' | 'star' | 'lantern' | 'topping' | 'building' | 'item';
}

const ICON: Record<CelebrationSpec['kind'], keyof typeof icons> = {
  level: 'levelUp',
  growth: 'levelUp',
  quest: 'quests',
  star: 'collection',
  lantern: 'lantern',
  topping: 'leaf',
  building: 'door',
  item: 'badge',
};

const SHOW_MS = 2300;
const GAP_MS = 220;

/**
 * Big centered banners for rewards (level up, quest complete, lantern lit…). Shown one at a time in the
 * order they happened, above every panel, and never block input.
 */
export class Celebration {
  private el: HTMLElement;
  private queue: CelebrationSpec[] = [];
  private running = false;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'celebration';
    this.el.setAttribute('role', 'status');
    this.el.setAttribute('aria-live', 'polite');
    parent.append(this.el);
  }

  /** Banners still waiting or showing. */
  get pending(): number {
    return this.queue.length + (this.running ? 1 : 0);
  }

  push(spec: CelebrationSpec): void {
    this.queue.push(spec);
    if (!this.running) void this.run();
  }

  private async run(): Promise<void> {
    this.running = true;
    while (this.queue.length) {
      const c = this.queue.shift()!;
      this.el.className = `celebration celebration--${c.kind}`;
      this.el.innerHTML = `<div class="celebration-card panel"><span class="celebration-icon">${icons[ICON[c.kind]]}</span><div><div class="celebration-title"></div><div class="celebration-body"></div></div></div>`;
      this.el.querySelector('.celebration-title')!.textContent = c.title;
      this.el.querySelector('.celebration-body')!.textContent = c.body;
      void this.el.offsetWidth;
      this.el.classList.add('is-shown');
      await wait(SHOW_MS);
      this.el.classList.remove('is-shown');
      await wait(GAP_MS);
    }
    this.running = false;
  }
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
