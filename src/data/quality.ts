import type { QualityLevel, QualityProfile } from './types';

/** Graphics quality levels, from docs/ART_AUDIO.md "Quality settings". */
export const QUALITY: Record<QualityLevel, QualityProfile> = {
  low: {
    maxPixelRatio: 1,
    waterNoiseLayers: 0,
    waterSparkles: false,
    darknessBlurPasses: 0,
    darknessNoise: false,
    fogLayers: 1,
    fogSpray: false,
    particleCap: 100,
  },
  medium: {
    maxPixelRatio: 1.5,
    waterNoiseLayers: 1,
    waterSparkles: false,
    darknessBlurPasses: 1,
    darknessNoise: false,
    fogLayers: 2,
    fogSpray: false,
    particleCap: 250,
  },
  high: {
    maxPixelRatio: 2,
    waterNoiseLayers: 3,
    waterSparkles: true,
    darknessBlurPasses: 2,
    darknessNoise: true,
    fogLayers: 2,
    fogSpray: true,
    particleCap: 600,
  },
};

/** Quality used until the settings screen exists. "Auto" also starts here. */
export const DEFAULT_QUALITY: QualityLevel = 'medium';
