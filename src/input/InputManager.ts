import type { InputState, InputSource } from './actions';
import { KeyboardSource } from './KeyboardSource';
import { TouchControls } from './TouchControls';

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Merges keyboard + touch into one InputState. One-shot presses persist until a fixed
 * simulation step consumes them, so a tap is never lost on high-refresh displays.
 */
export class InputManager {
  readonly keyboard: KeyboardSource;
  readonly touch: TouchControls;
  private sources: InputSource[];
  /** When false (e.g. a modal is open) gameplay sees neutral input. */
  enabled = true;
  readonly state: InputState = {
    moveX: 0,
    moveY: 0,
    runHeld: false,
    interactPressed: false,
    actionPressed: false,
    menuPressed: false,
    debugKey: null,
  };

  constructor(uiParent: HTMLElement, forceTouch: boolean) {
    this.keyboard = new KeyboardSource();
    this.touch = new TouchControls(uiParent);
    this.sources = [this.keyboard, this.touch];

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.touch.setVisible(forceTouch || coarse);
    window.addEventListener('touchstart', () => this.touch.setVisible(true), { once: true, passive: true });
  }

  /** Build this frame's snapshot. */
  sample(): InputState {
    const s = this.state;
    let mx = 0;
    let my = 0;
    let run = false;
    const edges = new Set<string>();
    for (const src of this.sources) {
      mx += src.moveX();
      my += src.moveY();
      run ||= src.runHeld();
      src.edges().forEach((e) => edges.add(e));
    }
    const on = this.enabled;
    s.moveX = on ? clamp(mx) : 0;
    s.moveY = on ? clamp(my) : 0;
    s.runHeld = on && run;
    s.interactPressed = on && edges.has('interact');
    s.actionPressed = on && edges.has('action');
    s.menuPressed = edges.has('menu');
    s.debugKey = on ? this.keyboard.debugKey : null;
    return s;
  }

  /** Called after a fixed step has seen the one-shot presses. */
  consumeEdges(): void {
    for (const src of this.sources) src.consume();
    const s = this.state;
    s.interactPressed = s.actionPressed = s.menuPressed = false;
    s.debugKey = null;
  }
}
