/** Which region tint and weather a night uses: the level's own, unless the debug panel overrides it. */
import { REGIONS, WEATHER_PRESETS } from '../data';
import type { LevelDef, RegionId, WeatherDef } from '../data/types';
import type { DebugSettings } from '../ui/debugPanel';

export function regionFor(level: LevelDef, settings: DebugSettings): RegionId {
  return settings.region === 'level' ? level.region : settings.region;
}

export function weatherFor(level: LevelDef, settings: DebugSettings): WeatherDef {
  if (settings.weather !== 'level') return WEATHER_PRESETS[settings.weather];
  const region = regionFor(level, settings);
  return region === level.region && level.weather ? level.weather : REGIONS[region].weather;
}
