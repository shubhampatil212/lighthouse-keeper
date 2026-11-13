import type { LoopConfig, SceneTransitionConfig } from './types';

export const LOOP: LoopConfig = {
  stepHz: 60,
  maxCatchUpSteps: 5,
};

export const SCENE_TRANSITION: SceneTransitionConfig = {
  // docs/SCREENS.md: a 250 ms fade (with a fog wipe unless motion is reduced).
  fadeMs: 250,
};
