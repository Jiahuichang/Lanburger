/**
 * One icon style everywhere (ART_DIRECTION §7): 24-unit grid, chunky shapes, ink outline,
 * palette fills via CSS classes (no hex values here).
 */
const wrap = (body: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  quests: wrap(
    '<path class="i-fill-paper" d="M6 3.5 H16.5 C18 3.5 18.5 4.5 18.5 6 V20.5 H8 C6.5 20.5 5.5 19.5 5.5 18 V4 Z"/><path class="i-line" d="M9 8 H15.5 M9 11.5 H15.5 M9 15 H13"/><path class="i-fill-red" d="M15 17 L19.5 17 L19.5 21.5 L17.25 20 L15 21.5 Z"/>',
  ),
  bag: wrap(
    '<path class="i-fill-wood" d="M4.5 9 C4.5 7.5 5.5 7 7 7 H17 C18.5 7 19.5 7.5 19.5 9 V18.5 C19.5 19.8 18.8 20.5 17.5 20.5 H6.5 C5.2 20.5 4.5 19.8 4.5 18.5 Z"/><path class="i-line" d="M9 7 C9 4.5 10.2 3.5 12 3.5 C13.8 3.5 15 4.5 15 7"/><rect class="i-fill-gold" x="10" y="11" width="4" height="3.5" rx="1"/>',
  ),
  learn: wrap(
    '<path class="i-fill-paper" d="M3.5 6 C6 5 9 5 12 6.5 C15 5 18 5 20.5 6 V18.5 C18 17.5 15 17.5 12 19 C9 17.5 6 17.5 3.5 18.5 Z"/><path class="i-line" d="M12 6.5 V19"/><path class="i-fill-royal" d="M12 6.5 C15 5 18 5 20.5 6 V18.5 C18 17.5 15 17.5 12 19 Z"/>',
  ),
  collection: wrap(
    '<path class="i-fill-gold" d="M12 3.5 L14.4 8.6 L20 9.2 L15.8 13 L17 18.6 L12 15.8 L7 18.6 L8.2 13 L4 9.2 L9.6 8.6 Z"/>',
  ),
  gear: wrap(
    '<path class="i-fill-paper" d="M12 3.5 L13.6 5.6 L16.2 5 L16.8 7.6 L19.4 8.4 L18.6 11 L20.3 13 L18.2 14.6 L18.6 17.3 L16 17.6 L14.8 20 L12 18.8 L9.2 20 L8 17.6 L5.4 17.3 L5.8 14.6 L3.7 13 L5.4 11 L4.6 8.4 L7.2 7.6 L7.8 5 L10.4 5.6 Z"/><circle class="i-fill-wood" cx="12" cy="12" r="3.2"/>',
  ),
  energy: wrap('<path class="i-fill-gold" d="M13.5 3 L6 13.5 H11.5 L10.5 21 L18 10.5 H12.5 Z"/>'),
  speaker: wrap(
    '<path class="i-fill-paper" d="M4 9.5 H8 L13 5 V19 L8 14.5 H4 Z"/><path class="i-line" d="M16 9 C17.5 10.5 17.5 13.5 16 15 M18.5 6.5 C21.5 9.5 21.5 14.5 18.5 17.5"/>',
  ),
  close: wrap('<path class="i-line i-thick" d="M7 7 L17 17 M17 7 L7 17"/>'),
  pin: wrap('<path class="i-fill-red" d="M12 21 C8 16 5.5 12.5 5.5 9.5 C5.5 6 8.5 3.5 12 3.5 C15.5 3.5 18.5 6 18.5 9.5 C18.5 12.5 16 16 12 21 Z"/><circle class="i-fill-paper" cx="12" cy="9.5" r="2.5"/>'),
  rotate: wrap(
    '<rect class="i-fill-paper" x="7" y="3" width="10" height="18" rx="2.5"/><path class="i-line" d="M21 10 C21 6 18.5 3.5 15 3"/><path class="i-line" d="M3 14 C3 18 5.5 20.5 9 21"/>',
  ),
};
