/**
 * Debug panel section: the sound test page. A play button for every sound effect, the music's
 * modes and tension, each region's ambience, and level meters for the four buses.
 * A developer tool, so its labels aren't in strings.ts.
 */
import type { GameAudio } from '../audio';
import { SFX_IDS, SOUNDS } from '../audio/sfx/catalog';
import { REGION_IDS } from '../data/regions';
import type { RegionId } from '../data/types';

const BUSES = ['master', 'music', 'sfx', 'ambience'] as const;
/** Meters show −60 dB … 0 dB. */
const FLOOR_DB = -60;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

function buttonRow(items: readonly (readonly [string, () => void])[]): HTMLElement {
  const row = el('div');
  row.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:4px 0';
  for (const [label, run] of items) {
    const b = el('button', { type: 'button', textContent: label });
    b.addEventListener('click', run);
    row.append(b);
  }
  return row;
}

/** `isOpen` says whether the debug panel is showing: the meters only update while it is. */
export function createDebugSound(audio: GameAudio, isOpen: () => boolean): HTMLFieldSetElement {
  const section = el('fieldset');
  section.append(el('legend', { textContent: 'Sound test' }));
  const status = el('div');
  section.append(status);

  const effects = SFX_IDS.filter((id) => id !== 'star').map(
    (id) =>
      [
        SOUNDS[id].label,
        () => {
          audio.play(id);
        },
      ] as const,
  );
  const stars = [1, 2, 3].map(
    (n) =>
      [
        `Star ${n}`,
        () => {
          audio.play('star', n);
        },
      ] as const,
  );
  section.append(el('div', { textContent: 'Effects' }), buttonRow([...effects, ...stars]));

  section.append(
    el('div', { textContent: 'Music' }),
    buttonRow([
      [
        'Title',
        () => {
          audio.setMusic('title');
        },
      ],
      [
        'Night',
        () => {
          audio.setMusic('night');
        },
      ],
      [
        'Tension on',
        () => {
          audio.setTension(true);
        },
      ],
      [
        'Tension off',
        () => {
          audio.setTension(false);
        },
      ],
      [
        'Dawn',
        () => {
          audio.setMusic('dawn');
        },
      ],
      [
        'Fail',
        () => {
          audio.setMusic('fail');
        },
      ],
      [
        'Stop',
        () => {
          audio.setMusic('silent');
        },
      ],
    ]),
  );

  const region = el('select');
  for (const id of REGION_IDS) region.append(new Option(id, id));
  const rain = el('input', { type: 'checkbox' });
  const rainLabel = el('label', { textContent: ' rain' });
  rainLabel.prepend(rain);
  const applySea = (): void => {
    audio.setAmbience({
      region: region.value as RegionId,
      rain: rain.checked ? 1 : 0,
      menu: false,
    });
  };
  region.addEventListener('change', applySea);
  rain.addEventListener('change', applySea);
  const seaRow = el('div');
  seaRow.append(region, rainLabel);
  section.append(el('div', { textContent: 'Ambience' }), seaRow);

  const meters = BUSES.map((bus) => {
    const row = el('div');
    row.style.cssText =
      'display:grid;grid-template-columns:64px 1fr 52px;gap:6px;align-items:center';
    const track = el('div');
    track.style.cssText =
      'height:8px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden';
    const fill = el('div');
    fill.style.cssText = 'height:100%;width:0;background:#9fe0a8;transition:width 60ms linear';
    track.append(fill);
    const value = el('span');
    row.append(el('span', { textContent: bus }), track, value);
    section.append(row);
    return { bus, fill, value };
  });

  const paint = (): void => {
    requestAnimationFrame(paint);
    // Only while the panel is showing: the analysers aren't free.
    if (!isOpen()) return;
    const ctx = audio.engine.ctx;
    status.textContent = ctx
      ? `${ctx.state} · ${audio.engine.activeVoices} voices · music ${audio.music?.mode ?? '-'}${audio.music?.tension ? ' (tense)' : ''}`
      : 'locked: tap anywhere to start sound';
    if (!ctx) return;
    const levels = audio.engine.meters();
    for (const m of meters) {
      const db = levels[m.bus];
      const k = Math.max(0, Math.min(1, (db - FLOOR_DB) / -FLOOR_DB));
      m.fill.style.width = `${(k * 100).toFixed(1)}%`;
      m.fill.style.background = db > -3 ? '#ff8a7a' : db > -12 ? '#ffd27a' : '#9fe0a8';
      m.value.textContent = db <= -100 ? '-∞' : `${db.toFixed(0)} dB`;
    }
  };
  requestAnimationFrame(paint);
  return section;
}
