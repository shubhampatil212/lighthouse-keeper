/**
 * Thick fog bands (docs/CONTENT.md §3, region 2): rectangles of fog that shorten the beam. A point
 * the beam can only reach by passing through fog is lit only within a shorter range.
 */
export interface FogBand {
  /** Centre of the band. */
  x: number;
  y: number;
  /** Direction its length runs along (radians). */
  angle: number;
  length: number;
  width: number;
}

/**
 * Where the segment from (x0, y0) to (x1, y1) first enters the band, as a fraction of its length
 * (0 = it starts inside), or null if it never touches it. Liang–Barsky clipping in the band's frame.
 */
export function fogEntry(
  band: FogBand,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number | null {
  const cos = Math.cos(band.angle);
  const sin = Math.sin(band.angle);
  // Both ends in the band's own frame: u along its length, v across it.
  const u0 = (x0 - band.x) * cos + (y0 - band.y) * sin;
  const v0 = -(x0 - band.x) * sin + (y0 - band.y) * cos;
  const du = (x1 - x0) * cos + (y1 - y0) * sin;
  const dv = -(x1 - x0) * sin + (y1 - y0) * cos;
  const hu = band.length / 2;
  const hv = band.width / 2;
  let enter = 0;
  let leave = 1;
  const edges: readonly [number, number][] = [
    [-du, u0 + hu],
    [du, hu - u0],
    [-dv, v0 + hv],
    [dv, hv - v0],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) enter = Math.max(enter, t);
    else leave = Math.min(leave, t);
    if (enter > leave) return null;
  }
  return enter;
}

/** True if the straight path from (x0, y0) to (x1, y1) passes through (or ends in) any fog band. */
export function throughFog(
  bands: readonly FogBand[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  return bands.some((band) => fogEntry(band, x0, y0, x1, y1) !== null);
}

/** Distance from (x, y) to the nearest point of the band (0 inside it). */
export function distanceToBand(band: FogBand, x: number, y: number): number {
  const cos = Math.cos(band.angle);
  const sin = Math.sin(band.angle);
  const u = (x - band.x) * cos + (y - band.y) * sin;
  const v = -(x - band.x) * sin + (y - band.y) * cos;
  return Math.hypot(
    Math.max(0, Math.abs(u) - band.length / 2),
    Math.max(0, Math.abs(v) - band.width / 2),
  );
}
