import type { Expression } from '../character/types';

/**
 * Dialogue graphs (GAME_DESIGN §8). Pure data in src/content/dialogues/. Text is English (UI language);
 * target-language learning content arrives through lessons (R4), never through these lines.
 */
export interface DialogueChoice {
  text: string;
  /** Line to jump to; omitted = end the conversation. */
  next?: string;
  /** Save flag set when this choice is picked. */
  set?: string;
}

export interface DialogueLine {
  /** NPC id, or 'lanburger' for the player. */
  speaker: string;
  expression?: Expression;
  text: string;
  /** Next line; omitted (and no choices) = end. */
  next?: string;
  choices?: DialogueChoice[];
  /** Save flag set when this line is shown. */
  set?: string;
}

export interface DialogueGraph {
  id: string;
  start: string;
  lines: Record<string, DialogueLine>;
}
