/** Camera shake after a wreck: a quick wobble that dies away. Pure, so it can be unit-tested. */
import type { Point } from './art/types';

/** Offset (CSS px) `elapsed` seconds into a shake lasting `duration`, at most `strength` px. */
export function shakeOffset(elapsed: number, duration: number, strength: number): Point {
  if (elapsed < 0 || elapsed >= duration || duration <= 0) return { x: 0, y: 0 };
  const fade = 1 - elapsed / duration;
  const k = strength * fade * fade;
  return {
    x: k * Math.sin(elapsed * 71) * Math.cos(elapsed * 23),
    y: k * Math.cos(elapsed * 59) * Math.sin(elapsed * 31 + 1),
  };
}
