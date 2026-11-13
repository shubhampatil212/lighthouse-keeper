/**
 * Small drawings of every ship, hazard and ability, made in code as SVG: used on the briefing
 * ("new tonight", gently animated) and in the logbook (as a dark silhouette until discovered).
 * Colors follow the ship looks chosen in phase 03 and the palette in docs/ART_AUDIO.md.
 */
import type { IntroId } from '../data/uiTypes';

const WATER =
  '<path class="il-water" d="M2 50c6-3 10-3 15 0s10 3 15 0 10-3 15 0 10 3 15 0" fill="none" stroke="#afd7dc" stroke-width="2" opacity=".6"/>';

/** A side-on boat: hull color, cabin/deck extras and rigging. */
const boat = (hull: string, extras: string, scale = 1): string =>
  `<g class="il-bob" transform="translate(32 44) scale(${scale}) translate(-32 -44)">${extras}<path d="M10 40h44l-6 9H16z" fill="${hull}"/></g>`;

const DRAWINGS: Record<IntroId, string> = {
  fishing: boat(
    '#2f7f86',
    '<path d="M32 14v26" stroke="#e8dfc8" stroke-width="2"/><path d="M33 16l12 20H33z" fill="#e8dfc8"/><circle cx="20" cy="36" r="2.5" fill="#ffc95e"/>',
  ),
  cargo: boat(
    '#b64a35',
    '<rect x="16" y="30" width="9" height="10" fill="#e8a92e"/><rect x="26" y="30" width="9" height="10" fill="#4c6a47"/><rect x="36" y="30" width="9" height="10" fill="#afd7dc"/><rect x="46" y="24" width="5" height="16" fill="#4a453f"/>',
    1.1,
  ),
  sailboat: boat(
    '#e9f1ee',
    '<path d="M32 6v34" stroke="#4a453f" stroke-width="2"/><path d="M33 8l14 30H33z" fill="#fff"/><path d="M31 12L20 36h11z" fill="#dfe8e6"/>',
  ),
  ferry: boat(
    '#123039',
    '<rect x="14" y="28" width="38" height="12" rx="2" fill="#e8dfc8"/><rect x="24" y="19" width="5" height="10" fill="#123039"/><rect x="34" y="19" width="5" height="10" fill="#123039"/><circle cx="18" cy="24" r="3.5" fill="#ffd36e"/>',
    1.1,
  ),
  tugboat: boat(
    '#1c1c1c',
    '<rect x="24" y="28" width="16" height="12" fill="#b64a35"/><rect x="30" y="20" width="5" height="9" fill="#1c1c1c"/>',
    0.9,
  ),
  smuggler: boat(
    '#2a2433',
    '<path d="M32 12v28" stroke="#6b5f73" stroke-width="2"/><path d="M33 14l11 22H33z" fill="#4e4458"/><path d="M36 22h5v5h-5z" fill="#6b5f73"/><circle cx="19" cy="37" r="2" fill="#d0704a"/>',
  ),
  pirate: boat(
    '#1a1418',
    '<path d="M32 8v32" stroke="#4a3a3a" stroke-width="2"/><path d="M33 10l14 26H33z" fill="#2c1f22"/><path d="M31 14L19 34h12z" fill="#7a2a22"/>',
    1.1,
  ),
  reef: `${WATER}<path d="M14 48l6-14 8 4 5-9 9 10 8-2 4 11z" fill="#4a453f"/><path d="M20 34l8 4 5-9 2 6-7 2z" fill="#6c665d"/>`,
  current: `${WATER}<g class="il-drift" fill="none" stroke="#afd7dc" stroke-width="3" stroke-linecap="round"><path d="M8 24h36l-6-6M44 24l-6 6"/><path d="M16 38h36l-6-6M52 38l-6 6"/></g>`,
  fogBand: `${WATER}<g class="il-drift" fill="#9fb8bc"><rect x="4" y="18" width="44" height="7" rx="3.5" opacity=".75"/><rect x="16" y="30" width="44" height="7" rx="3.5" opacity=".55"/><rect x="8" y="42" width="38" height="5" rx="2.5" opacity=".4"/></g>`,
  iceberg: `${WATER}<g class="il-bob"><path d="M14 48l10-26 8 8 6-14 12 32z" fill="#e3f0fb"/><path d="M38 16l12 32H36l4-10z" fill="#b6cfe8"/></g>`,
  lightning:
    '<path d="M10 22a12 10 0 0 1 22-8 10 9 0 0 1 20 6 7 7 0 0 1-2 14H14a8 8 0 0 1-4-12z" fill="#5d6b70"/><path class="il-flash" d="M34 30l-8 14h7l-4 14 13-18h-7l5-10z" fill="#ffe2a0"/>',
  stormWaves:
    '<g class="il-drift" fill="none" stroke="#afd7dc" stroke-width="3" stroke-linecap="round"><path d="M4 30c8-10 16-10 20 0s12 10 20 0 12-10 16 0"/><path d="M4 44c8-10 16-10 20 0s12 10 20 0 12-10 16 0" opacity=".6"/></g>',
  whirlpool:
    '<g class="il-spin" fill="none" stroke="#afd7dc" stroke-width="2.5" stroke-linecap="round"><path d="M32 32m-4 0a4 4 0 1 1 8 0a8 8 0 1 1-16 0a12 12 0 1 1 24 0a16 16 0 1 1-32 0"/></g>',
  secondHarbor: `${WATER}<path d="M16 46V18" stroke="#e8dfc8" stroke-width="2"/><path d="M17 18h14l-4 5 4 5H17z" fill="#d0503c"/><path d="M44 46V22" stroke="#e8dfc8" stroke-width="2"/><path d="M45 22h12l-4 5 4 5H45z" fill="#3f7fd0"/>`,
  foghorn:
    '<path d="M10 26v12h8l16 12V14L18 26z" fill="#e8dfc8"/><g class="il-pulse" fill="none" stroke="#ffc95e" stroke-width="3" stroke-linecap="round"><path d="M40 24a10 10 0 0 1 0 16"/><path d="M46 18a18 18 0 0 1 0 28"/></g>',
  flares:
    '<path d="M32 58V30" stroke="#e8dfc8" stroke-width="2" stroke-dasharray="3 3"/><g class="il-flash"><circle cx="32" cy="20" r="7" fill="#ffe2a0"/><circle cx="32" cy="20" r="14" fill="#ffc95e" opacity=".3"/></g>',
  secondLamp: `${WATER}<path d="M12 46l3-24h6l3 24z" fill="#e8dfc8"/><path d="M14 30h8M13 38h10" stroke="#b64a35" stroke-width="3"/><path d="M40 46l3-20h6l3 20z" fill="#e8dfc8"/><path d="M41.5 34h9" stroke="#b64a35" stroke-width="3"/><circle class="il-pulse" cx="18" cy="19" r="3" fill="#ffc95e"/><circle class="il-pulse" cx="46" cy="23" r="3" fill="#ffc95e"/>`,
  pairs: `${WATER}<g class="il-bob"><path d="M4 38h22l-3 5H7z" fill="#2f7f86"/><path d="M38 38h22l-3 5H41z" fill="#2f7f86"/></g><path d="M28 30l4 4 4-4" stroke="#ffc95e" stroke-width="2" fill="none"/>`,
  rush: `${WATER}<g class="il-drift"><path d="M4 26h16l-2 4H6z" fill="#2f7f86"/><path d="M24 34h16l-2 4H26z" fill="#b64a35"/><path d="M44 42h16l-2 4H46z" fill="#2f7f86"/></g>`,
  finale: `${WATER}<path d="M26 48l3-30h6l3 30z" fill="#e8dfc8"/><path d="M27 28h10M26.5 38h11" stroke="#b64a35" stroke-width="3"/><path d="M8 18a8 7 0 0 1 14-4 7 6 0 0 1 10 4H8z" fill="#5d6b70"/><path class="il-flash" d="M50 8l-5 9h4l-3 9 8-11h-4l3-7z" fill="#ffe2a0"/><circle class="il-pulse" cx="32" cy="15" r="3" fill="#ffc95e"/>`,
};

/** The drawing as a fresh SVG element. `animate` adds gentle motion (off with reduced motion). */
export function illustration(
  id: IntroId,
  options: { animate?: boolean; silhouette?: boolean } = {},
): SVGSVGElement {
  const holder = document.createElement('template');
  holder.innerHTML = `<svg viewBox="0 0 64 64" class="illus">${DRAWINGS[id]}</svg>`;
  const el = holder.content.firstElementChild as SVGSVGElement;
  el.setAttribute('aria-hidden', 'true');
  if (options.animate) el.classList.add('illus--animate');
  if (options.silhouette) el.classList.add('illus--silhouette');
  return el;
}
