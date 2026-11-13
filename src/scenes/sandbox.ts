/**
 * The sandbox (debug only, #sandbox): an endless night on 1-2's reefs where any ship or hazard can be
 * sent in from a panel, placed by tapping the sea, and watched at any speed. For play-testing each
 * element on its own. It wraps the play scene, so everything draws and plays exactly as in a level.
 */
import type { Viewport } from '../app/viewport';
import {
  HAZARDS,
  SANDBOX_LEVEL,
  SANDBOX_PLACING,
  SANDBOX_SECOND_HARBOR,
  SANDBOX_SECOND_LAMP,
  SANDBOX_UPGRADES,
  SEA,
} from '../data';
import type { Compass, HazardDef, HazardKind, LevelDef, Upgrades } from '../data/types';
import { createSandboxPanel, type PlaceKind, type SandboxSetup } from '../ui/sandboxPanel';
import { createPlayScene, type PlayScene, type PlaySceneOptions } from './play';

const COMPASS: Record<Compass, number> = {
  north: -Math.PI / 2,
  east: 0,
  south: Math.PI / 2,
  west: Math.PI,
};

/** Placement randomness is fine here: the sandbox is a debug tool, and the sim only sees the result. */
const random = (min: number, max: number): number => min + Math.random() * (max - min);

function levelFor(setup: SandboxSetup): LevelDef {
  const island = { x: 0, y: 0, radius: SEA.defaultHarborRadius };
  return {
    ...SANDBOX_LEVEL,
    ...(setup.secondHarbor ? { harbors: [island, SANDBOX_SECOND_HARBOR] } : {}),
    ...(setup.secondLamp ? { secondLamp: SANDBOX_SECOND_LAMP } : {}),
  };
}

function upgradesFor(setup: SandboxSetup): Upgrades {
  return { ...SANDBOX_UPGRADES, foghorn: setup.foghorn, flares: setup.flares, buoys: setup.buoys };
}

/** A hazard of `kind` at (x, y); for a fog band, lying across the line from the island. */
function hazardAt(kind: HazardKind, x: number, y: number): HazardDef {
  switch (kind) {
    case 'fogBand':
      return {
        kind,
        x,
        y,
        angle: Math.atan2(y, x) + Math.PI / 2,
        length: SANDBOX_PLACING.fogLength,
        width: SANDBOX_PLACING.fogWidth,
      };
    case 'iceberg':
    case 'whirlpool':
      return { kind, x, y };
    case 'pirate':
      return { kind, at: 0, angle: Math.atan2(y, x) };
    case 'lightning':
    case 'stormWaves':
      return { kind };
  }
}

export function createSandboxScene(
  options: Omit<PlaySceneOptions, 'level' | 'upgrades' | 'endless'>,
): PlayScene {
  let setup: SandboxSetup = {
    secondHarbor: false,
    secondLamp: false,
    foghorn: SANDBOX_UPGRADES.foghorn,
    flares: SANDBOX_UPGRADES.flares,
    buoys: [],
  };
  const play = createPlayScene({
    ...options,
    level: levelFor(setup),
    upgrades: upgradesFor(setup),
    endless: true,
  });
  let placing: { kind: PlaceKind; harbor: number } | null = null;

  const place = (kind: PlaceKind, x: number, y: number, harbor: number): void => {
    const world = play.world;
    if (kind === 'fogBand' || kind === 'iceberg' || kind === 'whirlpool' || kind === 'pirate') {
      world.addHazard(hazardAt(kind, x, y));
    } else {
      world.launchShip(kind, Math.atan2(y, x), harbor);
    }
  };

  const panel = createSandboxPanel(options.uiRoot, setup, {
    spawnShip(type, harbor, from) {
      const angle = from === 'random' ? random(-Math.PI, Math.PI) : COMPASS[from];
      play.world.launchShip(type, angle, harbor);
    },
    addHazard(kind) {
      const a = random(-Math.PI, Math.PI);
      const d =
        kind === 'iceberg'
          ? random(SANDBOX_PLACING.nearMin, SANDBOX_PLACING.nearMax - HAZARDS.iceberg.radiusMax)
          : random(SANDBOX_PLACING.nearMin, SANDBOX_PLACING.nearMax);
      play.world.addHazard(hazardAt(kind, Math.cos(a) * d, Math.sin(a) * d));
    },
    clearHazard(kind) {
      play.world.clearHazard(kind);
    },
    setPlacing(kind, harbor) {
      placing = kind ? { kind, harbor } : null;
    },
    setTimeScale(scale) {
      play.timeScale = scale;
    },
    setSetup(next) {
      setup = next;
      play.load(levelFor(setup), upgradesFor(setup));
    },
    restart() {
      play.restart(false);
    },
  });
  panel.show(false);

  // While "place on tap" is on, a tap on the sea places the chosen thing instead of steering.
  // Listening on the window in the capture phase runs before the canvas's own steering listeners.
  const onTap = (event: PointerEvent): void => {
    if (!placing || event.target !== options.canvas) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    const rect = options.canvas.getBoundingClientRect();
    const vp: Viewport = options.viewport();
    const x = (event.clientX - rect.left - vp.centerX) / vp.scale;
    const y = (event.clientY - rect.top - vp.centerY) / vp.scale;
    place(placing.kind, x, y, placing.harbor);
  };

  return {
    ...play,
    get settings() {
      return play.settings;
    },
    get world() {
      return play.world;
    },
    get timeScale() {
      return play.timeScale;
    },
    set timeScale(scale) {
      play.timeScale = scale;
    },
    enter(params) {
      play.enter(params);
      panel.show(true);
      window.addEventListener('pointerdown', onTap, { capture: true });
    },
    exit() {
      window.removeEventListener('pointerdown', onTap, { capture: true });
      panel.show(false);
      play.exit();
    },
  };
}
