/** Every piece of text the player sees. English first; ready for translation later. Sentence case. */
import type { BonusObjectiveDef, ShipTypeId } from '../data/types';

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

const SHIP_NAMES: Record<ShipTypeId, { one: string; many: string }> = {
  fishing: { one: 'fishing boat', many: 'fishing boats' },
  cargo: { one: 'cargo ship', many: 'cargo ships' },
  sailboat: { one: 'sailboat', many: 'sailboats' },
  ferry: { one: 'ferry', many: 'ferries' },
  tugboat: { one: 'tugboat', many: 'tugboats' },
  smuggler: { one: 'smuggler', many: 'smugglers' },
};

export const STRINGS = {
  canvasLabel: 'The sea at night, seen from the lighthouse',
  bootError: 'The lamp would not light. Please reload the page.',

  // Temporary play-test HUD and end card (phase 02; the real screens arrive in phase 05).
  levelTitle: (id: string, name: string) => `${id} · ${name}`,
  hudSaved: (n: number) => `${plural(n, 'ship', 'ships')} home`,
  hudSpareHulls: (n: number) => `can still lose ${n}`,
  paused: 'Paused. Press Esc to go on.',
  endWon: 'Dawn breaks',
  endFailed: 'The fog won tonight',
  endFailedPrecious: 'A precious ship was lost',
  endSummary: (saved: number, wrecked: number) =>
    `${plural(saved, 'ship', 'ships')} reached the harbor, ${wrecked} lost to the rocks.`,
  endStarsLabel: (stars: number) => `${plural(stars, 'star', 'stars')} out of 3`,
  bonus: (def: BonusObjectiveDef): string | null => {
    switch (def.kind) {
      case 'none':
        return null;
      case 'saveAllOfType':
        return `Save every ${SHIP_NAMES[def.type].one}`;
    }
  },
  bonusDone: 'done',
  bonusMissed: 'missed',
  playAgain: 'Play again',
  hudCaught: (n: number) => `${plural(n, 'smuggler', 'smugglers')} caught`,

  // Temporary ability buttons (phase 04; the real HUD arrives in phase 05).
  abilityFoghorn: 'Horn',
  abilityFlare: 'Flare',
  abilitySwitchLamp: 'Switch lamp',
  abilityFoghornLabel: (seconds: number) =>
    seconds > 0 ? `Foghorn, ready in ${Math.ceil(seconds)} seconds` : 'Foghorn, ready',
  abilityFlareLabel: (charges: number) => `Flare, ${plural(charges, 'charge', 'charges')} left`,
  abilitySwitchLampLabel: 'Switch which lighthouse you steer',
} as const;
