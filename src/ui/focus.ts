/** When a panel closes, take keyboard focus off anything inside it, so game keys reach the game again. */
export function releaseFocus(panel: HTMLElement): void {
  const a = document.activeElement;
  if (a instanceof HTMLElement && panel.contains(a)) a.blur();
}
