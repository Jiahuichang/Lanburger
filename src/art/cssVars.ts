import { palette, radii, fonts, motion, ramps } from './tokens';
import { rgba } from './color';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Writes the art tokens to :root so the HTML UI uses exactly the same values as the game. */
export function applyCssTokens(root: HTMLElement = document.documentElement): void {
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  for (const [key, value] of Object.entries(palette)) set(`--c-${kebab(key)}`, value);
  for (const [key, ramp] of Object.entries(ramps)) ramp.forEach((v, i) => set(`--${kebab(key)}-${i}`, v));
  set('--r-panel', `${radii.panel}px`);
  set('--r-card', `${radii.card}px`);
  set('--r-button', `${radii.button}px`);
  set('--r-pill', `${radii.pill}px`);
  set('--font-ui', fonts.ui);
  set('--ms-ui', `${motion.uiMs}ms`);
  set('--ms-fade', `${motion.sceneFadeMs}ms`);
  set('--panel-glass', rgba(palette.panel, 0.88));
  set('--panel-glass-soft', rgba(palette.panel, 0.72));
  set('--edge-soft', rgba(palette.panelEdge, 0.55));
  set('--edge-faint', rgba(palette.panelEdge, 0.22));
  set('--shadow-panel', `0 3px 0 ${rgba(palette.panelDeep, 0.8)}, 0 8px 22px ${rgba(palette.panelDeep, 0.45)}`);
  set('--shadow-button', `0 3px 0 ${palette.frameDark}`);
  set('--scrim', rgba(palette.panelDeep, 0.55));
  set('--text-soft', palette.textSoft);
}
