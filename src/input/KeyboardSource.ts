import type { EdgeAction, InputSource } from './actions';

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const JUMP = ['Space', 'ArrowUp', 'KeyW'];
const INTERACT = ['KeyE', 'Enter'];
const ACTION = ['KeyQ', 'ShiftLeft', 'ShiftRight'];
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
      if (JUMP.includes(e.code)) this.pending.add('jump');
      if (INTERACT.includes(e.code)) this.pending.add('interact');
      if (ACTION.includes(e.code)) this.pending.add('action');
      if (MENU.includes(e.code)) this.pending.add('menu');
      if (/^Digit[1-7]$/.test(e.code)) this.debugKey = Number(e.code.slice(5));
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

  jumpHeld(): boolean {
    return this.any(JUMP);
  }

  edges(): Set<EdgeAction> {
    return this.pending;
  }

  consume(): void {
    this.pending.clear();
    this.debugKey = null;
  }
}

function isFormField(t: EventTarget | null): boolean {
  return t instanceof HTMLSelectElement || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
}
