/**
 * Hazards that live on the water: thick fog bands, whirlpools and storm waves. All are drawn above the
 * darkness so they read in the dark (faintly), and brighter where the light falls.
 * - Fog band: overlapping soft fog puffs along the band, slowly breathing and drifting.
 * - Whirlpool: spiral arms turning round a dark core ringed in rust (the deadly part), with a faint
 *   dashed circle where the pull begins.
 * - Storm waves: crest lines rolling across the sea in the push direction; a bold arrow by the island
 *   for a few seconds whenever the waves change direction.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { RenderFeelConfig, WhirlpoolConfig } from '../data/types';
import type { FogBand } from '../sim/fog';
import type { World } from '../sim/world';
import type { ArtTextures } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { PALETTE } from './palette';

export interface HazardView {
  setFogColor(color: number): void;
  /** Call when the waves change direction (and when a night starts with waves). */
  showWaveCue(): void;
  draw(world: World, dt: number, time: number): void;
  clear(): void;
  destroy(): void;
}

/** Spacing of fog puffs along a band, as a fraction of its width. */
const PUFF_SPACING = 0.4;

/** A fixed pseudo-random value in [0, 1) for each index (drawing only). */
const scatter = (i: number, salt: number): number => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const SPIRAL_ARMS = 4;
const SPIRAL_POINTS = 14;
/** Area the wave crests cover (world units, a square round the island). */
const WAVE_FIELD = 260;

export function createHazardView(
  layers: { lightFx: Container; reefs: Container },
  textures: ArtTextures,
  whirlpool: WhirlpoolConfig,
  feel: RenderFeelConfig,
): HazardView {
  const fogBox = new Container({ label: 'fogBands' });
  const swirl = new Graphics({ label: 'whirlpools', blendMode: 'add' });
  const cores = new Graphics({ label: 'whirlpoolCores' });
  const waves = new Graphics({ label: 'stormWaves', blendMode: 'add' });
  const cue = new Graphics({ label: 'waveCue' });
  layers.reefs.addChild(cores);
  layers.lightFx.addChild(waves, swirl, fogBox, cue);

  let fogColor: number = PALETTE.fog;
  let bandsSeen: readonly FogBand[] = [];
  let bandCount = 0;
  let cueAge = Infinity;
  /** Puffs per band, rebuilt when the list of bands changes. */
  let puffs: { sprite: Sprite; band: FogBand; along: number; phase: number }[] = [];

  const buildPuffs = (bands: readonly FogBand[]): void => {
    for (const c of fogBox.removeChildren()) c.destroy();
    puffs = [];
    bands.forEach((band, b) => {
      const count = Math.max(2, Math.ceil(band.length / (band.width * PUFF_SPACING)));
      for (let i = 0; i < count; i++) {
        const sprite = new Sprite({ texture: textures.glow, anchor: 0.5 });
        sprite.tint = fogColor;
        fogBox.addChild(sprite);
        puffs.push({ sprite, band, along: i / (count - 1) - 0.5, phase: scatter(i, b + 3) * 40 });
      }
    });
    bandsSeen = bands;
    bandCount = bands.length;
  };

  const drawFog = (world: World, time: number): void => {
    const bands = world.state.fogBands;
    if (bands !== bandsSeen || bands.length !== bandCount) buildPuffs(bands);
    for (const p of puffs) {
      const { band } = p;
      const cos = Math.cos(band.angle);
      const sin = Math.sin(band.angle);
      // Puffs drift slowly up and down the band and breathe in size.
      const drift = Math.sin(time * feel.fogBandDrift + p.phase) * band.width * 0.15;
      const along = p.along * (band.length - band.width * 0.6) + drift;
      const across = Math.sin(time * feel.fogBandDrift * 0.7 + p.phase * 1.3) * band.width * 0.12;
      const x = band.x + cos * along - sin * across;
      const y = band.y + sin * along + cos * across;
      const radius = band.width * (1.05 + 0.12 * Math.sin(time * 0.6 + p.phase));
      p.sprite.position.set(x, y);
      p.sprite.scale.set(radius / GLOW_TEXTURE_RADIUS, (radius * 0.75) / GLOW_TEXTURE_RADIUS);
      const lit = world.isLit(x, y) ? feel.fogBandLitBoost : 0;
      p.sprite.alpha = feel.fogBandAlpha + lit;
    }
  };

  const drawWhirlpools = (world: World, time: number): void => {
    swirl.clear();
    cores.clear();
    const { pullRadius, coreRadius } = whirlpool;
    for (const w of world.state.whirlpools) {
      const lit = world.isLit(w.x, w.y);
      const alpha = lit ? feel.whirlpoolLitAlpha : feel.whirlpoolDarkAlpha;
      const spin = time * feel.whirlpoolSpin;
      for (let arm = 0; arm < SPIRAL_ARMS; arm++) {
        const base = spin + (arm * Math.PI * 2) / SPIRAL_ARMS;
        for (let i = 0; i <= SPIRAL_POINTS; i++) {
          const t = i / SPIRAL_POINTS;
          const r = coreRadius + (pullRadius * 0.95 - coreRadius) * t;
          // Arms curl tighter toward the centre; y squashed for the 2.5D view.
          const a = base + (1 - t) * 3.2;
          const x = w.x + Math.cos(a) * r;
          const y = w.y + Math.sin(a) * r * 0.85;
          if (i === 0) swirl.moveTo(x, y);
          else swirl.lineTo(x, y);
        }
        swirl.stroke({ color: PALETTE.seaCrest, width: 1.6, alpha, cap: 'round' });
      }
      // Where the pull begins: a faint dashed circle.
      const dashes = 24;
      for (let i = 0; i < dashes; i += 2) {
        const a0 = (i / dashes) * Math.PI * 2 + spin * 0.2;
        const a1 = ((i + 1) / dashes) * Math.PI * 2 + spin * 0.2;
        swirl
          .moveTo(w.x + Math.cos(a0) * pullRadius, w.y + Math.sin(a0) * pullRadius * 0.85)
          .lineTo(w.x + Math.cos(a1) * pullRadius, w.y + Math.sin(a1) * pullRadius * 0.85);
      }
      swirl.stroke({ color: PALETTE.seaCrest, width: 1, alpha: alpha * 0.5 });
      // The deadly core: a dark hole (under the darkness) and a rust ring that throbs.
      cores
        .ellipse(w.x, w.y, coreRadius * 1.3, coreRadius * 1.1)
        .fill({ color: 0x03080b, alpha: 0.8 });
      const throb = 0.6 + 0.4 * Math.sin(time * 4);
      swirl
        .ellipse(w.x, w.y, coreRadius, coreRadius * 0.85)
        .stroke({ color: PALETTE.rust, width: 2, alpha: Math.min(1, alpha * 2.4 * throb) });
    }
  };

  const drawWaves = (world: World, dt: number, time: number): void => {
    waves.clear();
    cue.clear();
    const state = world.state.waves;
    if (!state) return;
    const ux = Math.cos(state.angle);
    const uy = Math.sin(state.angle);
    const travel = time * feel.waveSpeed;
    const half = feel.waveCrestLength / 2;
    for (let i = 0; i < feel.waveStreaks; i++) {
      // A fixed scatter of crests, all rolling along the push direction.
      const fx = scatter(i, 1) * 2 - 1;
      const fy = scatter(i, 2) * 2 - 1;
      const span = WAVE_FIELD * 2;
      const along = (((((fy + 1) * WAVE_FIELD + travel) % span) + span) % span) - WAVE_FIELD;
      const acrossPos = fx * WAVE_FIELD;
      const x = ux * along - uy * acrossPos;
      const y = uy * along + ux * acrossPos;
      const fade = 1 - Math.abs(along) / WAVE_FIELD;
      // A slightly bowed crest across the direction of travel.
      waves
        .moveTo(x + uy * half, y - ux * half)
        .quadraticCurveTo(x + ux * 3, y + uy * 3, x - uy * half, y + ux * half)
        .stroke({
          color: PALETTE.seaCrest,
          width: 1.3,
          alpha: feel.waveAlpha * fade,
          cap: 'round',
        });
    }
    cueAge += dt;
    if (cueAge < feel.waveCueSeconds) {
      const t = cueAge / feel.waveCueSeconds;
      const alpha = (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85) * 0.9;
      const r0 = 58 + t * 10;
      const len = 26;
      const [x0, y0] = [ux * r0, uy * r0];
      const [x1, y1] = [x0 + ux * len, y0 + uy * len];
      cue
        .moveTo(x0, y0)
        .lineTo(x1, y1)
        .moveTo(x1 - ux * 8 - uy * 6, y1 - uy * 8 + ux * 6)
        .lineTo(x1, y1)
        .lineTo(x1 - ux * 8 + uy * 6, y1 - uy * 8 - ux * 6)
        .stroke({ color: PALETTE.parchment, width: 2.4, alpha, cap: 'round', join: 'round' });
    }
  };

  return {
    setFogColor(color) {
      fogColor = color;
      for (const p of puffs) p.sprite.tint = color;
    },
    showWaveCue() {
      cueAge = 0;
    },
    draw(world, dt, time) {
      drawFog(world, time);
      drawWhirlpools(world, time);
      drawWaves(world, dt, time);
    },
    clear() {
      for (const c of fogBox.removeChildren()) c.destroy();
      puffs = [];
      bandsSeen = [];
      bandCount = 0;
      cueAge = Infinity;
      swirl.clear();
      cores.clear();
      waves.clear();
      cue.clear();
    },
    destroy() {
      for (const c of [fogBox, swirl, cores, waves, cue]) c.destroy({ children: true });
    },
  };
}
