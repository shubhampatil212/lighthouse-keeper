import { describe, expect, it } from 'vitest';
import { AUTO_QUALITY, QUALITY } from '../../src/data';
import { createAutoQuality } from '../../src/render/quality';

/** Feeds `seconds` worth of frames of `ms` each; returns every level change. */
function run(auto: ReturnType<typeof createAutoQuality>, ms: number, seconds: number): string[] {
  const changes: string[] = [];
  for (let t = 0; t < seconds * 1000; t += ms) {
    const next = auto.sample(ms);
    if (next) changes.push(next);
  }
  return changes;
}

describe('auto quality', () => {
  it('starts at Medium', () => {
    expect(createAutoQuality(AUTO_QUALITY).level).toBe('medium');
  });

  it('stays at Medium and settles when frames are fast', () => {
    const auto = createAutoQuality(AUTO_QUALITY);
    expect(run(auto, 16.7, 4)).toEqual([]);
    expect(auto.level).toBe('medium');
    expect(auto.settled).toBe(true);
  });

  it('drops one level after 3 s averaging over 20 ms, then measures again', () => {
    const auto = createAutoQuality(AUTO_QUALITY);
    expect(run(auto, 25, 2.9)).toEqual([]);
    expect(run(auto, 25, 0.2)).toEqual(['low']);
    expect(auto.level).toBe('low');
    // Low is the floor, so it stops measuring.
    expect(auto.settled).toBe(true);
    expect(run(auto, 40, 6)).toEqual([]);
  });

  it('judges the average, not single slow frames', () => {
    const auto = createAutoQuality(AUTO_QUALITY);
    for (let i = 0; i < 170; i++) auto.sample(i % 10 === 0 ? 45 : 15);
    expect(auto.level).toBe('medium');
  });

  it('ignores huge frames from a hidden tab or a debugger', () => {
    const auto = createAutoQuality(AUTO_QUALITY);
    expect(auto.sample(5000)).toBeNull();
    expect(run(auto, 16, 3.2)).toEqual([]);
    expect(auto.level).toBe('medium');
  });

  it('steps from High to Medium to Low when started at High on a slow device', () => {
    const auto = createAutoQuality({ ...AUTO_QUALITY, start: 'high' });
    expect(run(auto, 30, 7)).toEqual(['medium', 'low']);
  });

  it('matches the quality table in docs/ART_AUDIO.md', () => {
    expect(QUALITY.low).toMatchObject({
      maxPixelRatio: 1,
      waterNoiseLayers: 0,
      darknessBlurPasses: 0,
      fogLayers: 1,
      particleCap: 100,
    });
    expect(QUALITY.medium).toMatchObject({
      maxPixelRatio: 1.5,
      waterNoiseLayers: 1,
      darknessBlurPasses: 1,
      fogLayers: 2,
      particleCap: 250,
    });
    expect(QUALITY.high).toMatchObject({
      maxPixelRatio: 2,
      waterNoiseLayers: 3,
      waterSparkles: true,
      darknessBlurPasses: 2,
      darknessNoise: true,
      fogLayers: 2,
      fogSpray: true,
      particleCap: 600,
    });
  });
});
