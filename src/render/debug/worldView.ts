/**
 * Temporary debug drawing of the simulation (phase 02): plain shapes, replaced in phase 03.
 * It keeps the game-feel rules anyway: ships in the dark show only a lantern, and rocks show only
 * in light, plus a fading outline from reef memory. "Reveal all" draws everything (drawing only;
 * the simulation never knows).
 */
import { Graphics } from 'pixi.js';
import type { SimEvent } from '../../sim/events';
import type { Ship } from '../../sim/ships';
import type { World } from '../../sim/world';
import type { Layers } from '../layers';
import { PALETTE } from '../palette';

const HULL_COLOR = { fishing: 0x2f5d6b, cargo: 0x6e3526 } as const;
const ROCK_COLOR = 0x4a453f;
const HIDDEN_COLOR = 0xff7a7a;
const WRECK_COLOR = 0xf08a6c;
/** Seconds a saved or wrecked marker stays on the water. */
const MARKER_SECONDS = 1.2;

interface Pose {
  x: number;
  y: number;
  heading: number;
}

interface Marker {
  x: number;
  y: number;
  kind: 'saved' | 'wrecked';
  age: number;
}

export interface DebugWorldView {
  /** Call before each simulation step, so drawing can blend between the last two ticks. */
  capture(world: World): void;
  onEvent(event: SimEvent): void;
  draw(world: World, alpha: number, frameSeconds: number): void;
  setPixelSize(worldUnitsPerPixel: number): void;
  revealAll: boolean;
  destroy(): void;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function lerpPose(from: Pose | undefined, to: Ship, t: number): Pose {
  if (!from) return { x: to.x, y: to.y, heading: to.heading };
  const turn = Math.atan2(Math.sin(to.heading - from.heading), Math.cos(to.heading - from.heading));
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), heading: from.heading + turn * t };
}

function hullPoints(pose: Pose, length: number, width: number): number[] {
  const c = Math.cos(pose.heading);
  const s = Math.sin(pose.heading);
  const local: [number, number][] = [
    [length / 2, 0],
    [length * 0.1, width / 2],
    [-length / 2, width * 0.4],
    [-length / 2, -width * 0.4],
    [length * 0.1, -width / 2],
  ];
  return local.flatMap(([x, y]) => [pose.x + x * c - y * s, pose.y + x * s + y * c]);
}

export function createDebugWorldView(layers: Layers): DebugWorldView {
  const seabed = new Graphics({ label: 'debugSeabed' });
  const reefs = new Graphics({ label: 'debugReefs' });
  const ships = new Graphics({ label: 'debugShips' });
  const overlay = new Graphics({ label: 'debugOverlay' });
  layers.seabed.addChild(seabed);
  layers.reefs.addChild(reefs);
  layers.ships.addChild(ships);
  layers.effects.addChild(overlay);

  const previous = new Map<number, Pose>();
  const markers: Marker[] = [];
  let pixel = 1;
  let clock = 0;

  const drawSeabed = (world: World): void => {
    const { setup } = world;
    seabed.clear();
    for (const harbor of setup.harbors) {
      seabed
        .circle(harbor.x, harbor.y, harbor.radius)
        .stroke({ color: PALETTE.lamp, width: pixel, alpha: 0.35 });
    }
    seabed
      .circle(0, 0, setup.beam.range)
      .stroke({ color: PALETTE.lampHot, width: pixel, alpha: 0.12 });
    for (const buoy of setup.buoys) {
      seabed.circle(buoy.x, buoy.y, buoy.radius).fill({ color: PALETTE.lamp, alpha: 0.08 });
      seabed.circle(buoy.x, buoy.y, 2.5).fill(PALETTE.rust);
    }
    // The current, as an arrow in the upper left of the safe circle.
    const { currentX, currentY } = setup.ships;
    const strength = Math.hypot(currentX, currentY);
    if (strength > 0) {
      const ux = currentX / strength;
      const uy = currentY / strength;
      const length = 14 + strength * 4;
      const [x0, y0] = [-150 - (ux * length) / 2, -150 - (uy * length) / 2];
      const [x1, y1] = [x0 + ux * length, y0 + uy * length];
      seabed
        .moveTo(x0, y0)
        .lineTo(x1, y1)
        .moveTo(x1 - ux * 6 - uy * 4, y1 - uy * 6 + ux * 4)
        .lineTo(x1, y1)
        .lineTo(x1 - ux * 6 + uy * 4, y1 - uy * 6 - ux * 4)
        .stroke({ color: PALETTE.seaCrest, width: 1.5 * pixel, alpha: 0.6 });
    }
  };

  const drawReefs = (world: World, revealAll: boolean): void => {
    reefs.clear();
    for (const rock of world.state.rocks) {
      if (rock.lit) {
        reefs
          .circle(rock.x, rock.y, rock.r)
          .fill(ROCK_COLOR)
          .stroke({ color: PALETTE.seaCrest, width: pixel, alpha: 0.5 });
      } else if (rock.memory > 0.02) {
        reefs
          .circle(rock.x, rock.y, rock.r)
          .stroke({ color: PALETTE.lamp, width: pixel, alpha: rock.memory * 0.5 });
      } else if (revealAll) {
        reefs
          .circle(rock.x, rock.y, rock.r)
          .stroke({ color: HIDDEN_COLOR, width: pixel, alpha: 0.6 });
      }
    }
  };

  const drawShips = (world: World, alpha: number, revealAll: boolean): void => {
    ships.clear();
    overlay.clear();
    const types = world.setup.ships.types;
    for (const ship of world.state.ships) {
      const pose = lerpPose(previous.get(ship.id), ship, alpha);
      const type = types[ship.type];
      if (ship.wake.length > 1) {
        ship.wake.forEach((point, i) => {
          if (i === 0) ships.moveTo(point.x, point.y);
          else ships.lineTo(point.x, point.y);
        });
        ships
          .lineTo(pose.x, pose.y)
          .stroke({ color: PALETTE.seaCrest, width: 1.5 * pixel, alpha: ship.lit ? 0.35 : 0.12 });
      }
      if (ship.lit || revealAll) {
        ships
          .poly(hullPoints(pose, type.length, type.width))
          .fill({ color: HULL_COLOR[ship.type], alpha: ship.lit ? 1 : 0.5 });
      }
      // The lantern is always visible: brighter and bigger when lit.
      overlay
        .circle(pose.x, pose.y, ship.lit ? 3.5 : 2.5)
        .fill({ color: ship.lit ? PALETTE.lampHot : PALETTE.lamp, alpha: ship.lit ? 0.95 : 0.75 });
      if (ship.lost) {
        const pulse = 0.5 + Math.sin(clock * 5) * 0.3;
        overlay
          .circle(pose.x, pose.y - 12, 4)
          .stroke({ color: PALETTE.parchment, width: 1.5 * pixel, alpha: pulse });
      }
    }
    for (const marker of markers) {
      const k = 1 - marker.age / MARKER_SECONDS;
      if (marker.kind === 'saved') {
        overlay
          .circle(marker.x, marker.y, 4 + (1 - k) * 26)
          .stroke({ color: PALETTE.lamp, width: 2 * pixel, alpha: k });
      } else {
        const r = 6 + (1 - k) * 6;
        overlay
          .moveTo(marker.x - r, marker.y - r)
          .lineTo(marker.x + r, marker.y + r)
          .moveTo(marker.x + r, marker.y - r)
          .lineTo(marker.x - r, marker.y + r)
          .stroke({ color: WRECK_COLOR, width: 2 * pixel, alpha: k });
      }
    }
  };

  return {
    revealAll: false,
    capture(world) {
      previous.clear();
      for (const ship of world.state.ships)
        previous.set(ship.id, { x: ship.x, y: ship.y, heading: ship.heading });
    },
    onEvent(event) {
      if (event.type === 'shipSaved')
        markers.push({ x: event.x, y: event.y, kind: 'saved', age: 0 });
      if (event.type === 'shipWrecked')
        markers.push({ x: event.x, y: event.y, kind: 'wrecked', age: 0 });
    },
    draw(world, alpha, frameSeconds) {
      clock += frameSeconds;
      for (const marker of markers) marker.age += frameSeconds;
      while (markers.length > 0 && (markers[0]?.age ?? 0) > MARKER_SECONDS) markers.shift();
      drawSeabed(world);
      drawReefs(world, this.revealAll);
      drawShips(world, alpha, this.revealAll);
    },
    setPixelSize(worldUnitsPerPixel) {
      pixel = worldUnitsPerPixel;
    },
    destroy() {
      for (const g of [seabed, reefs, ships, overlay]) g.destroy();
    },
  };
}
