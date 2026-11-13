import type { CampaignRegionDef, ChartConfig } from './uiTypes';

/**
 * The campaign's five regions and thirty levels (docs/CONTENT.md §6), in play order.
 * Only 1-2 is built so far; the others play a stand-in night until phase 06 writes them.
 */
export const CAMPAIGN: readonly CampaignRegionDef[] = [
  {
    id: 'harborBay',
    building: 'cottage',
    chart: { x: 36, y: 80 },
    levels: [
      { id: '1-1', name: 'First light', introduces: 'reef', standIn: '1-2' },
      { id: '1-2', name: 'The cargo run', introduces: 'cargo', standIn: '1-2' },
      { id: '1-3', name: 'Two at once', introduces: 'pairs', standIn: '1-2' },
      { id: '1-4', name: 'Offshore breeze', introduces: 'sailboat', standIn: '1-2' },
      { id: '1-5', name: 'Rush hour', introduces: 'rush', standIn: '1-2' },
      { id: '1-6', name: 'First storm', introduces: 'finale', standIn: '1-2' },
    ],
  },
  {
    id: 'northernIce',
    building: 'dock',
    chart: { x: 34, y: 18 },
    levels: [
      { id: '2-1', name: 'Frost line', introduces: 'foghorn', standIn: 'demo-ice' },
      { id: '2-2', name: 'Drifting giants', introduces: 'iceberg', standIn: 'demo-ice' },
      { id: '2-3', name: 'The ferry', introduces: 'ferry', standIn: 'demo-ice' },
      { id: '2-4', name: 'White wall', introduces: 'fogBand', standIn: 'demo-ice' },
      { id: '2-5', name: 'Calving season', introduces: null, standIn: 'demo-ice' },
      { id: '2-6', name: 'Polar night', introduces: 'finale', standIn: 'demo-ice' },
    ],
  },
  {
    id: 'stormStrait',
    building: 'chapel',
    chart: { x: 60, y: 42 },
    levels: [
      { id: '3-1', name: 'Flash of white', introduces: 'flares', standIn: 'demo-storm' },
      { id: '3-2', name: 'Tug duty', introduces: 'tugboat', standIn: 'demo-storm' },
      { id: '3-3', name: 'The maelstrom', introduces: 'whirlpool', standIn: 'demo-storm' },
      { id: '3-4', name: 'Crosswaves', introduces: 'stormWaves', standIn: 'demo-storm' },
      { id: '3-5', name: 'No rest', introduces: null, standIn: 'demo-storm' },
      { id: '3-6', name: 'The great storm', introduces: 'finale', standIn: 'demo-storm' },
    ],
  },
  {
    id: 'smugglersCove',
    building: 'market',
    chart: { x: 72, y: 64 },
    levels: [
      { id: '4-1', name: 'Shadows on the water', introduces: 'smuggler', standIn: 'demo-cove' },
      { id: '4-2', name: 'Contraband', introduces: null, standIn: 'demo-cove' },
      { id: '4-3', name: 'Black sails', introduces: 'pirate', standIn: 'demo-cove' },
      { id: '4-4', name: 'Escort', introduces: null, standIn: 'demo-cove' },
      { id: '4-5', name: 'Moonless', introduces: null, standIn: 'demo-cove' },
      { id: '4-6', name: 'The pirate king', introduces: 'finale', standIn: 'demo-cove' },
    ],
  },
  {
    id: 'archipelago',
    building: 'festivalLights',
    chart: { x: 74, y: 14 },
    levels: [
      { id: '5-1', name: 'Two lights', introduces: 'secondLamp', standIn: 'demo-archipelago' },
      { id: '5-2', name: 'Red and blue', introduces: 'secondHarbor', standIn: 'demo-archipelago' },
      { id: '5-3', name: 'Island hopping', introduces: null, standIn: 'demo-archipelago' },
      { id: '5-4', name: 'Festival night', introduces: 'rush', standIn: 'demo-archipelago' },
      { id: '5-5', name: 'Everything at once', introduces: null, standIn: 'demo-archipelago' },
      { id: '5-6', name: 'The longest night', introduces: 'finale', standIn: 'demo-archipelago' },
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
