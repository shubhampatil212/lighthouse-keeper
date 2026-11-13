/**
 * Envelopes on AudioParams. Every shape starts from silence and ends at silence, and every change
 * is a ramp, never a jump: jumps are what make clicks.
 */

/** Silence → `peak` in `attack` seconds → fades out with time constant `decay / 4` (≈ silent after `decay`). */
export function pluckEnvelope(
  param: AudioParam,
  at: number,
  peak: number,
  attack: number,
  decay: number,
): void {
  param.setValueAtTime(0, at);
  param.linearRampToValueAtTime(peak, at + attack);
  param.setTargetAtTime(0, at + attack, decay / 4);
}

/** Silence → `peak` over `attack`, holds, then back to silence over `release`. */
export function swellEnvelope(
  param: AudioParam,
  at: number,
  peak: number,
  attack: number,
  hold: number,
  release: number,
): void {
  param.setValueAtTime(0, at);
  param.linearRampToValueAtTime(peak, at + attack);
  param.setValueAtTime(peak, at + attack + hold);
  param.linearRampToValueAtTime(0, at + attack + hold + release);
}

/** Glide smoothly from wherever the param is now toward `value` (time constant `seconds / 3`). */
export function glide(param: AudioParam, value: number, now: number, seconds: number): void {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(value, now, Math.max(0.005, seconds / 3));
}

/** Seconds an envelope from `pluckEnvelope` needs before its source can stop. */
export const pluckLength = (attack: number, decay: number): number => attack + decay * 1.6;
