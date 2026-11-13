import type { ShopConfig } from './uiTypes';

/**
 * Harbor shop prices from docs/CONTENT.md §4. What each level does lives with the system it changes
 * (BEAM_UPGRADES in beam.ts, ABILITIES in abilities.ts).
 */
export const SHOP: ShopConfig = {
  costGrowth: 0.6,
  roundTo: 5,
  upgrades: [
    { id: 'lens', baseCost: 30, max: 5, unlocksAfter: null },
    { id: 'lamp', baseCost: 30, max: 5, unlocksAfter: null },
    { id: 'gears', baseCost: 25, max: 4, unlocksAfter: null },
    // "Unlocks in 2-1": sold once region 1 is finished, so it can be bought before 2-1.
    { id: 'foghorn', baseCost: 40, max: 3, unlocksAfter: '1-6' },
    { id: 'flares', baseCost: 35, max: 3, unlocksAfter: '2-6' },
  ],
  buoy: { baseCost: 20, perOwned: 10, maxPerRegion: 3 },
};
