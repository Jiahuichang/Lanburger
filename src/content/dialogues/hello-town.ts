import type { DialogueGraph } from '../../dialogue/types';

/**
 * Hello Town conversations (R3). English UI text; each NPC's voice follows docs/CHARACTERS.md.
 * Lanburger arrives speaking only "Burger" — learning real languages starts with Maggie's lessons (R4).
 */
const graphs: DialogueGraph[] = [
  {
    id: 'mayor-bun.welcome',
    start: 'a',
    lines: {
      a: { speaker: 'mayor-bun', expression: 'happy', text: "Welcome to Hello Town, Lanburger! I'm Mayor Bun.", next: 'b' },
      b: {
        speaker: 'mayor-bun',
        expression: 'worried',
        text: "I'm afraid our five Word Lanterns have gone dark. Without them, everyone keeps forgetting how to talk to each other!",
        next: 'c',
      },
      c: { speaker: 'lanburger', expression: 'surprised', text: 'Bun?! Bun-bun!', next: 'd' },
      d: {
        speaker: 'mayor-bun',
        expression: 'thinking',
        text: "Hmm. You only speak Burger, don't you? Then you're just the right bun for the job. You can learn right alongside us!",
        choices: [
          { text: 'What do I do first?', next: 'e' },
          { text: 'Bun! (I speak Burger fluently!)', next: 'f' },
        ],
      },
      e: {
        speaker: 'mayor-bun',
        expression: 'happy',
        text: 'Visit Maggie at the Language Academy, the red-roofed building to the west. She will teach you your very first words.',
        set: 'met-mayor',
      },
      f: {
        speaker: 'mayor-bun',
        expression: 'celebrating',
        text: "Ha! Wonderful. Then let's add a few more languages. Off to the Language Academy with you, Maggie is waiting!",
        set: 'met-mayor',
      },
    },
  },
  {
    id: 'mayor-bun.after',
    start: 'a',
    lines: {
      a: { speaker: 'mayor-bun', expression: 'happy', text: 'Maggie at the Language Academy will help you. Good luck, Lanburger! The whole town is counting on you.' },
    },
  },
  {
    id: 'maggie.welcome',
    start: 'a',
    lines: {
      a: { speaker: 'maggie', expression: 'celebrating', text: "Ahh, a new student! Hi hi! I'm Maggie, your teacher!", next: 'b' },
      b: {
        speaker: 'maggie',
        expression: 'happy',
        text: "Oh, you only speak Burger? That's okay! Everyone starts somewhere. I started as a baby who could only say 'ba'.",
        next: 'c',
      },
      c: {
        speaker: 'maggie',
        expression: 'thinking',
        text: 'Our first class is Greetings: saying hello, introducing yourself, and saying goodbye.',
        choices: [
          { text: "I'm ready!", next: 'd' },
          { text: 'Is it hard?', next: 'e' },
        ],
      },
      d: {
        speaker: 'maggie',
        expression: 'worried',
        text: "Ah, wait! I'm still writing the lesson cards... Give me a little more time, okay? Come back soon!",
        set: 'met-maggie',
      },
      e: {
        speaker: 'maggie',
        expression: 'happy',
        text: "Not at all! We'll go step by step, and mistakes are part of learning. I promise it'll be fun!",
        next: 'd',
      },
    },
  },
  {
    id: 'maggie.after',
    start: 'a',
    lines: {
      a: {
        speaker: 'maggie',
        expression: 'celebrating',
        text: "The lessons are almost ready! I've been practicing 'hello' in five languages all morning. My cat is very tired of me.",
      },
    },
  },
  {
    id: 'jeremy.smalltalk',
    start: 'a',
    lines: {
      a: { speaker: 'jeremy', expression: 'neutral', text: '...Oh. Hi.', next: 'b' },
      b: {
        speaker: 'jeremy',
        expression: 'thinking',
        text: "The karts aren't ready yet. I'm tuning the engines.",
        choices: [
          { text: 'Can I help?', next: 'c' },
          { text: 'Do you surf?', next: 'd' },
        ],
      },
      c: { speaker: 'jeremy', expression: 'happy', text: "...Maybe later. When the garage opens, I'll teach you how to read road signs." },
      d: { speaker: 'jeremy', expression: 'happy', text: "...Yes. Every weekend. The river's a bit small for it, though." },
    },
  },
  {
    id: 'jonas.smalltalk',
    start: 'a',
    lines: {
      a: { speaker: 'jonas', expression: 'happy', text: "Hallo! I'm Jonas, the station master.", next: 'b' },
      b: { speaker: 'jonas', expression: 'thinking', text: "No trains until the lanterns shine again. Technically, it's a power problem.", next: 'c' },
      c: {
        speaker: 'jonas',
        expression: 'celebrating',
        text: '...Get it? POWER problem? Because lanterns need... power?',
        choices: [
          { text: 'Haha, good one!', next: 'd' },
          { text: '...No.', next: 'e' },
        ],
      },
      d: { speaker: 'jonas', expression: 'happy', text: "Finally, someone with taste. I'll save you a window seat on the first train." },
      e: { speaker: 'jonas', expression: 'worried', text: "Tough crowd. I'll keep working on it." },
    },
  },
  {
    id: 'summy.smalltalk',
    start: 'a',
    lines: {
      a: { speaker: 'summy', expression: 'happy', text: "Hi hi! I'm Summy. The General Store opens soon!", next: 'b' },
      b: {
        speaker: 'summy',
        expression: 'celebrating',
        text: "I'm sorting the teacups. Look at this one, it has a tiny burger on it. So cute!",
        choices: [
          { text: 'So cute!', next: 'c' },
          { text: 'When do you open?', next: 'd' },
        ],
      },
      c: { speaker: 'summy', expression: 'celebrating', text: "Right?! You get it. You're already my favorite customer." },
      d: {
        speaker: 'summy',
        expression: 'thinking',
        text: "Once you've learned some food words at the Burger Bistro. Then we'll practice prices and numbers. I'll make it quick, promise!",
      },
    },
  },
  {
    id: 'remy.smalltalk',
    start: 'a',
    lines: {
      a: { speaker: 'remy', expression: 'happy', text: "Oh, hey! I'm Remy. I'm sketching the fountain.", next: 'b' },
      b: {
        speaker: 'remy',
        expression: 'worried',
        text: '...Okay, it turned into a burger. Again. Sorry.',
        choices: [
          { text: "It's a great burger.", next: 'c' },
          { text: 'Draw me!', next: 'd' },
        ],
      },
      c: { speaker: 'remy', expression: 'happy', text: "Ha, thanks. I sing, dance, draw... I'm still figuring out which one I'm best at. Maybe all of them?" },
      d: { speaker: 'remy', expression: 'celebrating', text: "You're already a burger. It's perfect. Hold still... done!" },
    },
  },
  {
    id: 'theo.smalltalk',
    start: 'a',
    lines: {
      a: { speaker: 'theo', expression: 'neutral', text: '...', next: 'b' },
      b: { speaker: 'theo', expression: 'neutral', text: "I'm not angry. This is just my face.", next: 'c' },
      c: {
        speaker: 'theo',
        expression: 'thinking',
        text: 'Did you know stars blink in secret code?',
        choices: [
          { text: 'Really?!', next: 'd' },
          { text: 'You made that up.', next: 'e' },
        ],
      },
      d: { speaker: 'theo', expression: 'happy', text: 'No. I made that up. But you believed me for one second, and that second was beautiful.' },
      e: { speaker: 'theo', expression: 'celebrating', text: "...You're good. We're friends now. That's just how it works." },
    },
  },
  {
    id: 'noah.smalltalk',
    start: 'a',
    lines: {
      a: { speaker: 'noah', expression: 'neutral', text: '...Hi.', next: 'b' },
      b: {
        speaker: 'noah',
        expression: 'thinking',
        text: 'This is Mochi. She says hello. I mostly just swim.',
        choices: [
          { text: 'Can I pet Mochi?', next: 'c' },
          { text: 'Where do you swim?', next: 'd' },
        ],
      },
      c: { speaker: 'noah', expression: 'happy', text: '...She would like that. She already likes you more than me.' },
      d: { speaker: 'noah', expression: 'happy', text: 'Right here, in the river. Sometimes I just sit and breathe for a while. You should try it.' },
    },
  },
  {
    id: 'ash.smalltalk',
    start: 'a',
    lines: {
      a: { speaker: 'ash', expression: 'neutral', text: 'Hey, little burger.', next: 'b' },
      b: {
        speaker: 'ash',
        expression: 'happy',
        text: "Want a song? I only know three chords, but they're really good ones.",
        choices: [
          { text: 'Play one!', next: 'c' },
          { text: 'Maybe later.', next: 'd' },
        ],
      },
      c: { speaker: 'ash', expression: 'celebrating', text: '♪ Hello, hello, Hello Town... ♪ That is all I have so far. Thanks for listening.' },
      d: { speaker: 'ash', expression: 'happy', text: "No worries. I'll be right here. I'm always right here." },
    },
  },
];

export const DIALOGUES: Record<string, DialogueGraph> = Object.fromEntries(graphs.map((g) => [g.id, g]));
