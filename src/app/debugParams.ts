/**
 * Debug settings from the address bar, so a look can be opened directly (used for screenshots):
 * ?quality=low|medium|high|auto  ?region=northernIce  ?weather=clear|fog|rain|snow  ?parade
 * ?buildings=all  ?reveal  ?colorblind. Unknown values are ignored.
 */
import { REGION_IDS, WEATHER_PRESETS, type WeatherPresetId } from '../data/regions';
import type { QualityChoice, RegionId } from '../data/types';
import type { DebugSettings } from '../ui/debugPanel';

const QUALITY_CHOICES: readonly QualityChoice[] = ['auto', 'low', 'medium', 'high'];

const isRegion = (value: string): value is RegionId =>
  (REGION_IDS as readonly string[]).includes(value);
const isWeather = (value: string): value is WeatherPresetId => value in WEATHER_PRESETS;
const isQuality = (value: string): value is QualityChoice =>
  (QUALITY_CHOICES as readonly string[]).includes(value);

export function settingsFromAddress(params: URLSearchParams, base: DebugSettings): DebugSettings {
  const next = { ...base };
  const quality = params.get('quality') ?? '';
  if (isQuality(quality)) next.quality = quality;
  const region = params.get('region') ?? '';
  if (isRegion(region)) next.region = region;
  const weather = params.get('weather') ?? '';
  if (isWeather(weather)) next.weather = weather;
  if (params.has('parade')) next.parade = true;
  if (params.get('buildings') === 'all') next.allBuildings = true;
  if (params.has('reveal')) next.revealAll = true;
  if (params.has('colorblind')) next.colorblind = true;
  return next;
}
