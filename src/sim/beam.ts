/** The lighthouse beam: turn-limited aiming, and the test for whether a point is in the light. */
import type { BeamConfig, BeamFeelConfig, BeamUpgradeConfig, Upgrades } from '../data/types';
import { wrapAngle } from './angle';
import { throughFog, type FogBand } from './fog';

/** The beam's stats after upgrades. */
export interface BeamStats {
  halfAngle: number;
  range: number;
  turnSpeed: number;
  glowRadius: number;
}

export interface BeamState {
  /** Where the beam points now (radians). */
  angle: number;
  /** Where the player last asked it to point. */
  target: number;
}

export interface BuoyLight {
  x: number;
  y: number;
  radius: number;
}

/** One lighthouse lamp: where it stands, where its beam points, and the glow always lit around it. */
export interface LampLight {
  x: number;
  y: number;
  angle: number;
  glowRadius: number;
}

/** Everything that can light a point this tick. */
export interface LightSources {
  /** The island's lamp first, then the second lamp if the level has one. Both share the beam stats. */
  lamps: readonly LampLight[];
  stats: BeamStats;
  edgeTolerance: number;
  buoys: readonly BuoyLight[];
  /** A flare or lightning lights the whole map. */
  mapLit: boolean;
  /** Fog bands: the beam reaches only `fogRangeFactor` of its range through them. */
  fog: readonly FogBand[];
  fogRangeFactor: number;
}

/** Where the light falling on a point comes from (a lamp, a buoy, or the island for a map-wide light). */
export interface LightOrigin {
  x: number;
  y: number;
}

const ISLAND_ORIGIN: LightOrigin = { x: 0, y: 0 };

const clampLevel = (level: number, max: number): number => Math.max(0, Math.min(max, level));

export function beamStats(
  base: BeamConfig,
  steps: BeamUpgradeConfig,
  upgrades: Upgrades,
): BeamStats {
  return {
    halfAngle:
      base.halfAngle +
      steps.halfAngle.perLevel * clampLevel(upgrades.lens, steps.halfAngle.maxLevel),
    range: base.range + steps.range.perLevel * clampLevel(upgrades.lamp, steps.range.maxLevel),
    turnSpeed:
      base.turnSpeed +
      steps.turnSpeed.perLevel * clampLevel(upgrades.gears, steps.turnSpeed.maxLevel),
    glowRadius: base.islandGlowRadius,
  };
}

/**
 * Turns the beam toward its target the short way round. It never turns faster than the turn
 * speed (that limit is the skill), and it slows as it nears the target for a heavy, smooth feel.
 */
export function stepBeam(
  beam: BeamState,
  aimAngle: number | null,
  stats: BeamStats,
  feel: BeamFeelConfig,
  dt: number,
): void {
  if (aimAngle !== null) beam.target = wrapAngle(aimAngle);
  const diff = wrapAngle(beam.target - beam.angle);
  const distance = Math.abs(diff);
  if (distance <= feel.snapAngle) {
    beam.angle = beam.target;
    return;
  }
  const speed = Math.min(stats.turnSpeed, distance * feel.easeRate);
  const step = Math.min(distance, speed * dt);
  beam.angle = wrapAngle(beam.angle + Math.sign(diff) * step);
}

/**
 * What lights (x, y): a lamp's glow or beam cone, a buoy, or a map-wide light. Returns where that
 * light comes from (smugglers and pirates flee away from it), or null if the point is dark.
 */
export function lightAt(light: LightSources, x: number, y: number): LightOrigin | null {
  if (light.mapLit) return ISLAND_ORIGIN;
  for (const lamp of light.lamps) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    const d = Math.hypot(dx, dy);
    if (d < lamp.glowRadius) return lamp;
    if (d > light.stats.range) continue;
    const off = Math.abs(wrapAngle(Math.atan2(dy, dx) - lamp.angle));
    if (off > light.stats.halfAngle + light.edgeTolerance / Math.max(d, 1)) continue;
    const foggy = light.fog.length > 0 && throughFog(light.fog, lamp.x, lamp.y, x, y);
    if (!foggy || d <= light.stats.range * light.fogRangeFactor) return lamp;
  }
  for (const buoy of light.buoys) {
    if (Math.hypot(x - buoy.x, y - buoy.y) < buoy.radius) return buoy;
  }
  return null;
}

export function isLit(light: LightSources, x: number, y: number): boolean {
  return lightAt(light, x, y) !== null;
}
