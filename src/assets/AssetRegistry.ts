import * as THREE from 'three';
import type { Painted } from './proceduralArt';

/**
 * Keyed, cached asset store (TECH_ARCHITECTURE §2, ASSET_GUIDELINES §2).
 * Phase 1: every key is painted procedurally on first use.
 * Later: `override(key, url)` swaps a key for a hand-drawn PNG without touching gameplay code.
 */
class AssetRegistry {
  private textures = new Map<string, THREE.Texture>();
  private paintedCache = new Map<string, Painted>();
  private overrides = new Map<string, string>();
  private loader = new THREE.TextureLoader();

  texture(key: string, make: () => THREE.Texture): THREE.Texture {
    let t = this.textures.get(key);
    if (!t) {
      t = this.overrides.has(key) ? this.load(this.overrides.get(key)!) : make();
      this.textures.set(key, t);
    }
    return t;
  }

  painted(key: string, make: () => Painted): Painted {
    let p = this.paintedCache.get(key);
    if (!p) {
      p = make();
      const url = this.overrides.get(key);
      if (url) p = { ...p, tex: this.load(url) };
      this.paintedCache.set(key, p);
    }
    return p;
  }

  /** Replace a procedural key with a file from /public/assets (same world size). */
  override(key: string, url: string): void {
    this.overrides.set(key, url);
    this.textures.delete(key);
    this.paintedCache.delete(key);
  }

  private load(url: string): THREE.Texture {
    const t = this.loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
}

export const assets = new AssetRegistry();
