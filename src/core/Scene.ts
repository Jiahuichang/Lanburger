import type { Services } from './Services';

export interface SceneContext {
  services: Services;
  params?: Record<string, unknown>;
}

/** Every RPG map and every mini-game is a Scene. */
export interface Scene {
  readonly id: string;
  enter(ctx: SceneContext): void | Promise<void>;
  exit(): void;
  update(dt: number): void;
  render(alpha: number, frameDt: number): void;
  resize(width: number, height: number): void;
}

export type SceneFactory = () => Scene;

/** Where to put the player back after a mini-game (MINIGAME_DESIGN §1). */
export interface ReturnPoint {
  sceneId: string;
  mapId: string;
  x: number;
  y: number;
  facing: 1 | -1;
}
