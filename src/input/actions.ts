/** Device-independent input snapshot. Gameplay only ever reads this. */
export interface InputState {
  /** -1 (left) … 1 (right) */
  moveX: number;
  /** -1 (down) … 1 (up) — screen up is +. Map space is y-down, so movers flip this. */
  moveY: number;
  runHeld: boolean;
  interactPressed: boolean;
  actionPressed: boolean;
  menuPressed: boolean;
  /** Debug-only: number key 1–6 pressed this frame (animation preview). */
  debugKey: number | null;
}

export type EdgeAction = 'interact' | 'action' | 'menu';

export interface InputSource {
  moveX(): number;
  moveY(): number;
  runHeld(): boolean;
  /** Edges since the last consume(). */
  edges(): Set<EdgeAction>;
  consume(): void;
}
