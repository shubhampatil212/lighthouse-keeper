/**
 * Fog and the beam: how far a beam reaches through fog, and the night-colored shadow the light map
 * draws over the part of a cone that lies behind a fog band (the same rule the simulation uses: a
 * point is dark if the straight path from the lamp crosses fog and it's farther than range × factor).
 */
import type { Graphics } from 'pixi.js';
import type { BeamStats } from '../sim/beam';
import { fogEntry, type FogBand } from '../sim/fog';
import type { Point } from './art/types';

/** Rays sampled across a cone to find where fog cuts it. */
const FOG_RAYS = 28;

/**
 * How far a beam's centre line reaches once fog is counted: the full range, or (if the line passes
 * through a band) no further than the fog range or the band's near edge, whichever is further. The
 * glow in the air, the shaft and the lit water use it, so they stop where the light map's shadow begins.
 */
export function beamReachThroughFog(
  x: number,
  y: number,
  angle: number,
  range: number,
  fog: readonly FogBand[],
  factor: number,
): number {
  let reach = range;
  const ex = x + Math.cos(angle) * range;
  const ey = y + Math.sin(angle) * range;
  for (const band of fog) {
    const t = fogEntry(band, x, y, ex, ey);
    if (t !== null) reach = Math.min(reach, Math.max(range * factor, t * range));
  }
  return reach;
}

/**
 * Adds the shadow of every fog band over one lamp's cone to `g` (as polygons; the caller fills them).
 * `spread` is the cone's half-width in radians including its soft halo.
 */
export function addFogShadow(
  g: Graphics,
  lamp: Point & { angle: number },
  beam: BeamStats,
  spread: number,
  fog: readonly FogBand[],
  factor: number,
): void {
  const reach = beam.range * 1.15;
  const near = beam.range * factor;
  for (const band of fog) {
    let hasPrev = false;
    let a0 = 0;
    let n0 = 0;
    for (let i = 0; i <= FOG_RAYS; i++) {
      const a = lamp.angle - spread + (2 * spread * i) / FOG_RAYS;
      const cx = Math.cos(a);
      const cy = Math.sin(a);
      const t = fogEntry(band, lamp.x, lamp.y, lamp.x + cx * reach, lamp.y + cy * reach);
      if (t === null) {
        hasPrev = false;
        continue;
      }
      const n1 = Math.max(near, t * reach);
      if (hasPrev) {
        const c0 = Math.cos(a0);
        const s0 = Math.sin(a0);
        g.moveTo(lamp.x + c0 * n0, lamp.y + s0 * n0)
          .lineTo(lamp.x + cx * n1, lamp.y + cy * n1)
          .lineTo(lamp.x + cx * reach, lamp.y + cy * reach)
          .lineTo(lamp.x + c0 * reach, lamp.y + s0 * reach)
          .closePath();
      }
      hasPrev = true;
      a0 = a;
      n0 = n1;
    }
  }
}
