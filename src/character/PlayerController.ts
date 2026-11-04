import type { InputState } from '../input/actions';
import type { Body, Physics } from '../world/Physics';
import type { AnimState } from './types';

/** Movement feel. Tweak here, never in the view. */
export const TUNING = {
  runSpeed: 270,
  groundAccel: 2400,
  groundFriction: 2800,
  airAccel: 1500,
  gravity: 2300,
  fallGravityMul: 1.3,
  jumpVelocity: 830,
  jumpCutVelocity: 360,
  maxFall: 1150,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  dropThroughTime: 0.22,
  bodyWidth: 34,
  bodyHeight: 80,
} as const;

export type ControllerEvent = { type: 'jump' } | { type: 'land'; impact: number };

type Emote = Extract<AnimState, 'interact' | 'celebrate' | 'incorrect'>;

/** How long each emote locks movement (gameplay timing, independent of art). */
const EMOTE_TIME: Record<Emote, number> = { interact: 0.4, celebrate: 1.0, incorrect: 1.0 };

/**
 * The player's movement + state machine. Knows nothing about Three.js or art:
 * it outputs a position, a facing and an AnimState for whichever CharacterView is attached.
 */
export class PlayerController {
  readonly body: Body;
  facing: 1 | -1 = 1;
  onGround = false;
  onOneWay = false;
  /** Previous-step position for render interpolation. */
  prevX: number;
  prevY: number;
  private coyote = 0;
  private buffer = 0;
  private drop = 0;
  private emote: Emote | null = null;
  private emoteTimer = 0;
  private forced: AnimState | null = null;
  readonly events: ControllerEvent[] = [];

  constructor(
    private physics: Physics,
    x: number,
    y: number,
  ) {
    this.body = { x, y, w: TUNING.bodyWidth, h: TUNING.bodyHeight, vx: 0, vy: 0 };
    this.prevX = x;
    this.prevY = y;
  }

  get busy(): boolean {
    return this.emoteTimer > 0;
  }

  playEmote(e: Emote): void {
    this.emote = e;
    this.emoteTimer = EMOTE_TIME[e];
    this.forced = null;
  }

  /** Debug: force an animation state for art review (TECH_ARCHITECTURE §12). */
  forceState(s: AnimState | null): void {
    this.forced = s;
  }

  update(dt: number, input: InputState): void {
    const T = TUNING;
    const b = this.body;
    this.events.length = 0;
    this.prevX = b.x;
    this.prevY = b.y;

    if (this.emoteTimer > 0) {
      this.emoteTimer -= dt;
      if (this.emoteTimer <= 0) this.emote = null;
    }
    const locked = this.emoteTimer > 0 && this.onGround;
    const move = locked ? 0 : input.moveX;
    if (move !== 0 || input.jumpPressed) this.forced = null;

    // Horizontal
    const target = move * T.runSpeed;
    const accel = this.onGround ? (move !== 0 ? T.groundAccel : T.groundFriction) : T.airAccel;
    b.vx = approach(b.vx, target, accel * dt);
    if (move > 0.05) this.facing = 1;
    else if (move < -0.05) this.facing = -1;

    // Jump / drop-through
    if (input.jumpPressed && !locked) this.buffer = T.jumpBuffer;
    this.coyote = this.onGround ? T.coyoteTime : this.coyote - dt;
    if (this.buffer > 0) {
      if (this.onOneWay && input.moveY < -0.5) {
        this.drop = T.dropThroughTime;
        b.vy = -120;
        this.buffer = 0;
        this.onGround = false;
      } else if (this.coyote > 0) {
        b.vy = T.jumpVelocity;
        this.coyote = 0;
        this.buffer = 0;
        this.onGround = false;
        this.events.push({ type: 'jump' });
      }
    }
    this.buffer -= dt;
    this.drop -= dt;

    // Variable jump height: releasing early cuts the rise.
    if (!input.jumpHeld && b.vy > T.jumpCutVelocity) b.vy = T.jumpCutVelocity;

    // Gravity
    const g = b.vy < 0 ? T.gravity * T.fallGravityMul : T.gravity;
    b.vy = Math.max(-T.maxFall, b.vy - g * dt);

    const wasGrounded = this.onGround;
    const vyBefore = b.vy;
    const res = this.physics.move(b, dt, this.drop > 0);
    this.onGround = res.onGround;
    this.onOneWay = res.onOneWay;
    if (res.onGround && !wasGrounded) this.events.push({ type: 'land', impact: -vyBefore });
  }

  get animState(): AnimState {
    if (this.forced) return this.forced;
    if (this.emote && this.emoteTimer > 0) return this.emote;
    if (!this.onGround) return this.body.vy > 60 ? 'jump' : 'fall';
    return Math.abs(this.body.vx) > 25 ? 'walk' : 'idle';
  }

  /** Walk cycle speed follows actual speed. */
  get animSpeed(): number {
    return this.animState === 'walk' ? Math.max(0.6, Math.abs(this.body.vx) / TUNING.runSpeed) : 1;
  }
}

function approach(v: number, target: number, step: number): number {
  return v < target ? Math.min(v + step, target) : Math.max(v - step, target);
}
