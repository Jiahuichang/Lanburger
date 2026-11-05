/** One icon style everywhere (ART_BIBLE §7): 24-unit grid, rounded, ink outline, palette fill via CSS. */
const wrap = (body: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  leaf: wrap(
    '<path class="i-fill-sage" d="M4.5 19.5 C4 11 9 5 19.5 4.5 C20 14 14 19.5 4.5 19.5 Z"/><path class="i-line" d="M5 19 L14 10"/>',
  ),
  acorn: wrap(
    '<path class="i-fill-wood-light" d="M6 11 H18 C18 16 15.5 20 12 20 C8.5 20 6 16 6 11 Z"/><path class="i-fill-wood" d="M5 11 C5 7.5 8 6 12 6 C16 6 19 7.5 19 11 Z"/><path class="i-line" d="M12 6 C12 4.5 13 3.5 14.5 3"/>',
  ),
  energy: wrap('<path class="i-fill-energy" d="M13.5 3 L6 13.5 H11.5 L10.5 21 L18 10.5 H12.5 Z"/>'),
  gear: wrap(
    '<path class="i-fill-cream" d="M12 3.5 L13.6 5.6 L16.2 5 L16.8 7.6 L19.4 8.4 L18.6 11 L20.3 13 L18.2 14.6 L18.6 17.3 L16 17.6 L14.8 20 L12 18.8 L9.2 20 L8 17.6 L5.4 17.3 L5.8 14.6 L3.7 13 L5.4 11 L4.6 8.4 L7.2 7.6 L7.8 5 L10.4 5.6 Z"/><circle class="i-fill-wood-light" cx="12" cy="12" r="3.2"/>',
  ),
  close: wrap('<path class="i-line i-thick" d="M7 7 L17 17 M17 7 L7 17"/>'),
  book: wrap(
    '<path class="i-fill-cream" d="M3.5 6 C6 5 9 5 12 6.5 C15 5 18 5 20.5 6 V18.5 C18 17.5 15 17.5 12 19 C9 17.5 6 17.5 3.5 18.5 Z"/><path class="i-line" d="M12 6.5 V19"/>',
  ),
  rotate: wrap(
    '<rect class="i-fill-cream" x="7" y="3" width="10" height="18" rx="2.5"/><path class="i-line" d="M21 10 C21 6 18.5 3.5 15 3"/><path class="i-line" d="M3 14 C3 18 5.5 20.5 9 21"/>',
  ),
};
