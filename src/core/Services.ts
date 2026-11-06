import type { EventBus } from './EventBus';
import type { SceneManager } from './SceneManager';
import type { InputManager } from '../input/InputManager';
import type { SaveSystem } from '../save/SaveSystem';
import type { UiRoot } from '../ui/UiRoot';
import type { PixelRenderer } from '../render/PixelRenderer';
import type { SupportLanguage, TargetLanguage } from '../learning/types';
import type { ProgressDirector } from '../progress/ProgressDirector';
import type { Sfx } from '../audio/Sfx';
import type { QuestChange } from '../quest/QuestSystem';

export interface GameEvents {
  'scene:entered': { id: string };
  'save:changed': void;
  'language:changed': { target: TargetLanguage; support: SupportLanguage };
  'player:interacted': { targetId: string };
  /** The HUD's Learn button: start a review session. */
  'ui:learn': void;
  'progress:xp': { amount: number };
  'progress:level': { level: number };
  /** Lanburger's look changed (stage or toppings): reload the hero sprite. */
  'hero:changed': void;
  'lantern:lit': { topic: string };
  'quest:changed': { changes: QuestChange[] };
  /** A place was walked up to for the first time. */
  'place:explored': { id: string };
}

export interface DebugFlags {
  debug: boolean;
  forceTouch: boolean;
  /** `?stage=deluxe&toppings=lettuce,cheese` previews hero growth without touching the save. */
  heroPreview?: { stage?: string; toppings?: string[] };
}

/** Everything a scene may use. Passed in, never imported as globals. */
export interface Services {
  pixel: PixelRenderer;
  events: EventBus<GameEvents>;
  scenes: SceneManager;
  input: InputManager;
  save: SaveSystem;
  ui: UiRoot;
  flags: DebugFlags;
  progress: ProgressDirector;
  sfx: Sfx;
}
