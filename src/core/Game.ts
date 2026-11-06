import { EventBus } from './EventBus';
import { GameLoop } from './GameLoop';
import { SceneManager } from './SceneManager';
import type { DebugFlags, GameEvents, Services } from './Services';
import { InputManager } from '../input/InputManager';
import type { SaveSystem } from '../save/SaveSystem';
import type { UiRoot } from '../ui/UiRoot';
import { PixelRenderer } from '../render/PixelRenderer';
import { ProgressDirector } from '../progress/ProgressDirector';

/** Owns the pixel renderer, loop, scene manager and the service bundle handed to scenes. */
export class Game {
  readonly services: Services;
  private loop: GameLoop;

  constructor(container: HTMLElement, ui: UiRoot, save: SaveSystem, flags: DebugFlags) {
    const pixel = new PixelRenderer(container);

    const events = new EventBus<GameEvents>();
    const input = new InputManager(ui.controlsLayer, flags.forceTouch);
    const services: Services = {
      pixel,
      events,
      input,
      save,
      ui,
      flags,
      scenes: undefined as unknown as SceneManager,
      progress: new ProgressDirector(save, events, ui),
    };
    services.scenes = new SceneManager(() => services, ui.fade);
    this.services = services;
    ui.bind(services);

    this.loop = new GameLoop({
      beginFrame: () => input.sample(),
      step: (dt) => {
        if (!services.scenes.isTransitioning) services.scenes.update(dt);
      },
      afterStep: () => input.consumeEdges(),
      render: (alpha, frameDt) => services.scenes.render(alpha, frameDt),
    });

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      pixel.resize(w, h);
      services.scenes.resize(w, h);
    };
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    resize();
  }

  start(): void {
    this.loop.start();
  }
}
