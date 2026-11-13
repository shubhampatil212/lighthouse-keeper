/**
 * Layer 7, the beam's light effects (additive, drawn above the darkness): the beam glowing in the night
 * air, the volumetric shaft from the lamp glass down along the beam, the lamp's bloom, and the lamp
 * glass flickering slightly. A second lighthouse gets its own glow in the air, bloom and glass (no
 * shaft: it's smaller and further away).
 */
import { Container, MeshSimple, Sprite, Texture } from 'pixi.js';
import type { RenderFeelConfig } from '../data/types';
import type { BeamStats } from '../sim/beam';
import type { ArtProvider } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { PALETTE } from './palette';

export interface BeamFx {
  readonly container: Container;
  draw(angle: number, beam: BeamStats, time: number): void;
  /** The second lighthouse's beam (null = the level has none). */
  drawSecond(
    lamp: { x: number; y: number; angle: number } | null,
    beam: BeamStats,
    time: number,
  ): void;
  destroy(): void;
}

/** A 1-pixel-high strip fading from full to nothing, stretched along the shaft. */
function fadeStrip(): Texture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 1;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 1);
  }
  return Texture.from(c);
}

/** Slow, uneven flicker between -1 and 1 (a few sines, so it never visibly repeats). */
const flicker = (t: number): number =>
  Math.sin(t * 7.3) * 0.5 + Math.sin(t * 13.1 + 1.7) * 0.3 + Math.sin(t * 2.9 + 0.4) * 0.2;

export function createBeamFx(art: ArtProvider, feel: RenderFeelConfig): BeamFx {
  const container = new Container({ label: 'beamFx' });
  const air = new Sprite({ label: 'beamAir', blendMode: 'add' });
  air.tint = PALETTE.lamp;
  air.alpha = 0.2;

  const strip = fadeStrip();
  // Vertices: lamp left, far left, far right, lamp right. u runs from the lamp (0) to the far end (1).
  const shaft = new MeshSimple({
    texture: strip,
    vertices: new Float32Array(8),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  shaft.blendMode = 'add';
  shaft.tint = PALETTE.lampHot;
  shaft.alpha = feel.shaftAlpha;

  const bloom = new Sprite({ texture: art.textures.glow, anchor: 0.5, blendMode: 'add' });
  bloom.tint = 0xffe6b0;
  const glass = art.island.createLampGlass();
  glass.blendMode = 'add';
  glass.tint = PALETTE.lampHot;
  container.addChild(air, shaft, bloom, glass);

  const lamp = art.island.lampPoint;
  bloom.position.set(lamp.x, lamp.y);

  // The second lighthouse: the main tower's lamp drawn smaller, standing on its islet.
  const small = art.island.secondTowerScale;
  const second = new Container({ label: 'secondBeamFx', visible: false });
  const air2 = new Sprite({ label: 'beamAir2', blendMode: 'add' });
  air2.tint = PALETTE.lamp;
  air2.alpha = 0.2;
  const bloom2 = new Sprite({ texture: art.textures.glow, anchor: 0.5, blendMode: 'add' });
  bloom2.tint = 0xffe6b0;
  bloom2.position.set(lamp.x * small, lamp.y * small);
  const glass2 = art.island.createLampGlass();
  glass2.blendMode = 'add';
  glass2.tint = PALETTE.lampHot;
  glass2.scale.set(small);
  const lamp2Glass = new Container();
  lamp2Glass.addChild(bloom2, glass2);
  second.addChild(air2, lamp2Glass);
  container.addChild(second);

  const coneAir = (sprite: Sprite, beam: BeamStats, angle: number): void => {
    const shape = art.beamCone(beam.halfAngle, feel.beamHaloWidth, 0);
    sprite.texture = shape.texture;
    sprite.anchor.set(shape.anchorX, shape.anchorY);
    sprite.scale.set(
      (shape.reach * beam.range) / shape.texture.width,
      (shape.heightPerRange * beam.range) / shape.texture.height,
    );
    sprite.rotation = angle;
  };

  return {
    container,
    draw(angle, beam, time) {
      coneAir(air, beam, angle);

      const reach = beam.range * feel.shaftReach;
      const h = beam.halfAngle * 0.9;
      const v = shaft.vertices;
      v[0] = lamp.x - 2.5;
      v[1] = lamp.y;
      v[2] = Math.cos(angle - h) * reach;
      v[3] = Math.sin(angle - h) * reach;
      v[4] = Math.cos(angle + h) * reach;
      v[5] = Math.sin(angle + h) * reach;
      v[6] = lamp.x + 2.5;
      v[7] = lamp.y;
      shaft.vertices = v;

      const f = flicker(time) * feel.lampFlicker;
      bloom.scale.set((feel.bloomRadius * (1 + f)) / GLOW_TEXTURE_RADIUS);
      bloom.alpha = 0.85 + f;
      glass.alpha = 0.55 + f * 3;
    },
    drawSecond(lampState, beam, time) {
      second.visible = lampState !== null;
      if (!lampState) return;
      second.position.set(lampState.x, lampState.y);
      coneAir(air2, beam, lampState.angle);
      const f = flicker(time + 3.1) * feel.lampFlicker;
      bloom2.scale.set((feel.bloomRadius * small * (1 + f)) / GLOW_TEXTURE_RADIUS);
      bloom2.alpha = 0.8 + f;
      glass2.alpha = 0.55 + f * 3;
    },
    destroy() {
      container.destroy({ children: true });
      strip.destroy(true);
    },
  };
}
