/**
 * Placeholder beam: a soft amber cone from the island, drawn once pointing east (angle 0)
 * and rotated each frame. Additive, so it brightens whatever is under it.
 */
import { FillGradient, Graphics } from 'pixi.js';
import type { BeamConfig } from '../data/types';
import { PALETTE } from './palette';

function cone(g: Graphics, range: number, halfAngle: number, alpha: number): void {
  const gradient = new FillGradient({
    type: 'radial',
    center: { x: 0, y: 0 },
    innerRadius: 0,
    outerCenter: { x: 0, y: 0 },
    outerRadius: range,
    colorStops: [
      { offset: 0, color: `rgba(255, 214, 140, ${alpha})` },
      { offset: 0.75, color: `rgba(255, 214, 140, ${alpha * 0.85})` },
      { offset: 1, color: 'rgba(255, 214, 140, 0)' },
    ],
    textureSpace: 'global',
  });
  g.moveTo(0, 0).arc(0, 0, range, -halfAngle, halfAngle).closePath().fill(gradient);
}

export function createBeam(beam: BeamConfig): Graphics {
  const g = new Graphics({ label: 'beam', blendMode: 'add' });
  cone(g, beam.range, beam.halfAngle * 1.5, 0.12);
  cone(g, beam.range, beam.halfAngle, 0.3);
  g.circle(0, 0, beam.islandGlowRadius).fill({ color: PALETTE.lamp, alpha: 0.05 });
  return g;
}
