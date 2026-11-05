import { facingFromVector, type AnimState, type Facing } from '../character/types';
import { TopDownMover, type Collider } from '../world/TopDownMover';

/** A foot collision box other actors can bump into (map pixels). */
export interface Body {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Senses {
  playerX: number;
  playerY: number;
  /** This NPC is in a conversation with the player. */
  talking: boolean;
}

const NOTICE_RANGE = 40;
const WALK_INTENT = 0.5; // half of the player's walk speed: strolling

/**
 * Simple NPC behavior (pure logic): stroll around a home point, pause, and stop to face the player
 * when they come close or talk. Movement goes through the same TopDownMover as the player.
 */
export class NpcBrain {
  readonly mover: TopDownMover;
  private state: 'idle' | 'walk' | 'attend' = 'idle';
  private timer: number;
  private target = { x: 0, y: 0 };
  private stuck = 0;

  constructor(
    readonly id: string,
    private home: { x: number; y: number },
    facing: Facing,
    /** How far from home the NPC may wander (pixels). 0 = stays put. */
    private radius: number,
    private rand: () => number = Math.random,
  ) {
    this.mover = new TopDownMover(home.x, home.y, facing);
    this.timer = 1 + rand() * 3;
  }

  get x(): number {
    return this.mover.x;
  }

  get y(): number {
    return this.mover.y;
  }

  get facing(): Facing {
    return this.mover.facing;
  }

  animState(talking: boolean): AnimState {
    return talking ? 'talk' : this.mover.animState;
  }

  body(): Body {
    return { id: this.id, x: this.mover.x - 6, y: this.mover.y - 6, w: 12, h: 6 };
  }

  update(dt: number, senses: Senses, world: Collider): void {
    const dx = senses.playerX - this.x;
    const dy = senses.playerY - this.y;
    const near = Math.hypot(dx, dy) < NOTICE_RANGE;

    if (senses.talking || near) {
      this.state = 'attend';
      this.mover.update(dt, { x: 0, y: 0, run: false }, world);
      this.mover.facing = facingFromVector(dx, dy, this.mover.facing);
      return;
    }
    if (this.state === 'attend') {
      this.state = 'idle';
      this.timer = 1.5 + this.rand() * 2;
    }

    if (this.state === 'idle') {
      this.mover.update(dt, { x: 0, y: 0, run: false }, world);
      this.timer -= dt;
      if (this.timer <= 0 && this.radius > 0) {
        const a = this.rand() * Math.PI * 2;
        const r = this.radius * (0.4 + this.rand() * 0.6);
        this.target = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r * 0.6 };
        this.state = 'walk';
        this.stuck = 0;
      } else if (this.timer <= 0) {
        this.timer = 3;
      }
      return;
    }

    // walking
    const tx = this.target.x - this.x;
    const ty = this.target.y - this.y;
    const dist = Math.hypot(tx, ty);
    const bx = this.x;
    const by = this.y;
    if (dist > 2) this.mover.update(dt, { x: (tx / dist) * WALK_INTENT, y: (ty / dist) * WALK_INTENT, run: false }, world);
    const moved = Math.hypot(this.x - bx, this.y - by);
    this.stuck = moved < 0.05 ? this.stuck + dt : 0;
    if (dist <= 2 || this.stuck > 0.6) {
      this.state = 'idle';
      this.timer = 2 + this.rand() * 4;
    }
  }
}

/** A pet trots after its owner and looks at the player when they're close. */
export class PetBrain {
  readonly mover: TopDownMover;

  constructor(
    readonly id: string,
    x: number,
    y: number,
    private offset = { x: 18, y: 2 },
  ) {
    this.mover = new TopDownMover(x, y, 'left');
  }

  body(): Body {
    return { id: this.id, x: this.mover.x - 5, y: this.mover.y - 4, w: 10, h: 4 };
  }

  update(dt: number, owner: { x: number; y: number }, senses: Senses, world: Collider): void {
    const tx = owner.x + this.offset.x - this.mover.x;
    const ty = owner.y + this.offset.y - this.mover.y;
    const dist = Math.hypot(tx, ty);
    if (dist > 6) {
      const k = Math.min(1, dist / 30);
      this.mover.update(dt, { x: (tx / dist) * k, y: (ty / dist) * k, run: dist > 40 }, world);
    } else {
      this.mover.update(dt, { x: 0, y: 0, run: false }, world);
      const px = senses.playerX - this.mover.x;
      const py = senses.playerY - this.mover.y;
      const lookAt = Math.hypot(px, py) < NOTICE_RANGE ? { x: px, y: py } : { x: owner.x - this.mover.x, y: 0 };
      // pets only have left/right art
      if (lookAt.x !== 0) this.mover.facing = lookAt.x < 0 ? 'left' : 'right';
    }
  }
}

/** World collision plus every actor body except the asking one. */
export function withBodies(map: Collider, bodies: () => Body[], selfId: string): Collider {
  return {
    collides(x, y, w, h) {
      if (map.collides(x, y, w, h)) return true;
      for (const b of bodies()) {
        if (b.id === selfId) continue;
        if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return true;
      }
      return false;
    },
  };
}
