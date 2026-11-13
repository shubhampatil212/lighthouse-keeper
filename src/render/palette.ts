/** The palette from docs/ART_AUDIO.md as numbers for Pixi. Mirrors the CSS tokens in src/ui/tokens.css. */
export const PALETTE = {
  seaDeep: 0x0a222c,
  sea: 0x0f3542,
  seaCrest: 0xafd7dc,
  fog: 0x9fb8bc,
  lamp: 0xffc95e,
  lampHot: 0xffe2a0,
  rust: 0xb64a35,
  stone: 0x4a453f,
  moss: 0x4c6a47,
  parchment: 0xe8dfc8,
  ink: 0x123039,
} as const;

/** A 0xRRGGBB color as [r, g, b] floats from 0 to 1 (for shader uniforms). */
export function rgb(color: number): [number, number, number] {
  return [((color >> 16) & 0xff) / 255, ((color >> 8) & 0xff) / 255, (color & 0xff) / 255];
}

/** Blends two 0xRRGGBB colors: t = 0 gives a, t = 1 gives b. */
export function mixColor(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const channel = (shift: number): number => {
    const ca = (a >> shift) & 0xff;
    const cb = (b >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * k) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}
