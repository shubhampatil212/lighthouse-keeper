import { describe, expect, it } from 'vitest';
import { BEAM, BEAM_FEEL, BEAM_UPGRADES, HAZARDS, NO_UPGRADES } from '../../src/data';
import {
  beamStats,
  isLit,
  lightAt,
  stepBeam,
  type BeamState,
  type LightSources,
} from '../../src/sim';
import { DT } from './helpers';

const stats = beamStats(BEAM, BEAM_UPGRADES, NO_UPGRADES);
const beamAt = (angle: number): BeamState => ({ angle, target: angle });

describe('beamStats', () => {
  it('uses the base stats with no upgrades', () => {
    expect(stats).toEqual({ halfAngle: 0.2, range: 190, turnSpeed: 2.4, glowRadius: 60 });
  });

  it('adds each upgrade level and stops at the max level', () => {
    const up = beamStats(BEAM, BEAM_UPGRADES, { ...NO_UPGRADES, lens: 2, lamp: 5, gears: 9 });
    expect(up.halfAngle).toBeCloseTo(0.3);
    expect(up.range).toBeCloseTo(330);
    expect(up.turnSpeed).toBeCloseTo(2.4 + 0.7 * 4);
  });
});

describe('stepBeam', () => {
  it('never turns faster than the turn speed', () => {
    const beam = beamAt(0);
    stepBeam(beam, 2.5, stats, BEAM_FEEL, DT);
    expect(beam.angle).toBeCloseTo(stats.turnSpeed * DT, 10);
    for (let i = 1; i < 30; i++) stepBeam(beam, null, stats, BEAM_FEEL, DT);
    expect(beam.angle).toBeCloseTo(stats.turnSpeed * DT * 30, 10);
  });

  it('turns the short way across ±PI', () => {
    const beam = beamAt(3.0);
    const angles: number[] = [];
    for (let i = 0; i < 60; i++) {
      stepBeam(beam, -3.0, stats, BEAM_FEEL, DT);
      angles.push(beam.angle);
    }
    // It went up through PI and came out at -PI, never sweeping back through 0.
    expect(angles.every((a) => Math.abs(a) > 2.9)).toBe(true);
    expect(beam.angle).toBeCloseTo(-3.0, 6);
  });

  it('eases out near the target', () => {
    const beam = beamAt(0);
    stepBeam(beam, 0.1, stats, BEAM_FEEL, DT);
    const firstStep = beam.angle;
    expect(firstStep).toBeLessThan(stats.turnSpeed * DT);
    expect(firstStep).toBeCloseTo(0.1 * BEAM_FEEL.easeRate * DT, 10);
  });

  it('settles exactly on the target', () => {
    const beam = beamAt(0);
    for (let i = 0; i < 120; i++) stepBeam(beam, 1, stats, BEAM_FEEL, DT);
    expect(beam.angle).toBe(1);
  });

  it('keeps the last target when there is no new aim', () => {
    const beam = beamAt(0);
    stepBeam(beam, 1, stats, BEAM_FEEL, DT);
    stepBeam(beam, null, stats, BEAM_FEEL, DT);
    expect(beam.target).toBe(1);
  });

  it('stores targets wrapped into (-PI, PI]', () => {
    const beam = beamAt(0);
    stepBeam(beam, Math.PI * 2 + 0.5, stats, BEAM_FEEL, DT);
    expect(beam.target).toBeCloseTo(0.5, 10);
  });
});

describe('isLit', () => {
  const light = (overrides: Partial<LightSources> & { angle?: number } = {}): LightSources => {
    const { angle = 0, ...rest } = overrides;
    return {
      lamps: [{ x: 0, y: 0, angle, glowRadius: stats.glowRadius }],
      stats,
      edgeTolerance: BEAM_FEEL.edgeTolerance,
      buoys: [],
      mapLit: false,
      fog: [],
      fogRangeFactor: HAZARDS.fog.rangeFactor,
      ...rest,
    };
  };
  const polar = (d: number, a: number): [number, number] => [d * Math.cos(a), d * Math.sin(a)];

  it('lights the island glow in every direction', () => {
    expect(isLit(light(), 0, 0)).toBe(true);
    expect(isLit(light(), 0, 59)).toBe(true);
    expect(isLit(light(), 0, 61)).toBe(false);
  });

  it('lights the cone up to its range', () => {
    expect(isLit(light(), 190, 0)).toBe(true);
    expect(isLit(light(), 190.5, 0)).toBe(false);
  });

  it('counts a few units past the cone edge as lit', () => {
    const edge = stats.halfAngle + BEAM_FEEL.edgeTolerance / 100;
    expect(isLit(light(), ...polar(100, edge - 0.001))).toBe(true);
    expect(isLit(light(), ...polar(100, edge + 0.001))).toBe(false);
    expect(isLit(light(), ...polar(100, -(edge - 0.001)))).toBe(true);
  });

  it('works across ±PI', () => {
    const l = light({ angle: Math.PI });
    expect(isLit(l, ...polar(100, -Math.PI + 0.1))).toBe(true);
    expect(isLit(l, ...polar(100, Math.PI - 0.1))).toBe(true);
    expect(isLit(l, ...polar(100, 0))).toBe(false);
  });

  it('lights around a buoy', () => {
    const l = light({ angle: Math.PI, buoys: [{ x: 150, y: 150, radius: 54 }] });
    expect(isLit(l, 150, 200)).toBe(true);
    expect(isLit(l, 150, 205)).toBe(false);
  });

  it('lights everything during a map-wide light', () => {
    expect(isLit(light({ mapLit: true }), 500, -500)).toBe(true);
  });

  it('reaches only 65% of its range through a fog band', () => {
    // A band across the beam's path, 80–100 units out.
    const fog = [{ x: 90, y: 0, angle: Math.PI / 2, length: 100, width: 20 }];
    const l = light({ fog });
    expect(isLit(l, 70, 0)).toBe(true); // in front of the fog
    expect(isLit(l, 120, 0)).toBe(true); // behind it, but within 0.65 × 190 = 123.5
    expect(isLit(l, 125, 0)).toBe(false);
    expect(isLit(light(), 125, 0)).toBe(true); // the same point with no fog
    // A beam that misses the band keeps its full range.
    expect(isLit(light({ fog, angle: Math.PI }), -185, 0)).toBe(true);
  });

  it('lights from a second lamp, with its own glow and beam', () => {
    const l = light({
      angle: Math.PI,
      lamps: [
        { x: 0, y: 0, angle: Math.PI, glowRadius: 60 },
        { x: 100, y: 0, angle: Math.PI / 2, glowRadius: 36 },
      ],
    });
    expect(lightAt(l, 100, 30)).toEqual(expect.objectContaining({ x: 100, y: 0 }));
    expect(isLit(l, 100, 180)).toBe(true);
    expect(isLit(l, 100, -40)).toBe(false);
  });

  it('says where the light comes from', () => {
    expect(lightAt(light(), 100, 0)).toEqual(expect.objectContaining({ x: 0, y: 0 }));
    const buoy = { x: 150, y: 150, radius: 54 };
    expect(lightAt(light({ angle: Math.PI, buoys: [buoy] }), 150, 160)).toBe(buoy);
    expect(lightAt(light(), 0, 100)).toBeNull();
  });
});
