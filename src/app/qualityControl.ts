/**
 * Graphics quality as the player chose it: a fixed level, or Auto, which starts at Medium and steps
 * down while frames are slow (src/render/quality.ts). Tells `onLevel` whenever the level changes.
 */
import { AUTO_QUALITY } from '../data';
import type { QualityChoice, QualityLevel } from '../data/types';
import { createAutoQuality, type AutoQuality } from '../render/quality';

export interface QualityControl {
  readonly level: QualityLevel;
  /** The player picked another option in Settings (or the debug panel). */
  choose(choice: QualityChoice): void;
  /** Call once per drawn frame; Auto measures until it settles. */
  frame(now: number): void;
  /** "medium", or "auto → medium (measuring)" for the debug panel. */
  status(): string;
}

export function createQualityControl(
  initial: QualityChoice,
  onLevel: (level: QualityLevel) => void,
  onMeasuring: () => void,
): QualityControl {
  let choice = initial;
  let auto: AutoQuality | null = null;
  let lastFrame: number | null = null;
  const start = (next: QualityChoice): QualityLevel => {
    auto = next === 'auto' ? createAutoQuality(AUTO_QUALITY) : null;
    lastFrame = null;
    return auto ? auto.level : (next as QualityLevel);
  };
  let level = start(choice);

  return {
    get level() {
      return level;
    },
    choose(next) {
      if (next === choice) return;
      choice = next;
      level = start(next);
      onLevel(level);
    },
    frame(now) {
      const measuring = auto && !auto.settled;
      if (measuring && lastFrame !== null) {
        const dropped = auto?.sample(now - lastFrame) ?? null;
        if (dropped) {
          level = dropped;
          onLevel(level);
        } else {
          // Keeps the panel's "auto → level" text current (it says when Auto settles).
          onMeasuring();
        }
      }
      lastFrame = now;
    },
    status() {
      if (!auto) return level;
      return `auto → ${level}${auto.settled ? '' : ' (measuring)'}`;
    },
  };
}
