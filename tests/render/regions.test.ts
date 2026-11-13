import { describe, expect, it } from 'vitest';
import { settingsFromAddress } from '../../src/app/debugParams';
import { LEVEL_1_2, REGION_IDS, REGIONS, WEATHER_PRESETS } from '../../src/data';
import { DEFAULT_DEBUG_SETTINGS } from '../../src/ui/debugPanel';

describe('region tints', () => {
  it('has a palette and weather for every region', () => {
    expect(Object.keys(REGIONS).sort()).toEqual([...REGION_IDS].sort());
    for (const id of REGION_IDS) {
      const { palette, weather } = REGIONS[id];
      for (const color of Object.values(palette)) {
        expect(Number.isInteger(color)).toBe(true);
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      }
      for (const amount of Object.values(weather)) {
        expect(amount).toBeGreaterThanOrEqual(0);
        expect(amount).toBeLessThanOrEqual(1);
      }
    }
  });

  it('gives each region its own water and night', () => {
    const looks = new Set(
      REGION_IDS.map((id) => `${REGIONS[id].palette.waterMid}:${REGIONS[id].palette.night}`),
    );
    expect(looks.size).toBe(REGION_IDS.length);
  });

  it('snows in Northern Ice and rains in Storm Strait (docs/ART_AUDIO.md)', () => {
    expect(REGIONS.northernIce.weather.snow).toBeGreaterThan(0);
    expect(REGIONS.stormStrait.weather.rain).toBeGreaterThan(0);
  });

  it('places level 1-2 in Harbor Bay', () => {
    expect(LEVEL_1_2.region).toBe('harborBay');
  });
});

describe('debug settings from the address', () => {
  const parse = (query: string) =>
    settingsFromAddress(new URLSearchParams(query), DEFAULT_DEBUG_SETTINGS);

  it('reads quality, region, weather and switches', () => {
    expect(
      parse('?quality=high&region=stormStrait&weather=rain&parade&buildings=all&reveal'),
    ).toMatchObject({
      quality: 'high',
      region: 'stormStrait',
      weather: 'rain',
      parade: true,
      allBuildings: true,
      revealAll: true,
    });
  });

  it('ignores unknown values', () => {
    expect(parse('?quality=ultra&region=mars&weather=hail')).toEqual(DEFAULT_DEBUG_SETTINGS);
  });

  it('knows every weather preset', () => {
    for (const id of Object.keys(WEATHER_PRESETS)) expect(parse(`?weather=${id}`).weather).toBe(id);
  });
});
