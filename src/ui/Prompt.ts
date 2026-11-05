/**
 * World-anchored UI: the small "E · Read" prompt and the speech bubble.
 * Positions come from the scene (world → screen), so this file never touches Three.js.
 */
export class Prompt {
  private prompt: HTMLElement;
  private bubble: HTMLElement;
  private lastPrompt = '';
  private lastBubble = '';

  constructor(parent: HTMLElement) {
    this.prompt = document.createElement('div');
    this.prompt.className = 'world-prompt';
    this.prompt.innerHTML = '<span class="key-chip">E</span><span class="world-prompt-label"></span>';
    this.bubble = document.createElement('div');
    this.bubble.className = 'speech-bubble panel';
    this.bubble.innerHTML = '<div class="speech-title"></div><div class="speech-body"></div>';
    parent.append(this.prompt, this.bubble);
  }

  show(label: string, x: number, y: number, force = false): void {
    if (force || label !== this.lastPrompt) {
      this.lastPrompt = label;
      this.prompt.querySelector('.world-prompt-label')!.textContent = label;
    }
    this.prompt.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    this.prompt.classList.add('is-shown');
  }

  hide(): void {
    this.prompt.classList.remove('is-shown');
  }

  showBubble(title: string, body: string, x: number, y: number, force = false): void {
    const key = title + body;
    if (force || key !== this.lastBubble) {
      this.lastBubble = key;
      this.bubble.querySelector('.speech-title')!.textContent = title;
      this.bubble.querySelector('.speech-body')!.textContent = body;
    }
    // keep the bubble on-screen horizontally
    const half = this.bubble.offsetWidth / 2 + 12;
    const cx = Math.max(half, Math.min(window.innerWidth - half, x));
    this.bubble.style.setProperty('--tail-offset', `${(x - cx).toFixed(1)}px`);
    this.bubble.style.transform = `translate(${cx.toFixed(1)}px, ${Math.max(this.bubble.offsetHeight + 16, y).toFixed(1)}px) translate(-50%, -100%)`;
    this.bubble.classList.add('is-shown');
  }

  hideBubble(): void {
    this.bubble.classList.remove('is-shown');
    this.lastBubble = '';
  }
}
