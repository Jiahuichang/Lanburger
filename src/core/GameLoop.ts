export const FIXED_DT = 1 / 60;
const MAX_STEPS = 5;

export interface LoopHooks {
  /** Called once per animation frame before any fixed steps. */
  beginFrame(frameDt: number): void;
  /** Fixed-step simulation update. */
  step(dt: number): void;
  /** Called after the first step that consumed this frame's one-shot input. */
  afterStep(): void;
  /** Render with interpolation factor alpha (0..1) and the real frame delta. */
  render(alpha: number, frameDt: number): void;
}

/** Fixed-timestep update (60 Hz) + one render per animation frame. */
export class GameLoop {
  private acc = 0;
  private last = 0;
  private raf = 0;
  private running = false;

  constructor(private hooks: LoopHooks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const frameDt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.hooks.beginFrame(frameDt);
      this.acc += frameDt;
      let steps = 0;
      while (this.acc >= FIXED_DT && steps < MAX_STEPS) {
        this.hooks.step(FIXED_DT);
        this.hooks.afterStep();
        this.acc -= FIXED_DT;
        steps++;
      }
      if (steps === MAX_STEPS) this.acc = 0;
      this.hooks.render(this.acc / FIXED_DT, frameDt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
