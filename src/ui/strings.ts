/**
 * Every piece of text the player sees. English first; ready for translation later. Sentence case.
 * The text is grouped in src/ui/text/ (common names, screens, logbook) and gathered here, so the
 * rest of the game only ever imports STRINGS.
 */
import { COMMON } from './text/common';
import { LOGBOOK } from './text/logbook';
import { SCREENS } from './text/screens';

export type { HintId, TipKey } from './text/screens';

export const STRINGS = { ...COMMON, ...SCREENS, ...LOGBOOK } as const;
