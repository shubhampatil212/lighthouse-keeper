/**
 * Draws the app icons in code: the lighthouse on a teal sea, its lamp lit and a beam reaching out.
 * Run with `npm run icons`; it writes PNGs into public/icons/ (they're committed, so a build doesn't
 * need to run this). A tiny rasterizer (shapes tested per pixel, 4×4 samples for smooth edges) and a
 * PNG writer on Node's zlib keep it free of dependencies.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const hex = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
const SEA_TOP = hex(0x0e4f58);
const SEA_BOTTOM = hex(0x1c8a8c);
const NIGHT = hex(0x0a222c);
const LAMP = hex(0xffc95e);
const LAMP_HOT = hex(0xffe2a0);
const TOWER = hex(0xe8dfc8);
const RUST = hex(0xb64a35);
const polygon = (points, color, alpha = 1) => ({
  color,
  alpha,
  inside(x, y) {
    let hit = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i];
      const b = points[j];
      if (!a || !b) continue;
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        hit = !hit;
      }
    }
    return hit;
  },
});
const ellipse = (cx, cy, rx, ry, color, alpha = 1) => ({
  color,
  alpha,
  inside: (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1,
});
/** The tower's edge at height y (it narrows toward the top). */
const towerSpan = (y) => {
  const t = (y - 0.4) / (0.82 - 0.4);
  const half = 0.035 + (0.07 - 0.035) * t;
  return [0.5 - half, 0.5 + half];
};
const band = (y0, y1) => {
  const [l0, r0] = towerSpan(y0);
  const [l1, r1] = towerSpan(y1);
  return polygon(
    [
      [l0, y0],
      [r0, y0],
      [r1, y1],
      [l1, y1],
    ],
    RUST,
  );
};
/** Painted in order, back to front. */
const SHAPES = [
  polygon(
    [
      [0.5, 0.335],
      [1.1, 0.1],
      [1.1, 0.46],
    ],
    LAMP_HOT,
    0.32,
  ),
  polygon(
    [
      [0.5, 0.335],
      [-0.1, 0.22],
      [-0.1, 0.4],
    ],
    LAMP_HOT,
    0.14,
  ),
  ellipse(0.5, 0.335, 0.16, 0.16, LAMP, 0.18),
  ellipse(0.5, 0.335, 0.09, 0.09, LAMP, 0.35),
  ellipse(0.5, 0.88, 0.36, 0.1, NIGHT),
  polygon(
    [
      [towerSpan(0.82)[0], 0.82],
      [towerSpan(0.82)[1], 0.82],
      [towerSpan(0.4)[1], 0.4],
      [towerSpan(0.4)[0], 0.4],
    ],
    TOWER,
  ),
  band(0.5, 0.57),
  band(0.65, 0.72),
  polygon(
    [
      [0.445, 0.385],
      [0.555, 0.385],
      [0.555, 0.405],
      [0.445, 0.405],
    ],
    NIGHT,
  ),
  polygon(
    [
      [0.47, 0.305],
      [0.53, 0.305],
      [0.53, 0.385],
      [0.47, 0.385],
    ],
    LAMP_HOT,
  ),
  polygon(
    [
      [0.455, 0.305],
      [0.545, 0.305],
      [0.5, 0.255],
    ],
    RUST,
  ),
];
const SAMPLES = 4;
/**
 * RGBA pixels for a square icon `size` px wide. `zoom` < 1 shrinks the drawing toward the centre
 * (maskable icons keep everything inside the middle 80%, since launchers crop to a circle or squircle).
 */
function draw(size, zoom) {
  const pixels = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = (px + (sx + 0.5) / SAMPLES) / size;
          const v = (py + (sy + 0.5) / SAMPLES) / size;
          const x = 0.5 + (u - 0.5) / zoom;
          const y = 0.5 + (v - 0.5) / zoom;
          // The sea: deep teal at the top to brighter teal at the bottom.
          const t = Math.min(1, Math.max(0, v));
          let c = [
            SEA_TOP[0] + (SEA_BOTTOM[0] - SEA_TOP[0]) * t,
            SEA_TOP[1] + (SEA_BOTTOM[1] - SEA_TOP[1]) * t,
            SEA_TOP[2] + (SEA_BOTTOM[2] - SEA_TOP[2]) * t,
          ];
          for (const shape of SHAPES) {
            if (!shape.inside(x, y)) continue;
            const a = shape.alpha;
            c = [
              c[0] + (shape.color[0] - c[0]) * a,
              c[1] + (shape.color[1] - c[1]) * a,
              c[2] + (shape.color[2] - c[2]) * a,
            ];
          }
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = SAMPLES * SAMPLES;
      const i = (py * size + px) * 4;
      pixels[i] = Math.round(r / n);
      pixels[i + 1] = Math.round(g / n);
      pixels[i + 2] = Math.round(b / n);
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 255] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
function png(size, rgba) {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, size);
  view.setUint32(4, size);
  header[8] = 8; // bits per channel
  header[9] = 6; // RGBA
  // Each row starts with filter type 0 (none).
  const raw = new Uint8Array(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), y * (size * 4 + 1) + 1);
  }
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
const ICONS = [
  { file: 'icon-192.png', size: 192, zoom: 1 },
  { file: 'icon-512.png', size: 512, zoom: 1 },
  { file: 'icon-maskable-512.png', size: 512, zoom: 0.8 },
  { file: 'apple-touch-icon-180.png', size: 180, zoom: 1 },
  { file: 'favicon-32.png', size: 32, zoom: 1 },
];
const dir = 'public/icons';
mkdirSync(dir, { recursive: true });
for (const icon of ICONS) {
  writeFileSync(`${dir}/${icon.file}`, png(icon.size, draw(icon.size, icon.zoom)));
}
