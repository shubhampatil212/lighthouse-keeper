/**
 * Hazards that live on the water: thick fog bands, whirlpools and storm waves. All are drawn above the
 * darkness so they read in the dark (faintly), and brighter where the light falls.
 * - Fog band: overlapping soft fog puffs along the band, slowly breathing and drifting.
 * - Whirlpools (whirlpoolView.ts) and storm waves (waveView.ts).
 */
import { Container, Sprite } from 'pixi.js';
import type { RenderFeelConfig, WhirlpoolConfig } from '../data/types';
import type { FogBand } from '../sim/fog';
import type { World } from '../sim/world';
import type { ArtTextures } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { PALETTE } from './palette';
import { createWaveView } from './waveView';
import { createWhirlpoolView } from './whirlpoolView';

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

export function createHazardView(
  layers: { lightFx: Container; reefs: Container },
  textures: ArtTextures,
  whirlpool: WhirlpoolConfig,
  feel: RenderFeelConfig,
): HazardView {
  const waves = createWaveView(layers.lightFx, scatter, feel);
  const whirlpools = createWhirlpoolView(layers, whirlpool, feel);
  const fogBox = new Container({ label: 'fogBands' });
  layers.lightFx.addChild(fogBox);

  let fogColor: number = PALETTE.fog;
  let bandsSeen: readonly FogBand[] = [];
  let bandCount = 0;
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

  return {
    setFogColor(color) {
      fogColor = color;
      for (const p of puffs) p.sprite.tint = color;
    },
    showWaveCue() {
      waves.showCue();
    },
    draw(world, dt, time) {
      drawFog(world, time);
      whirlpools.draw(world, time);
      waves.draw(world, dt, time);
    },
    clear() {
      for (const c of fogBox.removeChildren()) c.destroy();
      puffs = [];
      bandsSeen = [];
      bandCount = 0;
      waves.clear();
      whirlpools.clear();
    },
    destroy() {
      fogBox.destroy({ children: true });
      waves.destroy();
      whirlpools.destroy();
    },
  };
}
