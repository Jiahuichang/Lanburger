import type { EdgeAction, InputSource } from './actions';
import { t } from '../i18n';

/**
 * Landscape touch controls (GAME_DESIGN §4):
 *  - left thumb: floating joystick anywhere in the left zone
 *  - right thumb: Talk (large, contextual label) and Emote
 *  - pushing the stick to the rim runs
 * Uses pointer events + pointerId so every thumb is tracked independently (true multi-touch).
 */
export class TouchControls implements InputSource {
  readonly root: HTMLElement;
  private zone: HTMLElement;
  private base: HTMLElement;
  private knob: HTMLElement;
  private buttons: Record<'interact' | 'action', HTMLButtonElement>;
  private stickId: number | null = null;
  private origin = { x: 0, y: 0 };
  private vec = { x: 0, y: 0 };
  private magnitude = 0;
  private pending = new Set<EdgeAction>();
  private radius = 56;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'touch-controls');
    this.zone = el('div', 'touch-zone-left');
    this.base = el('div', 'joystick');
    this.knob = el('div', 'joystick-knob');
    this.base.append(this.knob);
    this.zone.append(this.base);

    const right = el('div', 'touch-buttons');
    this.buttons = {
      action: button('touch-btn touch-btn--action', 'action'),
      interact: button('touch-btn touch-btn--interact', 'interact'),
    };
    right.append(this.buttons.action, this.buttons.interact);
    this.root.append(this.zone, right);
    parent.append(this.root);

    this.bindStick();
    this.bindButton('interact');
    this.bindButton('action');
    this.relabel();
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setVisible(v: boolean): void {
    this.root.classList.toggle('is-visible', v);
    document.body.classList.toggle('is-touch', v);
  }

  /** Context label for the Interact button (e.g. "Read", "Talk"). */
  setInteractHint(label: string | null): void {
    this.buttons.interact.classList.toggle('is-hinted', !!label);
    this.buttons.interact.querySelector('.touch-btn-label')!.textContent = label ?? t('touch.interact');
  }

  relabel(): void {
    this.buttons.interact.querySelector('.touch-btn-label')!.textContent = t('touch.interact');
    this.buttons.action.querySelector('.touch-btn-label')!.textContent = t('touch.action');
  }

  private bindStick(): void {
    const z = this.zone;
    z.addEventListener('pointerdown', (e) => {
      if (this.stickId !== null) return;
      e.preventDefault();
      this.stickId = e.pointerId;
      capture(z, e.pointerId);
      const r = z.getBoundingClientRect();
      this.origin = { x: e.clientX, y: e.clientY };
      this.base.style.left = `${e.clientX - r.left}px`;
      this.base.style.top = `${e.clientY - r.top}px`;
      this.base.classList.add('is-active');
      this.updateStick(e.clientX, e.clientY);
    });
    z.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stickId) return;
      this.updateStick(e.clientX, e.clientY);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.vec = { x: 0, y: 0 };
      this.magnitude = 0;
      this.knob.style.transform = 'translate(-50%, -50%)';
      this.base.classList.remove('is-active');
      this.base.style.left = '';
      this.base.style.top = '';
    };
    z.addEventListener('pointerup', end);
    z.addEventListener('pointercancel', end);
  }

  private updateStick(x: number, y: number): void {
    let dx = x - this.origin.x;
    let dy = y - this.origin.y;
    const len = Math.hypot(dx, dy);
    if (len > this.radius) {
      dx = (dx / len) * this.radius;
      dy = (dy / len) * this.radius;
    }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    // radial dead zone keeps diagonals smooth for eight-direction walking
    const dead = 0.18;
    const nx = dx / this.radius;
    const ny = -dy / this.radius;
    const m = Math.hypot(nx, ny);
    this.magnitude = m;
    if (m < dead) this.vec = { x: 0, y: 0 };
    else {
      const k = Math.min(1, (m - dead) / (1 - dead)) / m;
      this.vec = { x: nx * k, y: ny * k };
    }
  }

  private bindButton(name: 'interact' | 'action'): void {
    const b = this.buttons[name];
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      capture(b, e.pointerId);
      b.classList.add('is-pressed');
      this.pending.add(name);
    });
    const end = () => b.classList.remove('is-pressed');
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
  }

  moveX(): number {
    return this.vec.x;
  }

  moveY(): number {
    return this.vec.y;
  }

  runHeld(): boolean {
    return this.magnitude > 0.92;
  }

  edges(): Set<EdgeAction> {
    return this.pending;
  }

  consume(): void {
    this.pending.clear();
  }
}

/** Pointer capture can throw for pointers the browser no longer tracks; input must keep working. */
function capture(target: HTMLElement, id: number): void {
  try {
    target.setPointerCapture(id);
  } catch {
    /* ignore */
  }
}

function el(tag: string, cls: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}

const ICONS: Record<string, string> = {
  interact:
    '<svg viewBox="0 0 24 24"><path d="M5 6.5 C5 5 6 4 7.5 4 H16.5 C18 4 19 5 19 6.5 V13 C19 14.5 18 15.5 16.5 15.5 H11 L7 19.5 V15.5 C5.8 15.5 5 14.5 5 13 Z"/></svg>',
  action:
    '<svg viewBox="0 0 24 24"><path d="M12 3.5 L14.2 9 L20 9.3 L15.5 13 L17 18.8 L12 15.6 L7 18.8 L8.5 13 L4 9.3 L9.8 9 Z"/></svg>',
};

function button(cls: string, icon: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = cls;
  b.type = 'button';
  b.innerHTML = `<span class="touch-btn-icon">${ICONS[icon]}</span><span class="touch-btn-label"></span>`;
  return b;
}
