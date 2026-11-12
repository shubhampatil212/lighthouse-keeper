/**
 * The game loop: the simulation advances in fixed steps (60 per second), while drawing happens
 * every animation frame with an "alpha" saying how far we are between two steps.
 */
import type { LoopConfig } from '../data/types';

export interface FrameAdvance {
  /** How many fixed simulation steps to run this frame. */
  steps: number;
  /** Fraction (0 to <1) of the way from the last step to the next one, for smooth drawing. */
  alpha: number;
}

export interface FixedStepper {
  readonly stepSeconds: number;
  advance(elapsedSeconds: number): FrameAdvance;
  reset(): void;
}

export function createFixedStepper(config: LoopConfig): FixedStepper {
  const stepSeconds = 1 / config.stepHz;
  let accumulator = 0;

  return {
    stepSeconds,
    advance(elapsedSeconds) {
      accumulator += Math.max(0, elapsedSeconds);
      let steps = Math.floor(accumulator / stepSeconds);
      if (steps > config.maxCatchUpSteps) {
        // Too far behind (slow device, debugger): run the cap and forget the rest.
        steps = config.maxCatchUpSteps;
        accumulator %= stepSeconds;
      } else {
        accumulator -= steps * stepSeconds;
      }
      // Guard against floating-point drift leaving a full step in the accumulator.
      if (accumulator >= stepSeconds) accumulator = 0;
      return { steps, alpha: accumulator / stepSeconds };
    },
    reset() {
      accumulator = 0;
    },
  };
}

export interface GameLoopHooks {
  /** One fixed simulation step of `dt` seconds. */
  update(dt: number): void;
  /** Draw a frame; alpha is the interpolation between the last two steps. */
  render(alpha: number): void;
}

export interface GameLoop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

/** Drives a FixedStepper with requestAnimationFrame and pauses while the tab is hidden. */
export function createGameLoop(config: LoopConfig, hooks: GameLoopHooks): GameLoop {
  const stepper = createFixedStepper(config);
  let frameId = 0;
  let lastTime: number | null = null;
  let wanted = false;

  const frame = (now: number): void => {
    frameId = requestAnimationFrame(frame);
    const elapsed = lastTime === null ? 0 : (now - lastTime) / 1000;
    lastTime = now;
    const { steps, alpha } = stepper.advance(elapsed);
    for (let i = 0; i < steps; i++) hooks.update(stepper.stepSeconds);
    hooks.render(alpha);
  };

  const resume = (): void => {
    if (frameId !== 0) return;
    lastTime = null;
    stepper.reset();
    frameId = requestAnimationFrame(frame);
  };
  const halt = (): void => {
    if (frameId !== 0) cancelAnimationFrame(frameId);
    frameId = 0;
  };
  const onVisibility = (): void => {
    if (document.hidden) halt();
    else if (wanted) resume();
  };

  return {
    start() {
      if (wanted) return;
      wanted = true;
      document.addEventListener('visibilitychange', onVisibility);
      if (!document.hidden) resume();
    },
    stop() {
      wanted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      halt();
    },
    get running() {
      return frameId !== 0;
    },
  };
}
