import type { CampaignRegionDef, ChartConfig } from './uiTypes';

/**
 * The campaign's five regions and thirty levels (docs/CONTENT.md §6), in play order.
 * Each level's night is in levels/<region>-<n>.ts.
 */
export const CAMPAIGN: readonly CampaignRegionDef[] = [
  {
    id: 'harborBay',
    building: 'cottage',
    chart: { x: 36, y: 80 },
    levels: [
      { id: '1-1', name: 'First light', introduces: 'reef' },
      { id: '1-2', name: 'The cargo run', introduces: 'cargo' },
      { id: '1-3', name: 'Two at once', introduces: 'pairs' },
      { id: '1-4', name: 'Offshore breeze', introduces: 'sailboat' },
      { id: '1-5', name: 'Rush hour', introduces: 'rush' },
      { id: '1-6', name: 'First storm', introduces: 'finale' },
    ],
  },
  {
    id: 'northernIce',
    building: 'dock',
    chart: { x: 34, y: 18 },
    levels: [
      { id: '2-1', name: 'Frost line', introduces: 'foghorn' },
      { id: '2-2', name: 'Drifting giants', introduces: 'iceberg' },
      { id: '2-3', name: 'The ferry', introduces: 'ferry' },
      { id: '2-4', name: 'White wall', introduces: 'fogBand' },
      { id: '2-5', name: 'Calving season', introduces: null },
      { id: '2-6', name: 'Polar night', introduces: 'finale' },
    ],
  },
  {
    id: 'stormStrait',
    building: 'chapel',
    chart: { x: 60, y: 42 },
    levels: [
      { id: '3-1', name: 'Flash of white', introduces: 'lightning', alsoIntroduces: 'flares' },
      { id: '3-2', name: 'Tug duty', introduces: 'tugboat' },
      { id: '3-3', name: 'The maelstrom', introduces: 'whirlpool' },
      { id: '3-4', name: 'Crosswaves', introduces: 'stormWaves' },
      { id: '3-5', name: 'No rest', introduces: null },
      { id: '3-6', name: 'The great storm', introduces: 'finale' },
    ],
  },
  {
    id: 'smugglersCove',
    building: 'market',
    chart: { x: 72, y: 64 },
    levels: [
      { id: '4-1', name: 'Shadows on the water', introduces: 'smuggler' },
      { id: '4-2', name: 'Contraband', introduces: null },
      { id: '4-3', name: 'Black sails', introduces: 'pirate' },
      { id: '4-4', name: 'Escort', introduces: null },
      { id: '4-5', name: 'Moonless', introduces: null },
      { id: '4-6', name: 'The pirate king', introduces: 'finale' },
    ],
  },
  {
    id: 'archipelago',
    building: 'festivalLights',
    chart: { x: 74, y: 14 },
    levels: [
      { id: '5-1', name: 'Two lights', introduces: 'secondLamp' },
      { id: '5-2', name: 'Red and blue', introduces: 'secondHarbor' },
      { id: '5-3', name: 'Island hopping', introduces: null },
      { id: '5-4', name: 'Festival night', introduces: 'rush' },
      { id: '5-5', name: 'Everything at once', introduces: null },
      { id: '5-6', name: 'The longest night', introduces: 'finale' },
    ],
  },
];

/** The parchment sea chart (campaign map) and the level select route. */
export const CHART: ChartConfig = {
  width: 100,
  height: 140,
  // The mainland coast down the left side, with a bay; the regions sit out to sea.
  coast: [
    [0, 0],
    [9, 0],
    [12, 10],
    [7, 22],
    [13, 34],
    [9, 46],
    [16, 58],
    [11, 70],
    [18, 82],
    [12, 96],
    [17, 110],
    [10, 124],
    [14, 140],
    [0, 140],
  ],
  route: [
    [32, 84],
    [62, 72],
    [76, 54],
    [52, 42],
    [36, 28],
    [62, 13],
  ],
};
