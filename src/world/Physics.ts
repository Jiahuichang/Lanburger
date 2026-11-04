/** Solid box (blocks from every side). x,y = bottom-left corner. */
export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One-way platform: you can jump up through it and stand on top. y = top surface. */
export interface OneWay {
  x: number;
  y: number;
  w: number;
}

/** A body is positioned by its feet (bottom-center). */
export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

export interface MoveResult {
  onGround: boolean;
  onOneWay: boolean;
  hitCeiling: boolean;
}

const EPS = 0.01;

/** Deterministic AABB physics for side-scrolling maps (TECH_ARCHITECTURE §7). */
export class Physics {
  constructor(
    readonly solids: Solid[],
    readonly oneWays: OneWay[],
    readonly bounds: { minX: number; maxX: number },
  ) {}

  move(b: Body, dt: number, dropThrough: boolean): MoveResult {
    const res: MoveResult = { onGround: false, onOneWay: false, hitCeiling: false };
    const hw = b.w / 2;

    // --- X axis
    b.x += b.vx * dt;
    for (const s of this.solids) {
      const vertical = b.y < s.y + s.h - EPS && b.y + b.h > s.y + EPS;
      if (!vertical) continue;
      if (b.x + hw > s.x && b.x - hw < s.x + s.w) {
        if (b.vx > 0 || b.x < s.x + s.w / 2) b.x = s.x - hw;
        else b.x = s.x + s.w + hw;
        b.vx = 0;
      }
    }
    if (b.x - hw < this.bounds.minX) {
      b.x = this.bounds.minX + hw;
      b.vx = 0;
    }
    if (b.x + hw > this.bounds.maxX) {
      b.x = this.bounds.maxX - hw;
      b.vx = 0;
    }

    // --- Y axis
    const prevBottom = b.y;
    const prevTop = b.y + b.h;
    b.y += b.vy * dt;
    for (const s of this.solids) {
      if (!(b.x + hw > s.x && b.x - hw < s.x + s.w)) continue;
      const top = s.y + s.h;
      if (b.vy <= 0 && prevBottom >= top - EPS && b.y < top) {
        b.y = top;
        b.vy = 0;
        res.onGround = true;
      } else if (b.vy > 0 && prevTop <= s.y + EPS && b.y + b.h > s.y) {
        b.y = s.y - b.h;
        b.vy = 0;
        res.hitCeiling = true;
      }
    }
    if (!dropThrough) {
      for (const p of this.oneWays) {
        if (!(b.x + hw * 0.6 > p.x && b.x - hw * 0.6 < p.x + p.w)) continue;
        if (b.vy <= 0 && prevBottom >= p.y - EPS && b.y <= p.y) {
          b.y = p.y;
          b.vy = 0;
          res.onGround = true;
          res.onOneWay = true;
        }
      }
    }
    return res;
  }

  /** Height of the highest surface at or below (x, y), or null. Used for contact shadows. */
  surfaceBelow(x: number, y: number): number | null {
    let best: number | null = null;
    for (const s of this.solids) {
      const top = s.y + s.h;
      if (x >= s.x && x <= s.x + s.w && top <= y + EPS && (best === null || top > best)) best = top;
    }
    for (const p of this.oneWays) {
      if (x >= p.x && x <= p.x + p.w && p.y <= y + EPS && (best === null || p.y > best)) best = p.y;
    }
    return best;
  }
}
