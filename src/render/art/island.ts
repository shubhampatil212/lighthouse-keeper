/** Placeholder island shape, drawn in world units around (0, 0). Phase 03 replaces it with the full island. */
import { Graphics } from 'pixi.js';
import type { IslandShape } from '../../data/types';
import { PALETTE } from '../palette';

export function createIsland(shape: IslandShape): Graphics {
  const r = shape.radius;
  return new Graphics({ label: 'island' })
    .ellipse(0, 6, r + 7, (r + 5) * 0.9)
    .fill({ color: PALETTE.seaCrest, alpha: 0.25 })
    .ellipse(0, 6, r, r * 0.88)
    .fill(0x2b2925)
    .ellipse(0, 0, r, r * 0.88)
    .fill(PALETTE.stone)
    .ellipse(-3, -2, r * 0.72, r * 0.6)
    .fill(PALETTE.moss)
    .circle(-3, -2, 5)
    .fill(PALETTE.lampHot);
}
