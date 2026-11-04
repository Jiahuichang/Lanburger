import type * as THREE from 'three';
import type { EventBus } from './EventBus';
import type { SceneManager } from './SceneManager';
import type { InputManager } from '../input/InputManager';
import type { SaveSystem } from '../save/SaveSystem';
import type { UiRoot } from '../ui/UiRoot';
import type { LanguageCode } from '../learning/types';

export interface GameEvents {
  'scene:entered': { id: string };
  'save:changed': void;
  'language:changed': { ui: LanguageCode; target: LanguageCode };
  'player:interacted': { targetId: string };
}

export interface DebugFlags {
  debug: boolean;
  forceTouch: boolean;
}

/** Everything a scene may use. Passed in, never imported as globals. */
export interface Services {
  renderer: THREE.WebGLRenderer;
  events: EventBus<GameEvents>;
  scenes: SceneManager;
  input: InputManager;
  save: SaveSystem;
  ui: UiRoot;
  flags: DebugFlags;
}
