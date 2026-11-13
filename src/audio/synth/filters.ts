/** Filters and slow modulators for the synth voices and the ambience. */

export function filter(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  frequency: number,
  q = 0.7,
): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

/**
 * A slow sine LFO that moves `param` ±`depth` around its own value, `rate` times per second.
 * Returns the oscillator so the caller can stop it.
 */
export function lfo(
  ctx: BaseAudioContext,
  param: AudioParam,
  depth: number,
  rate: number,
  at: number,
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.frequency.value = rate;
  const amount = ctx.createGain();
  amount.gain.value = depth;
  osc.connect(amount).connect(param);
  osc.start(at);
  return osc;
}

/** −1…1 left/right, made with a StereoPanner where it exists (every current browser). */
export function panner(ctx: BaseAudioContext, pan: number): AudioNode {
  const node = ctx.createStereoPanner();
  node.pan.value = Math.max(-1, Math.min(1, pan));
  return node;
}
