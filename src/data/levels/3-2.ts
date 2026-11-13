import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef, wall } from './shape';

/**
 * Region 3, level 2: "Tug duty". Tugboats: light one and it slows the dark ships around it.
 * Shape: traffic in tight convoys from the north-west and the south-east, a tug leading each; reef
 * walls flank both lanes. Keep the tug lit and the convoy waits for you.
 */
export const LEVEL_3_2: LevelDef = {
  id: '3-2',
  name: 'Tug duty',
  region: 'stormStrait',
  seed: 3002,
  ships: [
    ...fleet(1, 1.5, [
      ['tugboat', 315],
      ['fishing', 305],
      ['fishing', 325],
      ['cargo', 315],
    ]),
    ...fleet(18, 1.5, [
      ['tugboat', 135],
      ['fishing', 125],
      ['sailboat', 145],
      ['fishing', 135],
    ]),
    ...fleet(35, 1.5, [
      ['tugboat', 300],
      ['cargo', 320],
      ['fishing', 140],
      ['fishing', 130],
      ['fishing', 310],
    ]),
  ],
  reefs: [wall(96, 285, 2), wall(96, 345, 2), wall(96, 105, 2), wall(96, 165, 2), reef(92, 225)],
  hazards: [{ kind: 'lightning' }],
  current: { angle: bearing(45), strength: 2.5 },
  bonus: { kind: 'saveAllOfType', type: 'tugboat' },
  stars: { ...DEFAULT_STARS, threeStarMaxWrecks: 1 },
};
