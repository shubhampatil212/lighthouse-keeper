/** Vibration where the device supports it (Android browsers); silently nothing elsewhere. */
export function vibrate(pattern: number | readonly number[]): void {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern as number | number[]);
  } catch {
    // Some browsers throw when vibration isn't allowed yet; it's only a nicety.
  }
}
