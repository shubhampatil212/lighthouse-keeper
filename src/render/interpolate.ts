/**
 * Smooth drawing between simulation ticks: remember each ship's pose before a tick, then blend from
 * there to the new pose by the loop's alpha.
 */
export interface Pose {
  x: number;
  y: number;
  heading: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Blends from `from` to `to` by t (0–1), turning the short way round. */
export function lerpPose(from: Pose | undefined, to: Pose, t: number): Pose {
  if (!from) return { x: to.x, y: to.y, heading: to.heading };
  const turn = Math.atan2(Math.sin(to.heading - from.heading), Math.cos(to.heading - from.heading));
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), heading: from.heading + turn * t };
}

/** Moves `value` toward `target` at `rate` per second (for fades). */
export function approach(value: number, target: number, rate: number, dt: number): number {
  const step = rate * dt;
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step);
}
