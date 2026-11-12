/** The lighthouse beam: turn-limited aiming, and the test for whether a point is in the light. */
import type { BeamConfig, BeamFeelConfig, BeamUpgradeConfig, Upgrades } from '../data/types';
import { wrapAngle } from './angle';

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

/** Everything that can light a point this tick. */
export interface LightSources {
  angle: number;
  stats: BeamStats;
  edgeTolerance: number;
  buoys: readonly BuoyLight[];
  /** A flare or lightning lights the whole map. */
  mapLit: boolean;
}

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

/** True if (x, y) is lit by the island glow, the beam cone, a buoy, or a map-wide light. */
export function isLit(light: LightSources, x: number, y: number): boolean {
  if (light.mapLit) return true;
  const d = Math.hypot(x, y);
  if (d < light.stats.glowRadius) return true;
  if (d <= light.stats.range) {
    const off = Math.abs(wrapAngle(Math.atan2(y, x) - light.angle));
    if (off <= light.stats.halfAngle + light.edgeTolerance / Math.max(d, 1)) return true;
  }
  for (const buoy of light.buoys) {
    if (Math.hypot(x - buoy.x, y - buoy.y) < buoy.radius) return true;
  }
  return false;
}
