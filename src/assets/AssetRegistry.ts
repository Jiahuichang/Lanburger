import type * as THREE from 'three';
import { pixelTexture } from '../art/pixel';

/** A sprite image with its anchor (the pixel that sits on the ground point). */
export interface SpriteImage {
  canvas: HTMLCanvasElement;
  tex: THREE.Texture;
  w: number;
  h: number;
  anchor: { x: number; y: number };
  /** Light points relative to the anchor, if the art has any (lit windows). */
  lights?: { dx: number; dy: number; radius: number }[];
}

/**
 * Keyed, cached asset store (ART_DIRECTION §3).
 * R1/R2: every key is painted procedurally by the pixel painter on first use.
 * Later: `override(key, url)` swaps a key for a hand-made PNG of the same size and anchor,
 * without touching gameplay code. All textures use nearest filtering.
 */
class AssetRegistry {
  private sprites = new Map<string, SpriteImage>();
  private overrides = new Map<string, HTMLImageElement>();

  sprite(key: string, make: () => Pick<SpriteImage, 'canvas' | 'anchor' | 'lights'>): SpriteImage {
    let s = this.sprites.get(key);
    if (!s) {
      const made = make();
      const img = this.overrides.get(key);
      const source = img ?? made.canvas;
      s = {
        canvas: made.canvas,
        tex: pixelTexture(source),
        w: made.canvas.width,
        h: made.canvas.height,
        anchor: made.anchor,
        lights: made.lights,
      };
      this.sprites.set(key, s);
    }
    return s;
  }

  /** Replace a procedural key with a PNG from /public (same size and anchor). Call before first use. */
  async override(key: string, url: string): Promise<void> {
    const img = new Image();
    img.src = url;
    await img.decode();
    this.overrides.set(key, img);
    this.sprites.delete(key);
  }
}

export const assets = new AssetRegistry();
