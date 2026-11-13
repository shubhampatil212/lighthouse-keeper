import type { PlayConfig } from './types';

/** Timing of the play screen around the simulation. */
export const PLAY: PlayConfig = {
  // Like the prototype: the last wreck or arrival plays out before the end card appears.
  endCardDelay: 1.6,
  // GDD §7: prompts "never block play for more than about 2 seconds"; they don't block at all,
  // and stay up a little longer so there's time to read them.
  hintSeconds: 3.5,
};
