import { facingFromVector, type AnimState, type Facing } from '../character/types';

/** Movement feel (art pixels per second). 16 px = 1 tile. */
export const MOVE = {
  walkSpeed: 78,
  runSpeed: 124,
  accel: 900,
  decel: 1400,
  /** Foot collision box (centered on x, extending up from the feet). */
  bodyW: 12,
  bodyH: 7,
  /** How far the mover slides sideways around a corner it clips. */
  cornerNudge: 10,
} as const;

export interface Collider {
  collides(x: number, y: number, w: number, h: number): boolean;
}

export interface MoveIntent {
  /** -1…1, screen right is +. */
  x: number;
  /** -1…1, screen DOWN is + (map space). */
  y: number;
  run: boolean;
}

/**
 * Eight-direction top-down movement with axis-separated collision and corner sliding.
 * Pure logic: no Three.js. The scene reads x/y/facing/animState and hands them to a view.
 */
export class TopDownMover {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx = 0;
  vy = 0;
  facing: Facing;
  /** One-shot emote (celebrate / incorrect / talk) overriding idle until it ends. */
  emote: AnimState | null = null;
  private emoteTime = 0;

  constructor(x: number, y: number, facing: Facing = 'down') {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.facing = facing;
  }

  get moving(): boolean {
    return Math.hypot(this.vx, this.vy) > 4;
  }

  get animState(): AnimState {
    if (this.emote && !this.moving) return this.emote;
    return this.moving ? 'walk' : 'idle';
  }

  playEmote(state: AnimState, seconds: number): void {
    this.emote = state;
    this.emoteTime = seconds;
  }

  update(dt: number, intent: MoveIntent, world: Collider): void {
    this.prevX = this.x;
    this.prevY = this.y;

    let ix = intent.x;
    let iy = intent.y;
    const len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    const speed = intent.run ? MOVE.runSpeed : MOVE.walkSpeed;
    const tx = ix * speed;
    const ty = iy * speed;
    this.vx = approach(this.vx, tx, (tx === 0 ? MOVE.decel : MOVE.accel) * dt);
    this.vy = approach(this.vy, ty, (ty === 0 ? MOVE.decel : MOVE.accel) * dt);

    if (len > 0.1) {
      this.facing = facingFromVector(ix, iy, this.facing);
      this.emote = null;
    }

    this.moveAxis('x', this.vx * dt, world, iy);
    this.moveAxis('y', this.vy * dt, world, ix);

    if (this.emote) {
      this.emoteTime -= dt;
      if (this.emoteTime <= 0) this.emote = null;
    }
  }

  /** Teleport (spawns, warps). */
  place(x: number, y: number, facing?: Facing): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.vx = this.vy = 0;
    if (facing) this.facing = facing;
  }

  private blocked(world: Collider, x: number, y: number): boolean {
    return world.collides(x - MOVE.bodyW / 2, y - MOVE.bodyH, MOVE.bodyW, MOVE.bodyH);
  }

  /** Move along one axis in ≤1 px steps; if blocked, try to slide around the corner. */
  private moveAxis(axis: 'x' | 'y', amount: number, world: Collider, otherIntent: number): void {
    if (amount === 0) return;
    const dir = Math.sign(amount);
    let left = Math.abs(amount);
    while (left > 0) {
      const step = Math.min(1, left);
      const nx = axis === 'x' ? this.x + dir * step : this.x;
      const ny = axis === 'y' ? this.y + dir * step : this.y;
      if (!this.blocked(world, nx, ny)) {
        this.x = nx;
        this.y = ny;
        left -= step;
        continue;
      }
      // Corner sliding: only when the player isn't steering along the other axis.
      if (Math.abs(otherIntent) < 0.3 && this.nudge(axis, dir, world)) return;
      if (axis === 'x') this.vx = 0;
      else this.vy = 0;
      return;
    }
  }

  /** Slide 1 px sideways toward a nearby opening. Returns true if it moved. */
  private nudge(axis: 'x' | 'y', dir: number, world: Collider): boolean {
    for (let d = 1; d <= MOVE.cornerNudge; d++) {
      for (const s of [-1, 1]) {
        const ox = axis === 'y' ? s * d : 0;
        const oy = axis === 'x' ? s * d : 0;
        const ax = this.x + ox + (axis === 'x' ? dir : 0);
        const ay = this.y + oy + (axis === 'y' ? dir : 0);
        if (!this.blocked(world, ax, ay)) {
          // slide one pixel toward the opening this step
          const sx = axis === 'y' ? s : 0;
          const sy = axis === 'x' ? s : 0;
          if (this.blocked(world, this.x + sx, this.y + sy)) return false;
          this.x += sx;
          this.y += sy;
          return true;
        }
      }
    }
    return false;
  }
}

function approach(v: number, target: number, maxDelta: number): number {
  if (v < target) return Math.min(target, v + maxDelta);
  return Math.max(target, v - maxDelta);
}
