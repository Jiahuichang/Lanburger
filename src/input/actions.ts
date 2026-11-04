/** Device-independent input snapshot. Gameplay only ever reads this. */
export interface InputState {
  /** -1 (left) … 1 (right) */
  moveX: number;
  /** -1 (down) … 1 (up) */
  moveY: number;
  jumpHeld: boolean;
  jumpPressed: boolean;
  interactPressed: boolean;
  actionPressed: boolean;
  menuPressed: boolean;
  /** Debug-only: number key 1–7 pressed this frame (animation preview). */
  debugKey: number | null;
}

export type EdgeAction = 'jump' | 'interact' | 'action' | 'menu';

export interface InputSource {
  moveX(): number;
  moveY(): number;
  jumpHeld(): boolean;
  /** Edges since the last consume(). */
  edges(): Set<EdgeAction>;
  consume(): void;
}
