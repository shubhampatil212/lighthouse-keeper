/**
 * A level's scripted tutorial (1-1, docs/GDD.md §7): prompts that appear when the night reaches a
 * step, and a short moment where the beam is swung for the player. It reads simulation events only
 * and never pauses or blocks play.
 */
import { PLAY } from '../data';
import type { TutorialPromptId, TutorialStep } from '../data/types';
import type { SimEvent } from '../sim/events';

export interface TutorialFrame {
  prompt: TutorialPromptId | null;
  /** Where to swing the beam for the player this tick, or null to leave it to them. */
  steer: number | null;
}

export interface Tutorial {
  onEvent(event: SimEvent): void;
  step(dt: number): TutorialFrame;
}

const IDLE: TutorialFrame = { prompt: null, steer: null };

export function createTutorial(steps: readonly TutorialStep[]): Tutorial {
  let next = 0;
  let saved = 0;
  let reefSeen = false;
  let started = false;
  let prompt: TutorialPromptId | null = null;
  let promptLeft = 0;
  let waitForLit = false;
  let steer: number | null = null;
  let steerLeft = 0;

  const due = (step: TutorialStep): boolean => {
    switch (step.when.kind) {
      case 'start':
        return started;
      case 'saved':
        return saved >= step.when.count;
      case 'reefRevealed':
        return reefSeen;
    }
  };

  const begin = (step: TutorialStep): void => {
    prompt = step.prompt;
    waitForLit = step.hideOnLit ?? false;
    promptLeft = waitForLit ? PLAY.waitPromptSeconds : PLAY.hintSeconds;
    steer = step.steerTo ?? null;
    steerLeft = step.steerSeconds ?? 0;
  };

  return {
    onEvent(event) {
      if (event.type === 'shipSaved') saved++;
      if (event.type === 'reefRevealed' && event.kind === 'rock') reefSeen = true;
      // The player has found a ship with the light after the beam was swung away for them.
      if (event.type === 'shipLit' && waitForLit && steerLeft <= 0) promptLeft = 0;
    },
    step(dt) {
      started = true;
      for (let s = steps[next]; s && due(s); s = steps[next]) {
        begin(s);
        next++;
      }
      if (promptLeft > 0) promptLeft -= dt;
      if (promptLeft <= 0) prompt = null;
      if (steerLeft > 0) steerLeft -= dt;
      else steer = null;
      return prompt === null && steer === null ? IDLE : { prompt, steer };
    },
  };
}
