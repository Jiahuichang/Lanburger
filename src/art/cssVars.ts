import { palette, radii, fonts, motion } from './tokens';
import { rgba } from './color';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Writes the art-bible tokens to :root so the HTML UI uses exactly the same values as the game. */
export function applyCssTokens(root: HTMLElement = document.documentElement): void {
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`--c-${kebab(key)}`, value);
  }
  root.style.setProperty('--r-panel', `${radii.panel}px`);
  root.style.setProperty('--r-card', `${radii.card}px`);
  root.style.setProperty('--r-pill', `${radii.pill}px`);
  root.style.setProperty('--font-ui', fonts.ui);
  root.style.setProperty('--ms-ui', `${motion.uiMs}ms`);
  root.style.setProperty('--ms-fade', `${motion.sceneFadeMs}ms`);
  root.style.setProperty(
    '--shadow-panel',
    `0 4px 0 ${rgba(palette.woodDeep, 0.35)}, 0 10px 24px ${rgba(palette.ink, 0.22)}`,
  );
  root.style.setProperty('--shadow-button', `0 4px 0 ${palette.woodDeep}`);
  root.style.setProperty('--ink-soft', rgba(palette.ink, 0.7));
  root.style.setProperty('--ink-faint', rgba(palette.ink, 0.18));
  root.style.setProperty('--cream-glass', rgba(palette.cream, 0.82));
}
