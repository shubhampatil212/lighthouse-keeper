/** Camera shake after a wreck: a quick wobble that dies away. Pure, so it can be unit-tested. */
import type { Point } from './art/types';

/**
 * Offset (CSS px) `elapsed` seconds into a shake lasting `duration`, at most `strength` px. It builds
 * up over the first `rise` seconds (no jolt), then dies away. Written into `out` when given.
 */
export function shakeOffset(
  elapsed: number,
  duration: number,
  strength: number,
  rise = 0,
  out: Point = { x: 0, y: 0 },
): Point {
  if (elapsed < 0 || elapsed >= duration || duration <= 0) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  const fade = 1 - elapsed / duration;
  const build = rise > 0 ? Math.min(1, elapsed / rise) : 1;
  const k = strength * fade * fade * build;
  out.x = k * Math.sin(elapsed * 71) * Math.cos(elapsed * 23);
  out.y = k * Math.cos(elapsed * 59) * Math.sin(elapsed * 31 + 1);
  return out;
}
