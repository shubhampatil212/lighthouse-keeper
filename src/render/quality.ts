/**
 * "Auto" graphics quality (docs/ART_AUDIO.md): start at Medium, average the frame time over 3 s and
 * drop one level if it's above 20 ms. After a drop it measures again; once a window comes in under
 * the limit (or Low is reached) it settles and stops measuring. It never steps back up.
 */
import type { AutoQualityConfig, QualityLevel } from '../data/types';

const DOWN: Record<QualityLevel, QualityLevel | null> = {
  high: 'medium',
  medium: 'low',
  low: null,
};

export interface AutoQuality {
  readonly level: QualityLevel;
  readonly settled: boolean;
  /** Feed one frame's duration (ms). Returns the new level when it drops, otherwise null. */
  sample(frameMs: number): QualityLevel | null;
}

export function createAutoQuality(config: AutoQualityConfig): AutoQuality {
  let level = config.start;
  let settled = false;
  let total = 0;
  let frames = 0;
  return {
    get level() {
      return level;
    },
    get settled() {
      return settled;
    },
    sample(frameMs) {
      if (settled || frameMs <= 0 || frameMs > config.ignoreFrameMs) return null;
      total += frameMs;
      frames++;
      if (total < config.windowSeconds * 1000) return null;
      const average = total / frames;
      total = 0;
      frames = 0;
      const lower = DOWN[level];
      if (average > config.slowFrameMs && lower) {
        level = lower;
        if (!DOWN[level]) settled = true;
        return level;
      }
      settled = true;
      return null;
    },
  };
}
