import type { VesselFeelConfig } from './types';

/** How pirates, tows, destination markers and catch rings look (drawing only). Tuned by eye. */
export const VESSEL_FEEL: VesselFeelConfig = {
  destinationSize: 3.2,
  destinationOffsetX: 6,
  destinationOffsetY: -2,
  catchRingRadius: 13,
  catchRingWidth: 1.8,
  huntRingStart: 26,
  huntRingEnd: 7,
  huntPulse: 9,
  ropeWidth: 0.9,
  ropeAlpha: 0.75,
  slowedSize: 4,
  harborLights: 10,
  harborLightRadius: 5,
  towedDim: 0.7,
};
