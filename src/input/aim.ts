/** Pure aiming math: screen positions to beam angles. No DOM, so it's easy to test. */
import { wrapAngle } from '../sim/angle';

/** Where the island is on screen (CSS px). */
export interface ScreenCenter {
  centerX: number;
  centerY: number;
}

/** Follow finger: the angle from the island to the pointer, or null inside the dead zone. */
export function aimFromPointer(
  center: ScreenCenter,
  x: number,
  y: number,
  deadZonePx: number,
): number | null {
  const dx = x - center.centerX;
  const dy = y - center.centerY;
  if (Math.hypot(dx, dy) < deadZonePx) return null;
  return Math.atan2(dy, dx);
}

/** Drag to rotate: how far the pointer swept around the island between two angles, the short way. */
export function dialDelta(from: number, to: number): number {
  return wrapAngle(to - from);
}

/** Keyboard: aim just ahead of the beam while one direction is held; null when neither (or both). */
export function keyboardAim(
  left: boolean,
  right: boolean,
  beamAngle: number,
  lead: number,
): number | null {
  if (left === right) return null;
  return wrapAngle(beamAngle + (right ? lead : -lead));
}
