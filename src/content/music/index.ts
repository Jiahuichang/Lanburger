import type { SongDef } from '../../audio/songs';

/**
 * Background music (original compositions for Lanburger). Mood reference: warm, nostalgic, loopable
 * town music for a cozy RPG. No melody or arrangement is taken from any existing game.
 * Maps pick a song with `MapSource.music`. To use a produced recording later, add `file`.
 */
const songs: SongDef[] = [
  {
    // A gentle town waltz in F major: flute melody, "oom-pah-pah" plucks, soft pad.
    id: 'hello-town',
    title: 'Hello Town Waltz',
    bpm: 100,
    beatsPerBar: 3,
    chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'F', 'F'],
    melody: {
      instrument: 'flute',
      gain: 0.5,
      line: [
        'A4:1 C5:1 F5:1 | E5:2 D5:1 | D5:1 F5:1 D5:1 | C5:3',
        'A4:1 C5:1 F5:1 | G5:2 E5:1 | F5:1 D5:1 Bb4:1 | C5:2 -:1',
        'D5:1 E5:1 F5:1 | F5:1.5 E5:0.5 D5:1 | C5:1 A4:1 C5:1 | E5:2 G5:1',
        'F5:1 E5:1 D5:1 | G5:1 E5:1 C5:1 | F5:3 | -:3',
      ].join(' | '),
    },
    comping: 'waltz',
    sparkleOnRepeat: true,
  },
  {
    // Inside the Language Academy: a calm music-box tune in C major over rolling arpeggios.
    id: 'academy',
    title: 'Chalk and Sunlight',
    bpm: 84,
    beatsPerBar: 4,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'],
    melody: {
      instrument: 'bell',
      gain: 0.36,
      line: [
        'E5:1 G5:1 C6:1 G5:1 | A5:2 E5:2 | F5:1 A5:1 G5:1 F5:1 | D5:3 -:1',
        'E5:1 G5:1 C6:1 D6:1 | B5:2 G5:2 | A5:1 G5:1 F5:1 E5:1 | D5:2 -:2',
      ].join(' | '),
    },
    comping: 'arpeggio8',
  },
];

export const SONGS: Record<string, SongDef> = Object.fromEntries(songs.map((s) => [s.id, s]));
