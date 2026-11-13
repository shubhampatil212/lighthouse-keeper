import type { RegionId, RegionPalette, WeatherDef } from './types';

/**
 * Region tints (docs/ART_AUDIO.md: each region tints the water, the darkness and the fog).
 * Harbor Bay uses the base palette; the others shift it.
 */
export const REGIONS: Record<RegionId, { palette: RegionPalette; weather: WeatherDef }> = {
  harborBay: {
    palette: {
      waterDeep: 0x0a222c,
      waterMid: 0x0f3542,
      waterCrest: 0xafd7dc,
      night: 0x22333d,
      light: 0xfff0d2,
      fog: 0x9fb8bc,
    },
    weather: { fog: 0.4, rain: 0, snow: 0 },
  },
  northernIce: {
    palette: {
      waterDeep: 0x111a33,
      waterMid: 0x1d2c4f,
      waterCrest: 0xc8d8f2,
      night: 0x272c48,
      light: 0xfff2dc,
      fog: 0xb4bdd8,
    },
    weather: { fog: 0.6, rain: 0, snow: 0.6 },
  },
  stormStrait: {
    palette: {
      waterDeep: 0x111f1c,
      waterMid: 0x1e3530,
      waterCrest: 0xb6cbbf,
      night: 0x263430,
      light: 0xffeccc,
      fog: 0x8f9e96,
    },
    weather: { fog: 0.5, rain: 0.7, snow: 0 },
  },
  smugglersCove: {
    palette: {
      waterDeep: 0x120d1e,
      waterMid: 0x22183a,
      waterCrest: 0xc9c2e6,
      night: 0x2e2945,
      light: 0xffe9c8,
      fog: 0x8e86a8,
    },
    weather: { fog: 0.3, rain: 0, snow: 0 },
  },
  archipelago: {
    palette: {
      waterDeep: 0x07163a,
      waterMid: 0x0e2860,
      waterCrest: 0xa9c8f0,
      night: 0x1c2a4c,
      light: 0xfff0d0,
      fog: 0x93a6c8,
    },
    weather: { fog: 0.3, rain: 0, snow: 0 },
  },
};

export const REGION_IDS: readonly RegionId[] = [
  'harborBay',
  'northernIce',
  'stormStrait',
  'smugglersCove',
  'archipelago',
];

/** Weather presets for the debug panel (and ?weather= in the address), for checking each look. */
export const WEATHER_PRESETS = {
  clear: { fog: 0, rain: 0, snow: 0 },
  fog: { fog: 1, rain: 0, snow: 0 },
  rain: { fog: 0.5, rain: 0.8, snow: 0 },
  snow: { fog: 0.5, rain: 0, snow: 0.8 },
} as const satisfies Record<string, WeatherDef>;

export type WeatherPresetId = keyof typeof WEATHER_PRESETS;
