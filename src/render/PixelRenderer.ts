import * as THREE from 'three';
import { palette, pixel } from '../art/tokens';

/** One extra art pixel on every side so the sub-pixel camera shift never reveals an edge. */
const PAD = 1;

/**
 * Pixel-perfect output (ART_DIRECTION §9, IMPLEMENTATION_PLAN §2.1).
 *
 * The world is rendered into a small render target at native art resolution (≈360 px tall), then
 * stretched to the screen by an integer zoom with nearest-neighbor sampling. The camera is snapped
 * to whole art pixels; the leftover fraction shifts the final image by whole *device* pixels, so
 * scrolling stays smooth while every sprite stays on the art grid.
 */
export class PixelRenderer {
  readonly renderer: THREE.WebGLRenderer;
  /** Integer device pixels per art pixel. */
  zoom = 2;
  /** Visible art pixels. */
  viewW = 640;
  viewH = 360;
  /** CSS size and device pixel ratio of the canvas. */
  cssW = 1;
  cssH = 1;
  dpr = 1;
  private deviceW = 1;
  private deviceH = 1;
  private target: THREE.WebGLRenderTarget;
  private blitScene = new THREE.Scene();
  private blitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  private blitMesh: THREE.Mesh;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(palette.void);
    container.append(this.renderer.domElement);

    this.target = new THREE.WebGLRenderTarget(4, 4, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
      colorSpace: THREE.SRGBColorSpace,
    });
    this.blitMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.target.texture }));
    this.blitScene.add(this.blitMesh);
    this.blitCamera.position.z = 1;
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  resize(cssW: number, cssH: number): void {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.deviceW = Math.max(1, Math.round(cssW * this.dpr));
    this.deviceH = Math.max(1, Math.round(cssH * this.dpr));
    this.renderer.setSize(this.deviceW, this.deviceH, false);
    this.renderer.domElement.style.width = `${cssW}px`;
    this.renderer.domElement.style.height = `${cssH}px`;

    let zoom = Math.max(1, Math.round(this.deviceH / pixel.targetViewHeight));
    while (zoom > 1 && this.deviceH / zoom < pixel.minViewHeight) zoom--;
    this.zoom = zoom;
    this.viewW = Math.ceil(this.deviceW / zoom);
    this.viewH = Math.ceil(this.deviceH / zoom);
    this.target.setSize(this.viewW + PAD * 2, this.viewH + PAD * 2);

    const c = this.blitCamera;
    c.left = -this.deviceW / 2;
    c.right = this.deviceW / 2;
    c.top = this.deviceH / 2;
    c.bottom = -this.deviceH / 2;
    c.updateProjectionMatrix();
    this.blitMesh.scale.set((this.viewW + PAD * 2) * zoom, (this.viewH + PAD * 2) * zoom, 1);
  }

  /** Size the world camera to cover the render target (art pixels, y up). */
  fitCamera(camera: THREE.OrthographicCamera): void {
    const w = this.viewW + PAD * 2;
    const h = this.viewH + PAD * 2;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }

  /**
   * Render a world whose camera is centered on (camX, camY) in map pixels (y down).
   * The camera object is positioned here; callers only provide the exact (fractional) center.
   */
  render(scene: THREE.Scene, camera: THREE.OrthographicCamera, camX: number, camY: number): void {
    const rx = Math.round(camX);
    const ry = Math.round(camY);
    camera.position.set(rx, -ry, 100);
    camera.updateMatrixWorld();

    const r = this.renderer;
    r.setRenderTarget(this.target);
    r.clear();
    r.render(scene, camera);
    r.setRenderTarget(null);

    // Align the stretched image to whole device pixels, then shift by the sub-pixel camera remainder.
    const qw = (this.viewW + PAD * 2) * this.zoom;
    const qh = (this.viewH + PAD * 2) * this.zoom;
    const left = Math.floor((this.deviceW - qw) / 2) - Math.round((camX - rx) * this.zoom);
    const top = Math.floor((this.deviceH - qh) / 2) - Math.round((camY - ry) * this.zoom);
    this.blitMesh.position.set(left + qw / 2 - this.deviceW / 2, -(top + qh / 2 - this.deviceH / 2), 0);
    r.render(this.blitScene, this.blitCamera);
  }

  /** Map-pixel → CSS-pixel position (for HTML prompts anchored to the world). */
  worldToCss(x: number, y: number, camX: number, camY: number): { x: number; y: number } {
    return {
      x: ((x - camX) * this.zoom + this.deviceW / 2) / this.dpr,
      y: ((y - camY) * this.zoom + this.deviceH / 2) / this.dpr,
    };
  }

  compile(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.compile(scene, camera);
    this.renderer.compile(this.blitScene, this.blitCamera);
  }
}
