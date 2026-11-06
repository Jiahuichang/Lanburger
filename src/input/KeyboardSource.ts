import type { EdgeAction, InputSource } from './actions';

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const RUN = ['ShiftLeft', 'ShiftRight'];
const INTERACT = ['KeyE', 'Enter', 'Space'];
const ACTION = ['KeyQ'];
const MENU = ['Escape'];
const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export class KeyboardSource implements InputSource {
  private held = new Set<string>();
  private pending = new Set<EdgeAction>();
  debugKey: number | null = null;

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      if (isFormField(e.target)) return;
      if (PREVENT.has(e.code)) e.preventDefault();
      this.held.add(e.code);
      if (e.repeat) return;
      if (INTERACT.includes(e.code)) this.pending.add('interact');
      if (ACTION.includes(e.code)) this.pending.add('action');
      if (MENU.includes(e.code)) this.pending.add('menu');
      if (/^Digit[1-6]$/.test(e.code)) this.debugKey = Number(e.code.slice(5));
    });
    target.addEventListener('keyup', (e) => this.held.delete(e.code));
    target.addEventListener('blur', () => this.held.clear());
  }

  private any(codes: string[]) {
    return codes.some((c) => this.held.has(c));
  }

  moveX(): number {
    return (this.any(RIGHT) ? 1 : 0) - (this.any(LEFT) ? 1 : 0);
  }

  moveY(): number {
    return (this.any(UP) ? 1 : 0) - (this.any(DOWN) ? 1 : 0);
  }

  runHeld(): boolean {
    return this.any(RUN);
  }

  edges(): Set<EdgeAction> {
    return this.pending;
  }

  consume(): void {
    this.pending.clear();
    this.debugKey = null;
  }
}

/**
 * Keys typed into a form field on an OPEN panel belong to that field. A field that kept focus after its
 * panel closed must not swallow the arrow keys (that froze the player after changing a setting).
 */
function isFormField(t: EventTarget | null): boolean {
  const field = t instanceof HTMLSelectElement || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
  if (!field) return false;
  if ((t as HTMLElement).closest('.modal.is-open')) return true;
  (t as HTMLElement).blur();
  return false;
}
