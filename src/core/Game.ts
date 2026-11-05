import * as THREE from 'three';
import { palette } from '../art/tokens';
import { EventBus } from './EventBus';
import { GameLoop } from './GameLoop';
import { SceneManager } from './SceneManager';
import type { DebugFlags, GameEvents, Services } from './Services';
import { InputManager } from '../input/InputManager';
import type { SaveSystem } from '../save/SaveSystem';
import type { UiRoot } from '../ui/UiRoot';

/** Owns the renderer, loop, scene manager and the service bundle handed to scenes. */
export class Game {
  readonly services: Services;
  private loop: GameLoop;

  constructor(container: HTMLElement, ui: UiRoot, save: SaveSystem, flags: DebugFlags) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(palette.skyLight);
    container.append(renderer.domElement);

    const events = new EventBus<GameEvents>();
    const input = new InputManager(ui.controlsLayer, flags.forceTouch);
    const services: Services = {
      renderer,
      events,
      input,
      save,
      ui,
      flags,
      scenes: undefined as unknown as SceneManager,
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
      renderer.setSize(w, h, false);
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
