/**
 * Reverb from a generated impulse response: stereo noise that fades away, darker toward the end,
 * like a sound echoing across open water. No audio files needed.
 */
export function createReverb(ctx: BaseAudioContext, seconds: number): ConvolverNode {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      const k = i / length;
      // A one-pole low-pass that closes as the tail goes on, so late echoes are softer and warmer.
      const darken = 0.25 + 0.7 * k;
      smooth = smooth * darken + (Math.random() * 2 - 1) * (1 - darken);
      // Short fade-in so the reverb doesn't start with a click.
      const fadeIn = Math.min(1, i / (ctx.sampleRate * 0.004));
      data[i] = smooth * Math.pow(1 - k, 2.4) * fadeIn * 1.6;
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}
