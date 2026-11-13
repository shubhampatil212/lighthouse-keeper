/** Names and labels used across screens: ships, regions, difficulties, upgrades, counts. */
import type { BonusObjectiveDef, DifficultyId, RegionId, ShipTypeId } from '../../data/types';
import type { UpgradeId } from '../../data/uiTypes';

export const plural = (n: number, one: string, many: string): string =>
  `${n} ${n === 1 ? one : many}`;

const SHIP_NAMES: Record<ShipTypeId, { one: string; many: string }> = {
  fishing: { one: 'fishing boat', many: 'fishing boats' },
  cargo: { one: 'cargo ship', many: 'cargo ships' },
  sailboat: { one: 'sailboat', many: 'sailboats' },
  ferry: { one: 'ferry', many: 'ferries' },
  tugboat: { one: 'tugboat', many: 'tugboats' },
  smuggler: { one: 'smuggler', many: 'smugglers' },
};

export const COMMON = {
  canvasLabel: 'The sea at night, seen from the lighthouse',
  seaLandmark: 'The sea',
  hudLandmark: 'Night status',
  crashTitle: 'Something went wrong',
  crashBody: 'Your progress is saved. Reload to keep playing.',
  crashReload: 'Reload',
  gameTitleTop: 'Lighthouse',
  gameTitleBottom: 'Keeper',
  version: (v: string, built: string) => `Version ${v} · built ${built}`,
  back: 'Back',
  close: 'Close',
  locked: 'Locked',
  starsLabel: (n: number) => `${plural(n, 'star', 'stars')} out of 3`,
  starCount: (got: number, max: number) => `${got} / ${max}`,
  coinsLabel: (n: number) => plural(n, 'coin', 'coins'),
  ofTotal: (n: number, total: number) => `${n} of ${total}`,
  levelCode: (id: string) => `Night ${id}`,
  levelTitle: (id: string, name: string) => `${id} · ${name}`,

  regionName: {
    harborBay: 'Harbor Bay',
    northernIce: 'Northern Ice',
    stormStrait: 'Storm Strait',
    smugglersCove: 'Smugglers’ Cove',
    archipelago: 'Lantern Archipelago',
  } satisfies Record<RegionId, string>,

  difficultyName: {
    calm: 'Calm',
    keeper: 'Keeper',
    storm: 'Storm',
  } satisfies Record<DifficultyId, string>,
  difficultyLine: {
    calm: 'Gentle seas and more forgiveness. Ships sail slowly and reefs stay in your memory longer.',
    keeper: 'The watch as it was meant to be kept. A fair sea that asks for your attention.',
    storm: 'Fast ships, strong currents and little room for mistakes. Pays a little more.',
  } satisfies Record<DifficultyId, string>,

  upgradeName: {
    lens: 'Wider lens',
    lamp: 'Brighter lamp',
    gears: 'Oiled gears',
    foghorn: 'Foghorn',
    flares: 'Flares',
  } satisfies Record<UpgradeId, string>,
  upgradeEffect: {
    lens: 'A wider beam: lights more of the sea at once.',
    lamp: 'The beam reaches further out to sea.',
    gears: 'The beam swings around faster.',
    foghorn: 'Slows every ship near the island for a moment. Each level makes it ready sooner.',
    flares: 'Lights the whole sea for a moment. One more flare per night for each level.',
  } satisfies Record<UpgradeId, string>,

  shipName: (type: ShipTypeId) => SHIP_NAMES[type].one,
  bonus: (def: BonusObjectiveDef): string | null => {
    switch (def.kind) {
      case 'none':
        return null;
      case 'saveAllOfType':
        return `Save every ${SHIP_NAMES[def.type].one}`;
      case 'noLongDark':
        return `Leave no ship in the dark for over ${def.seconds} seconds`;
      case 'finishUnder':
        return `Bring the night to an end within ${def.seconds} seconds`;
      case 'savedTogether':
        return `Bring ${def.count} ships home within ${def.within} seconds of each other`;
      case 'catchSmugglers':
        return def.count === 'all'
          ? 'Catch every smuggler'
          : `Catch ${plural(def.count, 'smuggler', 'smugglers')}`;
      case 'noAbility':
        return def.ability === 'flare' ? 'Never fire a flare' : 'Never sound the foghorn';
      case 'driveOffPirates':
        return `Drive pirates away ${def.count === 1 ? 'once' : def.count === 2 ? 'twice' : `${def.count} times`}`;
    }
  },
  bonusDone: 'Done',
  bonusMissed: 'Missed',

  // Night ending
  endWon: 'Dawn breaks',
  endFailed: 'The fog won tonight',
  endFailedPrecious: 'A precious ship was lost',

  // Abilities (HUD buttons, briefing)
  abilityFoghorn: 'Foghorn',
  abilityFlare: 'Flare',
  abilitySwitchLamp: 'Switch lamp',
  abilityFoghornLabel: (seconds: number) =>
    seconds > 0
      ? `Foghorn, ready in ${plural(Math.ceil(seconds), 'second', 'seconds')}`
      : 'Foghorn, ready',
  abilityFlareLabel: (charges: number) => `Flare, ${plural(charges, 'charge', 'charges')} left`,
  abilitySwitchLampLabel: 'Switch which lighthouse you steer',
} as const;
