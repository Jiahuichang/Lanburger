/**
 * Sound effects, synthesized with the Web Audio API: no audio files, every sound is original and
 * tiny. Volume follows `save.settings.sfxVolume` (0 = off). Browsers only allow audio after a user
 * gesture, so the context is created on the first tap / key press and resumed when needed.
 */
export type SfxName = 'correct' | 'streak' | 'wrong' | 'complete' | 'celebrate' | 'tap';

interface Note {
  /** Frequency in Hz. */
  f: number;
  /** Start, seconds after the sound begins. */
  at: number;
  /** Length in seconds. */
  len: number;
  /** Relative loudness 0–1. */
  gain?: number;
  type?: OscillatorType;
}

// Note frequencies (equal temperament, A4 = 440 Hz).
const C5 = 523.25, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, D6 = 1174.66, E6 = 1318.51, G6 = 1567.98;
const E4 = 329.63, C4 = 261.63;

const SOUNDS: Record<SfxName, Note[]> = {
  // a bright two-note "ding-ding" going up
  correct: [
    { f: G5, at: 0, len: 0.12, gain: 0.8 },
    { f: D6, at: 0.09, len: 0.28, gain: 0.9 },
    { f: D6 * 2, at: 0.09, len: 0.18, gain: 0.12, type: 'sine' },
  ],
  // three notes for a run of correct answers
  streak: [
    { f: G5, at: 0, len: 0.1, gain: 0.7 },
    { f: C6, at: 0.08, len: 0.1, gain: 0.8 },
    { f: E6, at: 0.16, len: 0.34, gain: 0.9 },
    { f: E6 * 2, at: 0.16, len: 0.2, gain: 0.12, type: 'sine' },
  ],
  // soft and low, never a buzzer (wrong answers are part of learning)
  wrong: [
    { f: E4, at: 0, len: 0.14, gain: 0.5, type: 'sine' },
    { f: C4, at: 0.12, len: 0.22, gain: 0.45, type: 'sine' },
  ],
  // lesson finished: a little rising fanfare
  complete: [
    { f: C5, at: 0, len: 0.14, gain: 0.7 },
    { f: E5, at: 0.11, len: 0.14, gain: 0.7 },
    { f: G5, at: 0.22, len: 0.14, gain: 0.75 },
    { f: C6, at: 0.33, len: 0.5, gain: 0.9 },
    { f: E6, at: 0.33, len: 0.5, gain: 0.35, type: 'sine' },
    { f: G6, at: 0.45, len: 0.4, gain: 0.2, type: 'sine' },
  ],
  // level up, quest complete, lantern lit
  celebrate: [
    { f: G5, at: 0, len: 0.12, gain: 0.6 },
    { f: A5, at: 0.1, len: 0.12, gain: 0.6 },
    { f: D6, at: 0.2, len: 0.12, gain: 0.7 },
    { f: G6, at: 0.3, len: 0.45, gain: 0.6 },
  ],
  tap: [{ f: E6, at: 0, len: 0.05, gain: 0.25, type: 'sine' }],
};

const MASTER = 0.22;

export class Sfx {
  private ctx: AudioContext | null = null;

  constructor(private volume: () => number) {
    const unlock = () => this.ensure();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  }

  get enabled(): boolean {
    return this.volume() > 0;
  }

  play(name: SfxName): void {
    const v = this.volume();
    if (v <= 0) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.01;
    const out = ctx.createGain();
    out.gain.value = MASTER * v;
    out.connect(ctx.destination);
    for (const n of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type ?? 'triangle';
      osc.frequency.value = n.f;
      const start = t0 + n.at;
      const peak = n.gain ?? 0.8;
      // quick attack, smooth exponential release: a soft "bell", no clicks
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + n.len);
      osc.connect(g).connect(out);
      osc.start(start);
      osc.stop(start + n.len + 0.05);
    }
  }

  /** Create or resume the audio context (must first happen inside a user gesture). */
  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }
}
