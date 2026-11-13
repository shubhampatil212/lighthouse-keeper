import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, reef } from './shape';

/**
 * Region 1, level 1: "First light", the guided tutorial (docs/GDD.md §7).
 * Shape: open water with two lone reefs. Ship 1 arrives straight down the beam; the beam is then
 * swung away while ship 2 comes in past the east reef; then two ships at once.
 */
export const LEVEL_1_1: LevelDef = {
  id: '1-1',
  name: 'First light',
  region: 'harborBay',
  seed: 1001,
  beamStart: bearing(0),
  ships: [
    { type: 'fishing', at: 0.5, angle: bearing(0) },
    { type: 'fishing', at: 16, angle: bearing(100) },
    { type: 'fishing', at: 34, angle: bearing(200) },
    { type: 'fishing', at: 35, angle: bearing(290) },
  ],
  reefs: [reef(95, 95), reef(92, 235)],
  hazards: [],
  current: { angle: bearing(180), strength: 2 },
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
  tutorial: [
    { when: { kind: 'start' }, prompt: 'followLight' },
    {
      when: { kind: 'saved', count: 1 },
      prompt: 'swingBeam',
      hideOnLit: true,
      steerTo: bearing(300),
      steerSeconds: 1.2,
    },
    { when: { kind: 'reefRevealed' }, prompt: 'rocksSeen' },
  ],
};
