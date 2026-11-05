import * as THREE from 'three';
import type { Scene, SceneContext, ReturnPoint } from '../core/Scene';
import type { Services } from '../core/Services';
import { layers, palette, world } from '../art/tokens';
import { CharacterView } from '../character/CharacterView';
import { PlayerController, TUNING } from '../character/PlayerController';
import { loadHeroSprite } from '../character/heroManifest';
import { ANIM_STATES } from '../character/types';
import { t } from '../i18n';
import { Physics } from './Physics';
import { ParallaxBackground } from './ParallaxBackground';
import { Particles } from './Particles';
import type { InteractableDef, MapDefinition } from './maps/types';
import { mossbrook } from './maps/mossbrook';

const MAPS: Record<string, MapDefinition> = { mossbrook };

const CAMERA_LOOKAHEAD = 70;

/** Generic side-scrolling RPG map scene (TECH_ARCHITECTURE §2, §3). */
export class WorldScene implements Scene {
  readonly id = 'world';
  private s!: Services;
  private map!: MapDefinition;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  private parallax!: ParallaxBackground;
  private particles!: Particles;
  private physics!: Physics;
  private player!: PlayerController;
  private view!: CharacterView;
  private cam = { x: 0, y: 0, look: 0 };
  private viewW = 1;
  private viewH = world.viewHeight;
  private pxW = 1;
  private pxH = 1;
  private nearby: InteractableDef | null = null;
  private bubbleFor: InteractableDef | null = null;
  private saveTimer = 0;
  private debugBody?: THREE.LineSegments;
  private unsub: (() => void)[] = [];

  async enter(ctx: SceneContext): Promise<void> {
    this.s = ctx.services;
    const save = this.s.save.data;
    const rp = ctx.params?.returnPoint as ReturnPoint | undefined;
    const mapId = rp?.mapId ?? save.location.mapId;
    this.map = MAPS[mapId] ?? mossbrook;

    this.physics = new Physics(this.map.solids, this.map.platforms, { minX: 20, maxX: this.map.width - 20 });
    this.parallax = new ParallaxBackground(this.scene, this.map);
    this.particles = new Particles(save.settings.reducedMotion);
    this.scene.add(this.particles.object);

    const start = rp ?? (save.location.mapId === this.map.id ? save.location : { ...this.map.spawn, facing: 1 as const });
    const sx = clamp(start.x, 40, this.map.width - 40);
    const sy = Math.max(0, start.y);
    this.player = new PlayerController(this.physics, sx, sy);
    this.player.facing = start.facing ?? 1;

    this.view = new CharacterView(await loadHeroSprite());
    this.view.object.position.set(sx, sy, layers.play.z + 10);
    this.view.object.traverse((o) => (o.renderOrder = layers.play.order));
    this.scene.add(this.view.object);

    this.cam.x = sx;
    this.cam.y = this.map.restCameraY;

    if (this.s.flags.debug) this.buildDebug();
    // compile shaders during the splash/fade instead of on the first gameplay frame
    this.s.renderer.compile(this.scene, this.camera);
    this.unsub.push(this.s.events.on('language:changed', () => this.refreshPrompt(true)));
    this.s.ui.hud.showHint(true);
  }

  exit(): void {
    this.persistLocation();
    this.s.save.flush();
    this.s.ui.prompt.hide();
    this.s.ui.prompt.hideBubble();
    this.unsub.forEach((u) => u());
    this.view.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
  }

  update(dt: number): void {
    const input = this.s.input.state;
    if (input.menuPressed) this.s.ui.settings.toggle();

    if (this.s.flags.debug && input.debugKey) {
      this.player.forceState(ANIM_STATES[input.debugKey - 1]);
    }

    this.player.update(dt, input);
    for (const e of this.player.events) {
      if (e.type === 'jump') this.view.impulse(-0.08);
      if (e.type === 'land') this.view.impulse(Math.min(0.12, e.impact / 7000));
    }
    if (input.moveX !== 0 || input.jumpPressed) this.s.ui.hud.showHint(false);

    // interactions
    const b = this.player.body;
    this.nearby = null;
    let best = Infinity;
    for (const it of this.map.interactables) {
      const d = Math.hypot(b.x - it.x, (b.y - it.y) * 1.5);
      if (d < it.radius && d < best) {
        best = d;
        this.nearby = it;
      }
    }
    if (input.interactPressed && this.nearby && this.player.onGround) {
      this.player.facing = this.nearby.x >= b.x ? 1 : -1;
      this.player.playEmote('interact');
      this.bubbleFor = this.nearby;
      this.s.events.emit('player:interacted', { targetId: this.nearby.id });
    } else if (input.actionPressed && this.player.onGround && !this.player.busy) {
      this.player.playEmote('celebrate');
    }
    if (this.bubbleFor && (!this.nearby || this.nearby.id !== this.bubbleFor.id)) {
      this.bubbleFor = null;
      this.s.ui.prompt.hideBubble();
    }

    this.saveTimer += dt;
    if (this.saveTimer > 1) {
      this.saveTimer = 0;
      this.persistLocation();
    }
  }

  render(alpha: number, frameDt: number): void {
    const p = this.player;
    const x = lerp(p.prevX, p.body.x, alpha);
    const y = lerp(p.prevY, p.body.y, alpha);

    this.view.play(p.animState, p.facing, p.animSpeed);
    this.view.update(frameDt);
    this.view.object.position.set(x, y, layers.play.z + 10);
    const ground = this.physics.surfaceBelow(x, y + 1);
    this.view.setGroundDistance(ground === null ? null : y - ground);

    // camera: smoothed follow with look-ahead, clamped to the map
    const k = 1 - Math.exp(-frameDt * 6);
    const lookTarget = p.facing * CAMERA_LOOKAHEAD * Math.min(1, Math.abs(p.body.vx) / TUNING.runSpeed + 0.3);
    this.cam.look += (lookTarget - this.cam.look) * (1 - Math.exp(-frameDt * 2.5));
    const halfW = this.viewW / 2;
    const tx = clamp(x + this.cam.look, halfW, Math.max(halfW, this.map.width - halfW));
    const ty = Math.max(this.map.restCameraY, y + 60);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * (1 - Math.exp(-frameDt * 4));
    this.camera.position.set(this.cam.x, this.cam.y, 200);

    this.parallax.update(frameDt, this.cam.x, this.cam.y, this.viewW, this.viewH);
    this.particles.update(frameDt, this.cam.x, this.cam.y, this.viewW, this.viewH);
    if (this.debugBody) this.debugBody.position.set(p.body.x, p.body.y, 59);

    this.refreshPrompt(false);
    this.s.renderer.render(this.scene, this.camera);
  }

  resize(w: number, h: number): void {
    this.pxW = w;
    this.pxH = h;
    this.viewH = world.viewHeight;
    this.viewW = world.viewHeight * (w / h);
    const c = this.camera;
    c.left = -this.viewW / 2;
    c.right = this.viewW / 2;
    c.top = this.viewH / 2;
    c.bottom = -this.viewH / 2;
    c.updateProjectionMatrix();
    this.particles?.setPixelScale((h * this.s.renderer.getPixelRatio()) / this.viewH);
  }

  private refreshPrompt(force: boolean): void {
    const ui = this.s.ui;
    const it = this.nearby;
    this.s.input.touch.setInteractHint(it ? t(it.promptKey) : null);
    if (!it) {
      ui.prompt.hide();
      return;
    }
    const top = this.toScreen(it.x, it.y + (it.id === 'grove-gate' ? 280 : 165));
    if (this.bubbleFor) {
      ui.prompt.hide();
      ui.prompt.showBubble(t(this.bubbleFor.titleKey), t(this.bubbleFor.bodyKey), top.x, top.y, force);
    } else {
      ui.prompt.show(t(it.promptKey), top.x, top.y, force);
    }
  }

  private toScreen(x: number, y: number): { x: number; y: number } {
    const v = new THREE.Vector3(x, y, 0).project(this.camera);
    return { x: ((v.x + 1) / 2) * this.pxW, y: ((1 - v.y) / 2) * this.pxH };
  }

  private persistLocation(): void {
    const b = this.player.body;
    this.s.save.update((d) => {
      d.location = { mapId: this.map.id, x: Math.round(b.x), y: Math.round(this.player.onGround ? b.y : 0), facing: this.player.facing };
    }, false);
  }

  private buildDebug(): void {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: palette.berry });
    const box = (x: number, y: number, w: number, h: number) => {
      const geo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h));
      const l = new THREE.LineSegments(geo, mat);
      l.position.set(x + w / 2, y + h / 2, 59);
      g.add(l);
    };
    for (const s of this.map.solids) box(s.x, s.y, s.w, s.h);
    for (const p of this.map.platforms) box(p.x, p.y - 2, p.w, 4);
    const bodyGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(TUNING.bodyWidth, TUNING.bodyHeight).translate(0, TUNING.bodyHeight / 2, 0));
    this.debugBody = new THREE.LineSegments(bodyGeo, new THREE.LineBasicMaterial({ color: palette.energy }));
    g.add(this.debugBody);
    g.traverse((o) => (o.renderOrder = 999));
    this.scene.add(g);
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
