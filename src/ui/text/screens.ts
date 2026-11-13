/** Text on the menus, HUD, pause, results, shop, settings and credits. */
import type { IslandBuildingId } from '../../data/types';
import { plural } from './common';

export type TipKey = 'precious' | 'pirate' | 'whirlpool' | 'iceberg' | 'dark' | 'late' | 'sweep';
export type HintId =
  | 'lost'
  | 'smuggler'
  | 'ferry'
  | 'pirate'
  | 'whirlpool'
  | 'lightning'
  | 'cargo'
  | 'sailboat'
  | 'tugboat'
  | 'iceberg'
  | 'fog'
  | 'waves'
  | 'harbors'
  | 'secondLamp'
  | 'foghorn'
  | 'flare';

export const SCREENS = {
  // Boot
  bootLoading: 'Lighting the lamp…',
  bootReady: 'The lamp is lit.',
  bootTap: 'Tap to begin',

  // Title
  titleMenuLabel: 'Main menu',
  titleBegin: 'Begin your watch',
  titleContinue: 'Continue',
  titleEndless: 'Endless watch',
  titleLogbook: 'Logbook',
  titleSettings: 'Settings',
  titleCredits: 'Credits',
  endlessLocked: 'Finish Harbor Bay to open the endless watch.',
  titleDaily: 'Daily sea',

  // Difficulty (first launch)
  difficultyTitle: 'How rough a sea?',
  difficultyNote: 'You can change this later in Settings.',
  difficultyStart: 'Light the lamp',

  // Map and level select
  mapTitle: 'Sea chart',
  mapRegionStars: (got: number, max: number) => `, ${got} of ${max} stars`,
  mapLockedHint: (before: string) => `Finish ${before} to sail here.`,
  levelCodeLabel: (id: string) => `${id}, `,
  levelLockedHint: 'Finish the night before this one first.',

  // Briefing
  briefingNew: 'New tonight',
  briefingBonus: 'Bonus',
  briefingNoBonus: 'Save every ship you can.',
  briefingAbilities: 'On hand',
  briefingJustBeam: 'Just your beam tonight.',
  briefingFlares: (n: number) => `Flares ×${n}`,
  briefingBuoys: (n: number) => plural(n, 'bell buoy', 'bell buoys'),
  briefingBest: (difficulty: string) => `Best on ${difficulty}`,
  briefingGo: 'Light the lamp',

  // HUD
  hudPause: 'Pause',
  hudProgressLabel: (name: string) => `${name}: ships still to come`,
  hudSaved: (n: number) => `${plural(n, 'ship', 'ships')} home`,
  hudSpareHulls: (n: number) => `Can still lose ${n}`,
  hudCaught: (n: number) => `${plural(n, 'smuggler', 'smugglers')} caught`,

  // Contextual prompts
  hint: {
    lost: 'A ship is lost in the dark. Swing the light back to it.',
    smuggler: 'A smuggler! Hold the light on it for 2 seconds to catch it.',
    ferry: 'The ferry is precious. If it sinks, the night is lost.',
    pirate: 'A pirate! Shine on it to drive it away.',
    whirlpool: 'Light ships near the whirlpool so they steer round it.',
    lightning: 'Lightning soon. Look around while the sea is bright.',
    cargo: 'Cargo ships turn slowly. Light them early so they have room.',
    sailboat: 'Sailboats drift with the current when they’re in the dark.',
    tugboat: 'Light a tugboat and it slows the dark ships near it.',
    iceberg: 'Icebergs drift. Look again where you saw one last.',
    fog: 'Thick fog shortens your beam. Ships inside it need you closer.',
    waves: 'Storm waves push every ship, lit or not.',
    harbors: 'Two harbors tonight. Lit ships steer for their own color.',
    secondLamp: 'A second lamp! Tap the lamp button to steer the other one.',
    foghorn: 'Tap the horn to slow every ship near the island.',
    flare: 'Tap the flare to light the whole sea for a moment.',
  } satisfies Record<HintId, string>,

  // Scripted tutorial (1-1)
  tutorial: {
    followLight: 'Ships follow your light.',
    swingBeamFollow: 'Point where the light should go.',
    swingBeamDrag: 'Drag to swing the beam.',
    rocksSeen: 'Lit ships see the rocks.',
  },

  // Pause
  pauseTitle: 'Paused',
  pauseResume: 'Resume',
  pauseRestart: 'Restart',
  pauseSettings: 'Settings',
  pauseQuit: 'Quit to map',

  // Results
  resultsSaved: 'Ships home',
  resultsWrecked: 'Lost to the sea',
  resultsCaught: 'Smugglers caught',
  resultsTime: 'Time',
  resultsCoins: 'Coins earned',
  resultsStarCoins: 'Star bonus',
  resultsUnlocked: 'Now open',
  unlockRegion: (region: string) => `${region} on the sea chart`,
  unlockEndless: 'The endless watch',
  unlockBuilding: {
    cottage: 'A cottage on the island',
    dock: 'A dock for the supply boat',
    chapel: 'A chapel on the hill',
    market: 'A market by the quay',
    festivalLights: 'Festival lights round the island',
  } satisfies Record<IslandBuildingId, string>,
  unlockDiary: 'A new page in your logbook',
  unlockShop: (upgrade: string) => `${upgrade} in the harbor shop`,
  resultsNext: 'Next night',
  resultsRetry: 'Try again',
  resultsHarbor: 'Harbor',
  tip: {
    precious:
      'The ferry carries everyone’s hopes. Keep it lit the whole way in, even if others wait.',
    pirate: 'Pirates hunt ships in the dark. Shine on them early and they turn tail.',
    whirlpool: 'Ships near the whirlpool need your light so they can steer round it.',
    iceberg: 'Icebergs drift. Sweep past them now and then so ships see where they’ve moved.',
    dark: 'Ships drifted in the dark too long. Try shorter, faster sweeps.',
    late: 'Ships met the rocks soon after you found them. Light them earlier, while they’re still out at sea.',
    sweep: 'Every ship needs a moment of light. Keep the beam moving.',
  } satisfies Record<TipKey, string>,

  // Endless results
  endlessScore: (n: number) => `${n} points`,
  endlessNewBest: 'A new best!',
  endlessBest: 'Best',
  endlessDaily: (date: string) => `Daily sea · ${date}`,
  endlessAgain: 'Again',
  endlessTitle: 'Title',

  // Harbor shop
  shopTitle: 'Harbor',
  shopLevel: (level: number, max: number) => `Level ${level} of ${max}`,
  shopBuy: (cost: number) => `${cost}`,
  shopMaxed: 'Full',
  shopBought: (name: string) => `${name} fitted.`,
  shopOpensAfter: (levelId: string) => `Sold after night ${levelId}.`,
  shopBuoysTitle: 'Bell buoys',
  shopBuoysLine: (levelName: string) =>
    `A buoy lights a small circle round a reef. Place it on the chart for “${levelName}”.`,
  shopBuoyCount: (n: number, max: number, region: string) => `${n} of ${max} placed in ${region}.`,
  shopBuoyPick: 'Tap a reef on the chart.',
  shopBuoyPlace: (cost: number) => `Place buoy · ${cost}`,
  shopBuoyCancel: 'Cancel',
  shopBuoyFull: 'Region full',
  shopReef: (n: number) => `Reef ${n}`,
  shopReefWithBuoy: (n: number) => `Reef ${n}, has a buoy`,
  shopToMap: 'Back to the chart',

  // Settings
  settingsTitle: 'Settings',
  settingsSound: 'Sound',
  settingsMaster: 'Master',
  settingsMusic: 'Music',
  settingsEffects: 'Effects',
  settingsAmbience: 'Ambience',
  settingsMute: 'Mute everything',
  settingsDisplay: 'Display',
  settingsQuality: 'Graphics',
  qualityLow: 'Low',
  qualityMedium: 'Medium',
  qualityHigh: 'High',
  qualityAuto: 'Auto',
  settingsFps: 'Show frame rate',
  settingsShake: 'Screen shake',
  settingsGameplay: 'Gameplay',
  settingsDifficulty: 'Difficulty',
  settingsDifficultyRestarts: 'Changing difficulty starts the night again.',
  settingsBeam: 'Beam control',
  beamFollow: 'Follow finger',
  beamDrag: 'Drag to rotate',
  settingsLeftHanded: 'Left-handed buttons',
  settingsTutorial: 'Tutorial prompts',
  settingsAccess: 'Accessibility',
  settingsReducedMotion: 'Reduced motion',
  settingsColorblind: 'Colorblind-friendly colors',
  settingsHighContrast: 'High-contrast reefs',
  settingsLargerText: 'Larger text',
  settingsHaptics: 'Vibration',
  settingsData: 'Data',
  settingsExport: 'Export save',
  settingsImport: 'Import save',
  settingsSaveNote: 'Progress and settings are saved on this device as you play.',
  settingsSaveOff: 'This browser won’t let the game save. Export your save to keep it.',
  settingsExportDone: 'Save downloaded.',
  settingsImportInvalid: 'That file isn’t a Lighthouse Keeper save.',
  settingsImportTitle: 'Load this save?',
  settingsImportSummary: (stars: number, coins: number): string =>
    `It has ${stars} ${stars === 1 ? 'star' : 'stars'} and ${coins} ${coins === 1 ? 'coin' : 'coins'}. It replaces your progress and settings on this device.`,
  settingsImportConfirm: 'Load save',
  settingsImportCancel: 'Keep mine',
  settingsImportDone: 'Save loaded. Welcome back, keeper.',
  saveUnreadable:
    'Your saved progress couldn’t be read, so a new watch begins. A copy was kept on this device.',
  settingsReset: 'Reset progress',
  settingsResetConfirm: 'Tap again to erase everything',
  settingsResetDone: 'Progress erased',
  settingsResetToast: 'A new keeper takes the watch.',

  // Screen reader announcements during a night
  announceSaved: (n: number): string => (n === 1 ? 'A ship is home.' : `${n} ships are home.`),
  announceWrecked: (n: number): string =>
    n === 1 ? 'A ship was wrecked.' : `${n} ships were wrecked.`,
  announceWon: (stars: number): string =>
    `Dawn. Night complete with ${stars} ${stars === 1 ? 'star' : 'stars'}.`,
  announceLost: 'The night is lost.',
  announcePaused: 'Paused.',

  // Credits
  creditsTitle: 'Credits',
  credits: [
    ['Lighthouse Keeper', 'A game about light, patience and the people at sea.'],
    ['Made with', 'PixiJS (MIT license)', 'TypeScript and Vite', 'The Web Audio API'],
    [
      'Fonts',
      'IM Fell English by Igino Marini, SIL Open Font License 1.1',
      'Karla by Jonathan Pinhorn, SIL Open Font License 1.1',
    ],
    ['Art and sound', 'Drawn and played in code, live in your browser.'],
    ['Thank you', 'To everyone who ever kept a light burning for someone out in the dark.'],
  ] as const,
} as const;
