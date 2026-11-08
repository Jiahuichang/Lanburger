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
  /** Something the game does after the conversation, e.g. "lesson:greetings/greetings-1" or "practice". */
  action?: string;
  /** Only offered once this flag is set. */
  requires?: string;
  /** Shown with a check mark once this flag is set. */
  doneIf?: string;
  /**
   * Replaced by generated choices before the conversation starts: "lessons:<topic>" becomes the next
   * lesson of that topic (in the player's language) and a "Replay a lesson" menu.
   */
  expand?: string;
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
  action?: string;
}

export interface DialogueGraph {
  id: string;
  start: string;
  lines: Record<string, DialogueLine>;
}
