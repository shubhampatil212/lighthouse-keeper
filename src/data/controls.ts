import type { ControlsConfig } from './types';

/** Input tuning (docs/GDD.md §3.1). The control style becomes a player setting in phase 08. */
export const CONTROLS: ControlsConfig = {
  defaultStyle: 'follow',
  deadZonePx: 12,
  keyboardLead: 0.45,
};
