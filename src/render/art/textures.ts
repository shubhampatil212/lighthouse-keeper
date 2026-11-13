/**
 * Textures generated with a 2D canvas when the game starts: glows, fog, particles and the beam cone.
 * They are white (tinted by the views) and built from a fixed seed, so they look the same every time.
 */
import { Texture } from 'pixi.js';
import { createRng } from '../../sim/rng';
import type { ArtTextures, BeamConeTexture } from './types';
import { GLOW_TEXTURE_RADIUS } from './types';

function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return [c, ctx];
}

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function glow(): Texture {
  const size = GLOW_TEXTURE_RADIUS * 2;
  const [c, ctx] = canvas(size, size);
  const r = GLOW_TEXTURE_RADIUS;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.62)');
  g.addColorStop(0.65, 'rgba(255,255,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

function pool(): Texture {
  const size = GLOW_TEXTURE_RADIUS * 2;
  const [c, ctx] = canvas(size, size);
  const r = GLOW_TEXTURE_RADIUS;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.8, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

/** Soft blobs drawn with wrap-around, so the texture tiles without seams. */
function fog(): Texture {
  const size = 256;
  const [c, ctx] = canvas(size, size);
  const rng = createRng(0x0f06);
  for (let i = 0; i < 46; i++) {
    const x = rng.range(0, size);
    const y = rng.range(0, size);
    const r = rng.range(26, 78);
    const a = rng.range(0.08, 0.26);
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
  }
  return Texture.from(c);
}

/** Tileable value noise between 0.72 and 1 (opaque grey), for multiplying over the light. */
function breath(): Texture {
  const size = 128;
  const cells = 8;
  const rng = createRng(0xb4ea7);
  const grid = Array.from({ length: cells * cells }, () => rng.float());
  const at = (gx: number, gy: number): number =>
    grid[((gy + cells) % cells) * cells + ((gx + cells) % cells)] ?? 0;
  const [c, ctx] = canvas(size, size);
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = smoothstep(0, 1, fx - ix);
      const ty = smoothstep(0, 1, fy - iy);
      const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx;
      const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx;
      const v = Math.round(255 * (0.72 + 0.28 * (top + (bottom - top) * ty)));
      const i = (y * size + x) * 4;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return Texture.from(c);
}

function softDot(size: number): Texture {
  const [c, ctx] = canvas(size, size);
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

function splinter(): Texture {
  const [c, ctx] = canvas(8, 3);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 8, 3);
  return Texture.from(c);
}

function drop(): Texture {
  const [c, ctx] = canvas(2, 18);
  const g = ctx.createLinearGradient(0, 0, 0, 18);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 18);
  return Texture.from(c);
}

function wave(): Texture {
  const [c, ctx] = canvas(26, 8);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(2, 6);
  ctx.quadraticCurveTo(13, 0, 24, 6);
  ctx.stroke();
  return Texture.from(c);
}

export function createTextures(): ArtTextures {
  return {
    glow: glow(),
    pool: pool(),
    fog: fog(),
    breath: breath(),
    dot: softDot(8),
    splinter: splinter(),
    drop: drop(),
    flake: softDot(6),
    wave: wave(),
  };
}

/** How far past the beam's range the cone texture reaches (the light fades out just beyond it). */
const CONE_REACH = 1.14;
const CONE_WIDTH_PX = 384;

/**
 * The beam cone: full inside the half-angle with a soft edge, a fainter halo out to haloWidth × the
 * half-angle, fading with distance and gone just past the range. Pointing along +x from the tip.
 */
export function createBeamCone(
  halfAngle: number,
  haloWidth: number,
  halo: number,
): BeamConeTexture {
  const spread = Math.min(halfAngle * haloWidth * 1.15, Math.PI / 2 - 0.05);
  const heightPerRange = 2 * CONE_REACH * Math.sin(spread);
  const w = CONE_WIDTH_PX;
  const h = Math.max(8, Math.ceil((w * heightPerRange) / CONE_REACH));
  const [c, ctx] = canvas(w, h);
  const image = ctx.createImageData(w, h);
  const soft = Math.max(0.025, halfAngle * 0.14);
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x = (px / w) * CONE_REACH;
      const y = ((py + 0.5 - h / 2) / w) * CONE_REACH;
      const d = Math.hypot(x, y);
      const a = Math.abs(Math.atan2(y, x));
      const core = 1 - smoothstep(halfAngle - soft, halfAngle + soft, a);
      const outer = (1 - smoothstep(halfAngle, halfAngle * haloWidth, a)) * halo;
      const radial = (1 - smoothstep(0.84, CONE_REACH, d)) * (1 - 0.28 * d);
      const v = Math.max(core, outer) * radial;
      const i = (py * w + px) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, v)));
    }
  }
  ctx.putImageData(image, 0, 0);
  return { texture: Texture.from(c), reach: CONE_REACH, anchorX: 0, anchorY: 0.5, heightPerRange };
}
