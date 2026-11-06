import { chord, hz, parseLine, type Instrument, type SongDef } from './songs';

/**
 * Background music (original, synthesized live with Web Audio): a small look-ahead sequencer, five soft
 * instruments, a generated reverb, crossfades between songs, ducking during lessons, and silence while
 * the tab is hidden. A song with a `file` plays that recording instead (for future produced tracks).
 */

interface Ev {
  beat: number;
  inst: Instrument;
  midi: number;
  len: number;
  gain: number;
  /** Only on the second, fourth… time through. */
  repeatOnly?: boolean;
}

interface Playing {
  song: SongDef;
  events: Ev[];
  loopBeats: number;
  spb: number;
  loopStart: number;
  loop: number;
  cursor: number;
  out: GainNode;
  audio?: HTMLAudioElement;
}

const LOOKAHEAD_S = 0.35;
const TICK_MS = 60;
const FADE_S = 0.8;
/** Overall music level before the player's volume (music sits well under sound effects). */
const MASTER = 0.12;
const DUCKED = 0.45;

export class Music {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private current: Playing | null = null;
  private wanted: string | null = null;
  private timer = 0;
  private ducked = false;

  constructor(
    private songs: Record<string, SongDef>,
    private context: () => AudioContext | null,
    private volume: () => number,
    private baseUrl = '',
  ) {
    const unlock = () => this.apply();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') void this.ctx.suspend();
      else void this.ctx.resume();
      const a = this.current?.audio;
      if (a) {
        if (document.visibilityState === 'hidden') a.pause();
        else void a.play().catch(() => {});
      }
    });
  }

  /** Which song should play (null = silence). Safe to call before the first user gesture. */
  play(id: string | null): void {
    this.wanted = id && this.songs[id] ? id : null;
    this.apply();
  }

  /** Quieter while a lesson is open, so the Listen voice and answer sounds stand out. */
  duck(on: boolean): void {
    this.ducked = on;
    if (this.ctx && this.duckGain) this.duckGain.gain.setTargetAtTime(on ? DUCKED : 1, this.ctx.currentTime, 0.25);
    if (this.current?.audio) this.current.audio.volume = this.fileVolume();
  }

  /** Volume setting changed (0 = off). */
  refreshVolume(): void {
    if (this.volume() <= 0) this.stop();
    else this.apply();
    if (this.ctx && this.bus) this.bus.gain.setTargetAtTime(MASTER * this.volume(), this.ctx.currentTime, 0.1);
  }

  get playing(): string | null {
    return this.current?.song.id ?? null;
  }

  // ───────────────────────── internals

  private apply(): void {
    if (this.volume() <= 0) return;
    if (this.current?.song.id === this.wanted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.fadeOut();
    if (this.wanted) this.start(this.songs[this.wanted]);
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    // browsers block audio until the player taps or presses a key; wait for that instead of warning
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    const ctx = this.context();
    if (!ctx) return null;
    this.ctx = ctx;
    this.bus = ctx.createGain();
    this.bus.gain.value = MASTER * this.volume();
    this.duckGain = ctx.createGain();
    this.duckGain.gain.value = this.ducked ? DUCKED : 1;
    this.duckGain.connect(this.bus).connect(ctx.destination);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = impulse(ctx, 2.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    this.reverb.connect(wet).connect(this.duckGain);
    return ctx;
  }

  private start(song: SongDef): void {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + FADE_S);
    out.connect(this.duckGain!);
    out.connect(this.reverb!);
    const spb = 60 / song.bpm;
    const p: Playing = { song, events: [], loopBeats: song.chords.length * song.beatsPerBar, spb, loopStart: ctx.currentTime + 0.1, loop: 0, cursor: 0, out };
    if (song.file) {
      const a = new Audio(`${this.baseUrl}${song.file}`);
      a.loop = true;
      a.volume = this.fileVolume();
      void a.play().catch(() => {});
      p.audio = a;
    } else {
      p.events = arrange(song);
    }
    this.current = p;
    window.clearInterval(this.timer);
    if (!song.file) {
      this.timer = window.setInterval(() => this.schedule(), TICK_MS);
      this.schedule();
    }
  }

  private fadeOut(): void {
    const p = this.current;
    if (!p || !this.ctx) return;
    window.clearInterval(this.timer);
    const t = this.ctx.currentTime;
    p.out.gain.cancelScheduledValues(t);
    p.out.gain.setValueAtTime(Math.max(0.0001, p.out.gain.value), t);
    p.out.gain.exponentialRampToValueAtTime(0.0001, t + FADE_S);
    window.setTimeout(() => p.out.disconnect(), (FADE_S + 2.5) * 1000);
    p.audio?.pause();
    this.current = null;
  }

  private stop(): void {
    this.fadeOut();
  }

  private fileVolume(): number {
    return Math.min(1, this.volume() * (this.ducked ? DUCKED : 1) * 0.6);
  }

  /** Queue every note that starts within the look-ahead window. */
  private schedule(): void {
    const p = this.current;
    const ctx = this.ctx;
    if (!p || !ctx || !p.events.length) return;
    const horizon = ctx.currentTime + LOOKAHEAD_S;
    // fell far behind (e.g. the tab was throttled): skip ahead instead of playing a burst of old notes
    if (p.loopStart + p.loopBeats * p.spb < ctx.currentTime) {
      p.loopStart = ctx.currentTime + 0.05;
      p.cursor = 0;
    }
    for (let guard = 0; guard < 256; guard++) {
      const ev = p.events[p.cursor];
      const t = p.loopStart + ev.beat * p.spb;
      if (t > horizon) break;
      if (t >= ctx.currentTime - 0.02 && (!ev.repeatOnly || p.loop % 2 === 1)) {
        voice(ctx, p.out, ev.inst, hz(ev.midi), Math.max(ctx.currentTime, t), ev.len * p.spb, ev.gain);
      }
      p.cursor++;
      if (p.cursor >= p.events.length) {
        p.cursor = 0;
        p.loop++;
        p.loopStart += p.loopBeats * p.spb;
      }
    }
  }
}

/** Turn a song's chords and melody into one sorted list of notes. */
function arrange(song: SongDef): Ev[] {
  const ev: Ev[] = [];
  const B = song.beatsPerBar;
  song.chords.forEach((name, bar) => {
    const c = chord(name);
    const at = bar * B;
    const tones = c.intervals.map((i) => c.root + i);
    // soft pad: the chord held for the bar, voiced around middle C
    for (const n of tones.slice(0, 3)) ev.push({ beat: at, inst: 'pad', midi: n + 12, len: B, gain: 0.2 });
    // bass on the downbeat (and halfway in 4/4)
    ev.push({ beat: at, inst: 'bass', midi: c.root - 12, len: B === 4 ? 2 : B, gain: 0.55 });
    if (B === 4) ev.push({ beat: at + 2, inst: 'bass', midi: c.root - 12 + 7, len: 2, gain: 0.45 });
    if (song.comping === 'waltz') {
      for (let b = 1; b < B; b++) for (const n of tones.slice(0, 3)) ev.push({ beat: at + b, inst: 'pluck', midi: n + 12, len: 0.6, gain: 0.16 });
    } else if (song.comping === 'arpeggio8') {
      const up = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[0] + 24];
      const order = [0, 1, 2, 3, 2, 1, 2, 1];
      for (let k = 0; k < B * 2; k++) ev.push({ beat: at + k / 2, inst: 'pluck', midi: up[order[k % order.length]], len: 0.9, gain: 0.13 });
    }
  });
  for (const [beat, m, len] of parseLine(song.melody.line)) {
    if (m === null) continue;
    ev.push({ beat, inst: song.melody.instrument, midi: m, len, gain: song.melody.gain ?? 0.5 });
    if (song.sparkleOnRepeat) ev.push({ beat, inst: 'bell', midi: m + 12, len, gain: 0.16, repeatOnly: true });
  }
  return ev.sort((a, b) => a.beat - b.beat);
}

/** One note on one instrument. Every voice ends in silence and cleans itself up. */
function voice(ctx: AudioContext, out: AudioNode, inst: Instrument, f: number, t: number, len: number, gain: number): void {
  const g = ctx.createGain();
  g.connect(out);
  const osc = (type: OscillatorType, freq: number, level = 1, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const og = ctx.createGain();
    og.gain.value = level;
    o.connect(og);
    return { o, og };
  };
  const env = (attack: number, hold: number, release: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + Math.max(attack, hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack, hold) + release);
    return t + Math.max(attack, hold) + release + 0.05;
  };
  let end = t + len;
  const parts: { o: OscillatorNode; og: GainNode }[] = [];
  if (inst === 'flute') {
    // soft breathy lead: sine + a little triangle, with a gentle late vibrato
    parts.push(osc('sine', f), osc('triangle', f, 0.25));
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 5.2;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.005, t + Math.min(0.35, len));
    lfo.connect(depth);
    for (const p of parts) depth.connect(p.o.frequency);
    lfo.start(t);
    end = env(0.05, len * 0.85, 0.18);
    lfo.stop(end);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    for (const p of parts) p.og.connect(lp);
    lp.connect(g);
  } else if (inst === 'pluck') {
    parts.push(osc('triangle', f), osc('sine', f * 2, 0.15));
    end = env(0.006, 0.01, Math.min(0.9, len + 0.3));
    for (const p of parts) p.og.connect(g);
  } else if (inst === 'pad') {
    parts.push(osc('sawtooth', f, 0.5, -7), osc('sawtooth', f, 0.5, 7));
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    for (const p of parts) p.og.connect(lp);
    lp.connect(g);
    end = env(0.4, len, 0.6);
  } else if (inst === 'bass') {
    parts.push(osc('sine', f), osc('triangle', f, 0.35));
    end = env(0.01, len * 0.6, len * 0.5);
    for (const p of parts) p.og.connect(g);
  } else {
    // bell / music box: a clear tone with two quiet overtones and a long ring
    parts.push(osc('sine', f), osc('sine', f * 2, 0.22), osc('sine', f * 3, 0.06));
    end = env(0.004, 0.01, 1.4);
    for (const p of parts) p.og.connect(g);
  }
  for (const p of parts) {
    p.o.start(t);
    p.o.stop(end);
  }
  parts[0].o.onended = () => g.disconnect();
}

/** A soft, generated room reverb (decaying stereo noise), so no impulse file is needed. */
function impulse(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let seed = ch ? 1337 : 4242;
    for (let i = 0; i < len; i++) {
      seed = (seed * 16807) % 2147483647;
      d[i] = ((seed / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
  }
  return buf;
}
