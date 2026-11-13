/**
 * Storm waves: crest lines rolling across the sea in the push direction, and a bold arrow by the
 * island for a few seconds whenever the waves change direction. The crest shape is drawn once and
 * shared by every crest; each frame they only move and fade.
 */
import { Container, Graphics, GraphicsContext } from 'pixi.js';
import type { RenderFeelConfig } from '../data/types';
import type { World } from '../sim/world';
import { PALETTE } from './palette';

/** Area the wave crests cover (world units, a square round the island). */
const WAVE_FIELD = 260;

export interface WaveView {
  /** Call when the waves change direction (and when a night starts with waves). */
  showCue(): void;
  draw(world: World, dt: number, time: number): void;
  clear(): void;
  destroy(): void;
}

export function createWaveView(
  layer: Container,
  scatter: (i: number, salt: number) => number,
  feel: RenderFeelConfig,
): WaveView {
  const half = feel.waveCrestLength / 2;
  // A slightly bowed crest across the direction of travel (+x).
  const crest = new GraphicsContext()
    .moveTo(0, -half)
    .quadraticCurveTo(3, 0, 0, half)
    .stroke({ color: PALETTE.seaCrest, width: 1.3, cap: 'round' });
  const crests = new Container({ label: 'stormWaves', visible: false });
  for (let i = 0; i < feel.waveStreaks; i++) {
    crests.addChild(new Graphics({ context: crest, blendMode: 'add' }));
  }
  const cue = new Graphics({ label: 'waveCue' });
  layer.addChild(crests, cue);
  let cueAge = Infinity;

  return {
    showCue() {
      cueAge = 0;
    },
    draw(world, dt, time) {
      const state = world.state.waves;
      crests.visible = state !== null;
      cue.clear();
      if (!state) return;
      const ux = Math.cos(state.angle);
      const uy = Math.sin(state.angle);
      const travel = time * feel.waveSpeed;
      const span = WAVE_FIELD * 2;
      const children = crests.children;
      for (let i = 0; i < children.length; i++) {
        const g = children[i];
        if (!g) continue;
        // A fixed scatter of crests, all rolling along the push direction.
        const fx = scatter(i, 1) * 2 - 1;
        const fy = scatter(i, 2) * 2 - 1;
        const along = (((((fy + 1) * WAVE_FIELD + travel) % span) + span) % span) - WAVE_FIELD;
        const acrossPos = fx * WAVE_FIELD;
        g.position.set(ux * along - uy * acrossPos, uy * along + ux * acrossPos);
        g.rotation = state.angle;
        g.alpha = feel.waveAlpha * (1 - Math.abs(along) / WAVE_FIELD);
      }
      cueAge += dt;
      if (cueAge >= feel.waveCueSeconds) return;
      const t = cueAge / feel.waveCueSeconds;
      const alpha = (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85) * 0.9;
      const r0 = 58 + t * 10;
      const len = 26;
      const x0 = ux * r0;
      const y0 = uy * r0;
      const x1 = x0 + ux * len;
      const y1 = y0 + uy * len;
      cue
        .moveTo(x0, y0)
        .lineTo(x1, y1)
        .moveTo(x1 - ux * 8 - uy * 6, y1 - uy * 8 + ux * 6)
        .lineTo(x1, y1)
        .lineTo(x1 - ux * 8 + uy * 6, y1 - uy * 8 - ux * 6)
        .stroke({ color: PALETTE.parchment, width: 2.4, alpha, cap: 'round', join: 'round' });
    },
    clear() {
      cueAge = Infinity;
      crests.visible = false;
      cue.clear();
    },
    destroy() {
      crests.destroy({ children: true });
      cue.destroy();
      crest.destroy();
    },
  };
}
