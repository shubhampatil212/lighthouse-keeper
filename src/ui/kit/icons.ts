/** Inline SVG icons (drawn in code, no image files), 24×24, using currentColor. */

const icon = (body: string, fill = false): string =>
  `<svg viewBox="0 0 24 24" width="24" height="24" ${
    fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor"'
  } stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  pause: icon(
    '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    true,
  ),
  back: icon('<path d="M15 5l-7 7 7 7"/>'),
  close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
  anchor: icon('<circle cx="12" cy="5" r="2"/><path d="M12 7v13M7 11h10M4 14a8 6 0 0 0 16 0"/>'),
  hull: icon('<path d="M3 10h18l-3 7H6z" fill="currentColor"/><path d="M12 10V4l5 5"/>'),
  horn: icon(
    '<path d="M4 10v4h3l7 5V5L7 10z" fill="currentColor"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/>',
  ),
  flare: icon(
    '<path d="M12 21v-8"/><path d="M12 13l-2-3 2-6 2 6z" fill="currentColor"/><path d="M5 6l2 1.5M19 6l-2 1.5M4 13h2.5M20 13h-2.5"/>',
  ),
  lamp: icon(
    '<path d="M9 21l1.5-12h3L15 21z" fill="currentColor"/><path d="M9.5 9h5M12 3v2M7 5l1.5 1.5M17 5l-1.5 1.5"/>',
  ),
  lock: icon(
    '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ),
  star: icon(
    '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    true,
  ),
  coin: icon(
    '<circle cx="12" cy="12" r="8.5" fill="currentColor"/><path d="M12 7.5v9M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" stroke="#2a1c05"/>',
  ),
  gear: icon(
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  ),
  book: icon('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>'),
  play: icon('<path d="M7 4l13 8-13 8z"/>', true),
  restart: icon('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4"/>'),
  buoy: icon(
    '<path d="M8 18h8l-1-8H9z" fill="currentColor"/><path d="M12 10V5M10 5h4M4 21c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 4 0"/>',
  ),
  check: icon('<path d="M5 12l5 5 9-10"/>'),
} as const;

export type IconId = keyof typeof ICONS;
