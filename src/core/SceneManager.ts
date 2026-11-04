import type { Scene, SceneFactory, ReturnPoint } from './Scene';
import type { Services } from './Services';
import { motion } from '../art/tokens';

/**
 * Owns the active scene and the soft cream fade between scenes (ART_BIBLE §8).
 * Mini-games are entered with a return point and come back to it when they finish.
 */
export class SceneManager {
  private factories = new Map<string, SceneFactory>();
  private active: Scene | null = null;
  private transitioning = false;
  private returnStack: ReturnPoint[] = [];
  private size = { w: 1, h: 1 };

  constructor(
    private services: () => Services,
    private fadeEl: HTMLElement,
  ) {}

  register(id: string, factory: SceneFactory): void {
    this.factories.set(id, factory);
  }

  get current(): Scene | null {
    return this.active;
  }

  get isTransitioning(): boolean {
    return this.transitioning;
  }

  async goTo(id: string, params?: Record<string, unknown>): Promise<void> {
    const factory = this.factories.get(id);
    if (!factory) throw new Error(`Unknown scene "${id}"`);
    if (this.transitioning) return;
    this.transitioning = true;
    try {
      if (this.active) await this.fade(true);
      this.active?.exit();
      this.active = null;
      const next = factory();
      await next.enter({ services: this.services(), params });
      next.resize(this.size.w, this.size.h);
      this.active = next;
      this.services().events.emit('scene:entered', { id });
      await this.fade(false);
    } finally {
      this.transitioning = false;
    }
  }

  /** Enter a mini-game, remembering where the player stood. */
  async pushMiniGame(id: string, returnPoint: ReturnPoint, params?: Record<string, unknown>): Promise<void> {
    this.returnStack.push(returnPoint);
    await this.goTo(id, params);
  }

  /** Leave a mini-game and put the player back at their return point. */
  async returnFromMiniGame(result?: Record<string, unknown>): Promise<void> {
    const rp = this.returnStack.pop();
    if (!rp) return;
    await this.goTo(rp.sceneId, { returnPoint: rp, miniGameResult: result });
  }

  update(dt: number): void {
    this.active?.update(dt);
  }

  render(alpha: number, frameDt: number): void {
    this.active?.render(alpha, frameDt);
  }

  resize(w: number, h: number): void {
    this.size = { w, h };
    this.active?.resize(w, h);
  }

  private fade(toOpaque: boolean): Promise<void> {
    return new Promise((resolve) => {
      this.fadeEl.classList.toggle('is-opaque', toOpaque);
      window.setTimeout(resolve, motion.sceneFadeMs);
    });
  }
}
