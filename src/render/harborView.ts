/**
 * Harbors, when a night has more than one: each harbor zone is ringed with small lights in its
 * destination color (visible in the dark, like harbor lights on the water), with its shape marker in
 * colorblind mode. A harbor away from the island gets a little wooden pier, seen only in the light.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import { VESSEL_FEEL } from '../data';
import type { HarborDef } from '../data/types';
import type { World } from '../sim/world';
import type { ArtTextures } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { drawMarker, harborLook } from './vesselMarks';

export interface HarborView {
  setNight(world: World): void;
  draw(time: number): void;
  setColorblind(on: boolean): void;
  destroy(): void;
}

const PIER = 0x6b4f33;
const PIER_DARK = 0x3e2d1d;

export function createHarborView(
  layers: { reefs: Container; lightFx: Container },
  textures: ArtTextures,
): HarborView {
  const piers = new Graphics({ label: 'piers' });
  const lights = new Container({ label: 'harborLights' });
  const markers = new Graphics({ label: 'harborMarkers' });
  layers.reefs.addChild(piers);
  layers.lightFx.addChild(lights, markers);

  let harbors: readonly HarborDef[] = [];
  let colorblind = false;

  const build = (): void => {
    piers.clear();
    markers.clear();
    for (const child of lights.removeChildren()) child.destroy();
    if (harbors.length < 2) return;
    harbors.forEach((h, index) => {
      const { color, shape } = harborLook(index, colorblind);
      const n = VESSEL_FEEL.harborLights;
      const away = Math.hypot(h.x, h.y) > h.radius;
      // Around the island the ring sits just off the shore, on the water, where it can be seen.
      const ringRadius = away ? h.radius : h.radius + VESSEL_FEEL.harborLightRadius;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const light = new Sprite({ texture: textures.glow, anchor: 0.5, blendMode: 'add' });
        light.tint = color;
        light.position.set(h.x + Math.cos(a) * ringRadius, h.y + Math.sin(a) * ringRadius * 0.85);
        light.scale.set(VESSEL_FEEL.harborLightRadius / GLOW_TEXTURE_RADIUS);
        lights.addChild(light);
      }
      if (away) {
        // A short pier pointing at the island, planks across it.
        const toIsland = Math.atan2(-h.y, -h.x);
        const c = Math.cos(toIsland);
        const s = Math.sin(toIsland);
        const len = h.radius * 0.9;
        const half = 2.2;
        const corner = (u: number, v: number): [number, number] => [
          h.x + c * u - s * v,
          h.y + s * u + c * v,
        ];
        piers
          .poly([
            ...corner(-len * 0.3, -half),
            ...corner(len, -half),
            ...corner(len, half),
            ...corner(-len * 0.3, half),
          ])
          .fill(PIER)
          .stroke({ color: PIER_DARK, width: 0.6 });
        for (let u = -len * 0.2; u < len; u += 3) {
          piers.moveTo(...corner(u, -half)).lineTo(...corner(u, half));
        }
        piers.stroke({ color: PIER_DARK, width: 0.4 });
      }
      // The harbor's own marker, so the player can match ships to it at a glance.
      // The island's marker sits off its south-west shore, clear of the tower and the jetty.
      const mx = away ? h.x : h.x - ringRadius * 0.8;
      const my = away ? h.y : h.y + ringRadius * 0.75;
      drawMarker(markers, mx, my, VESSEL_FEEL.destinationSize * 1.8, color, shape);
    });
  };

  return {
    setNight(world) {
      harbors = world.setup.harbors;
      build();
    },
    draw(time) {
      lights.children.forEach((light, i) => {
        light.alpha = 0.65 + 0.35 * Math.sin(time * 1.6 + i * 0.9);
      });
      markers.alpha = 0.9;
    },
    setColorblind(on) {
      if (on === colorblind) return;
      colorblind = on;
      build();
    },
    destroy() {
      piers.destroy();
      lights.destroy({ children: true });
      markers.destroy();
    },
  };
}
