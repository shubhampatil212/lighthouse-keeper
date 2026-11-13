/**
 * Layer 1, the water. Medium and High run the water shader (1 or 3 noise layers; sparkles on High).
 * Low draws a flat gradient with drifting wave sprites instead, like the prototype.
 */
import {
  Container,
  FillGradient,
  Filter,
  GlProgram,
  GpuProgram,
  Graphics,
  Sprite,
  Texture,
  UniformGroup,
} from 'pixi.js';
import type { Viewport } from '../app/viewport';
import type { QualityProfile, RegionPalette } from '../data/types';
import { createRng } from '../sim/rng';
import type { Point } from './art/types';
import { rgb } from './palette';
import {
  WATER_FRAGMENT_GLSL,
  WATER_UNIFORM_NAMES,
  WATER_VERTEX_GLSL,
  WATER_WGSL,
} from './shaders/water';

export interface WaterLight {
  angle: number;
  halfAngle: number;
  range: number;
  glowRadius: number;
}

export interface WaterView {
  readonly container: Container;
  setQuality(profile: QualityProfile): void;
  setPalette(palette: RegionPalette): void;
  resize(vp: Viewport): void;
  /** `lamp` is the lamp glass on screen (CSS px). */
  update(time: number, light: WaterLight, lamp: Point, islandRadius: number): void;
  destroy(): void;
}

type WaterUniforms = Record<(typeof WATER_UNIFORM_NAMES)[number], Float32Array>;

function createWaterFilter(): { filter: Filter; uniforms: WaterUniforms } {
  const group = new UniformGroup(
    Object.fromEntries(
      WATER_UNIFORM_NAMES.map((name) => [
        name,
        { value: new Float32Array(4), type: 'vec4<f32>' as const },
      ]),
    ),
  );
  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: WATER_VERTEX_GLSL,
      fragment: WATER_FRAGMENT_GLSL,
      name: 'water',
      // Phones default to medium precision, which breaks the noise far from the island.
      preferredFragmentPrecision: 'highp',
    }),
    gpuProgram: GpuProgram.from({
      vertex: { source: WATER_WGSL, entryPoint: 'mainVertex' },
      fragment: { source: WATER_WGSL, entryPoint: 'mainFragment' },
    }),
    resources: { waterUniforms: group },
  });
  const uniforms = group.uniforms as WaterUniforms;
  return { filter, uniforms };
}

/** Low quality: wave crests scattered over the sea in world units, drifting gently. */
interface Wave {
  x: number;
  y: number;
  phase: number;
  sprite: Sprite;
}

export function createWater(waveTexture: Texture): WaterView {
  const container = new Container({ label: 'waterView' });
  const surface = new Sprite({ texture: Texture.WHITE, label: 'waterSurface' });
  const { filter, uniforms } = createWaterFilter();
  surface.filters = [filter];
  const flat = new Graphics({ label: 'waterFlat' });
  const waves = new Container({ label: 'waterWaves' });
  container.addChild(surface, flat, waves);

  let palette: RegionPalette | null = null;
  let vp: Viewport | null = null;
  let shader = true;
  let waveList: Wave[] = [];

  const setColor = (target: Float32Array, color: number): void => {
    const [r, g, b] = rgb(color);
    target.set([r, g, b, 1]);
  };

  const drawFlat = (): void => {
    if (!vp || !palette) return;
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: palette.waterDeep },
        { offset: 1, color: palette.waterMid },
      ],
      textureSpace: 'local',
    });
    flat.clear().rect(0, 0, vp.width, vp.height).fill(gradient);
  };

  const buildWaves = (): void => {
    for (const wave of waveList) wave.sprite.destroy();
    waveList = [];
    if (!vp || shader) return;
    const rng = createRng(0x3a7e);
    const halfW = vp.width / 2 / vp.scale + 20;
    const halfH = vp.height / 2 / vp.scale + 20;
    const count = Math.round((halfW * halfH * 4) / 1400);
    for (let i = 0; i < count; i++) {
      const sprite = new Sprite({ texture: waveTexture, anchor: 0.5 });
      sprite.tint = palette?.waterCrest ?? 0xffffff;
      sprite.alpha = rng.range(0.22, 0.42);
      waves.addChild(sprite);
      waveList.push({
        x: rng.range(-halfW, halfW),
        y: rng.range(-halfH, halfH),
        phase: rng.range(0, Math.PI * 2),
        sprite,
      });
    }
  };

  return {
    container,
    setQuality(profile) {
      shader = profile.waterNoiseLayers > 0;
      surface.visible = shader;
      flat.visible = !shader;
      waves.visible = !shader;
      const params = uniforms.uParams;
      params[2] = Math.max(1, profile.waterNoiseLayers);
      params[3] = profile.waterSparkles ? 1 : 0;
      buildWaves();
    },
    setPalette(next) {
      palette = next;
      setColor(uniforms.uDeep, next.waterDeep);
      setColor(uniforms.uMid, next.waterMid);
      setColor(uniforms.uCrest, next.waterCrest);
      drawFlat();
      for (const wave of waveList) wave.sprite.tint = next.waterCrest;
    },
    resize(next) {
      vp = next;
      surface.width = next.width;
      surface.height = next.height;
      drawFlat();
      buildWaves();
    },
    update(time, light, lamp, islandRadius) {
      if (!vp) return;
      if (shader) {
        uniforms.uParams[0] = time;
        uniforms.uParams[1] = vp.scale;
        uniforms.uView.set([vp.centerX, vp.centerY, vp.width, vp.height]);
        uniforms.uBeam.set([light.angle, light.halfAngle, light.range, light.glowRadius]);
        uniforms.uLamp.set([lamp.x, lamp.y, 1, islandRadius]);
        return;
      }
      const s = vp.scale;
      for (const wave of waveList) {
        wave.sprite.position.set(
          vp.centerX + (wave.x + Math.sin(time * 0.5 + wave.phase) * 5) * s,
          vp.centerY + (wave.y + Math.cos(time * 0.3 + wave.phase) * 2) * s,
        );
        wave.sprite.scale.set(s * 0.42);
      }
    },
    destroy() {
      container.destroy({ children: true });
      filter.destroy();
    },
  };
}
