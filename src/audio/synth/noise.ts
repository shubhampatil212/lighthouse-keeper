/**
 * Noise sources: white (hiss), pink (wind, softer) and brown (surf, deep). One 4-second buffer per
 * color is made once per AudioContext and looped from a random point, so repeats aren't noticed.
 */
export type NoiseColor = 'white' | 'pink' | 'brown';

const SECONDS = 4;
const cache = new WeakMap<BaseAudioContext, Partial<Record<NoiseColor, AudioBuffer>>>();

function fill(data: Float32Array, color: NoiseColor): void {
  // Pink: Paul Kellet's filter. Brown: integrated white noise, leaking back toward zero.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (color === 'white') {
      data[i] = white * 0.5;
    } else if (color === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  // Fade the loop point over a few milliseconds so the loop never clicks.
  const edge = Math.min(256, data.length >> 1);
  for (let i = 0; i < edge; i++) {
    const k = i / edge;
    const end = data.length - edge + i;
    data[end] = (data[end] ?? 0) * (1 - k) + (data[i] ?? 0) * k;
  }
}

export function noiseBuffer(ctx: BaseAudioContext, color: NoiseColor): AudioBuffer {
  let byColor = cache.get(ctx);
  if (!byColor) {
    byColor = {};
    cache.set(ctx, byColor);
  }
  const cached = byColor[color];
  if (cached) return cached;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * SECONDS), ctx.sampleRate);
  fill(buffer.getChannelData(0), color);
  byColor[color] = buffer;
  return buffer;
}

/** A looping noise source, not yet started. Call `startNoise` to start it at a random point. */
export function noiseSource(ctx: BaseAudioContext, color: NoiseColor): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, color);
  source.loop = true;
  return source;
}

export function startNoise(source: AudioBufferSourceNode, at: number): void {
  source.start(at, Math.random() * (SECONDS - 0.5));
}
