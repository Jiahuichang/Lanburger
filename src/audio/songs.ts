/**
 * Song data format for the background-music engine (src/audio/Music.ts). Songs themselves are content
 * and live in src/content/music/. A song is either composed as notes (synthesized live) or points to
 * an audio file that replaces the synthesized version.
 */

export type Instrument = 'flute' | 'pluck' | 'pad' | 'bass' | 'bell';

/** "C5:1 E5:0.5 -:1" — pitch (or "-" for a rest) and length in beats, space separated; "|" between bars is ignored. */
export type NoteLine = string;

/** How the accompaniment is played from the chord of each bar. */
export type Comping = 'waltz' | 'arpeggio8' | 'block';

export interface SongDef {
  id: string;
  /** English title (shown nowhere yet; for credits). */
  title: string;
  bpm: number;
  beatsPerBar: number;
  /** One chord per bar, e.g. "F", "Dm", "Bb", "C7". The song loops after the last bar. */
  chords: string[];
  melody: { instrument: Instrument; line: NoteLine; gain?: number };
  comping: Comping;
  /** Second time through, a bell doubles the melody an octave up (a little variety). */
  sparkleOnRepeat?: boolean;
  /** Optional recorded track (path under public/, e.g. "audio/music/hello-town.mp3"); replaces the synth. */
  file?: string;
}

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F#4" → MIDI number. */
export function midi(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + NOTE_INDEX[m[1]] + acc;
}

export const hz = (midiNote: number) => 440 * Math.pow(2, (midiNote - 69) / 12);

/** Parse a melody line into [startBeat, midi | null, lengthBeats]. */
export function parseLine(line: NoteLine): [number, number | null, number][] {
  const out: [number, number | null, number][] = [];
  let beat = 0;
  for (const tok of line.replace(/\|/g, ' ').split(/\s+/).filter(Boolean)) {
    const [p, d] = tok.split(':');
    const len = Number(d ?? 1);
    out.push([beat, p === '-' ? null : midi(p), len]);
    beat += len;
  }
  return out;
}

const QUALITY: Record<string, number[]> = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus4: [0, 5, 7] };

/** "Bbmaj7" → root MIDI note in octave 3 and the chord's intervals. */
export function chord(name: string): { root: number; intervals: number[] } {
  const m = /^([A-G][#b]?)(.*)$/.exec(name);
  if (!m || !(m[2] in QUALITY)) throw new Error(`bad chord ${name}`);
  return { root: midi(`${m[1]}3`), intervals: QUALITY[m[2]] };
}
