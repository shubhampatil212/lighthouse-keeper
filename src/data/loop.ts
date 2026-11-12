import type { LoopConfig, SceneTransitionConfig } from './types';

export const LOOP: LoopConfig = {
  stepHz: 60,
  maxCatchUpSteps: 5,
};

export const SCENE_TRANSITION: SceneTransitionConfig = {
  fadeMs: 220,
};
