/**
 * Draws a night. Builds every view on the layers from docs/ART_AUDIO.md, reads the world each frame
 * (blending ship poses and the beam between the last two ticks), and never changes the simulation.
 * Scenes call capture() before each tick, onEvent() for each event, and draw() once per frame.
 */
import { Graphics, type Renderer as PixiRenderer } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import { ISLAND, REGIONS, RENDER_FEEL, SEA } from '../data';
import type {
  IslandBuildingId,
  QualityProfile,
  RegionId,
  ShipTypeConfig,
  ShipTypeId,
  WeatherDef,
} from '../data/types';
import { lerpAngle } from '../sim/angle';
import type { SimEvent } from '../sim/events';
import type { World } from '../sim/world';
import { createArrowView } from './arrowView';
import type { ArtProvider, Point } from './art/types';
import { createBeamFx } from './beamFx';
import { createRevealOverlay } from './debug/revealOverlay';
import { createEffects } from './effects';
import { lerpPose, type Pose } from './interpolate';
import { createIslandView } from './islandView';
import { applyViewport, type Layers } from './layers';
import { createLightMap } from './lightMap';
import { PALETTE } from './palette';
import type { ParticleBudget } from './particles';
import { createReefView } from './reefView';
import { createShipView, type ShipPose } from './shipView';
import { createWater } from './water';
import { createWeather } from './weather';

export interface NightRenderer {
  /** Call when a new night starts (or restarts). */
  setNight(world: World): void;
  /** Call before each simulation step, so drawing can blend between the last two ticks. */
  capture(world: World): void;
  onEvent(event: SimEvent, world: World): void;
  draw(world: World, alpha: number, frameSeconds: number): void;
  resize(vp: Viewport): void;
  setQuality(profile: QualityProfile): void;
  setRegion(id: RegionId): void;
  setWeather(weather: WeatherDef): void;
  setBuildings(ids: readonly IslandBuildingId[]): void;
  /** Debug: all six ship types side by side, lit, so they can be compared. */
  setParade(on: boolean): void;
  /** Debug: outline hidden rocks and dark ships in red (drawing only). */
  setRevealAll(on: boolean): void;
  setReducedMotion(on: boolean): void;
  destroy(): void;
}

const PARADE_ORDER: readonly ShipTypeId[] = [
  'fishing',
  'cargo',
  'sailboat',
  'ferry',
  'tugboat',
  'smuggler',
];
const PARADE_Y = 120;
const PARADE_GAP = 12;

function paradePoses(types: Record<ShipTypeId, ShipTypeConfig>): ShipPose[] {
  const total =
    PARADE_ORDER.reduce((sum, t) => sum + types[t].length, 0) +
    PARADE_GAP * (PARADE_ORDER.length - 1);
  let x = -total / 2;
  return PARADE_ORDER.map((type, i) => {
    const length = types[type].length;
    const pose: ShipPose = {
      id: -1 - i,
      type,
      x: x + length / 2,
      y: PARADE_Y + (i % 2) * 14,
      heading: -0.12,
      lit: true,
      lost: false,
      wake: [],
    };
    x += length + PARADE_GAP;
    return pose;
  });
}

export function createNightRenderer(
  renderer: PixiRenderer,
  layers: Layers,
  art: ArtProvider,
  types: Record<ShipTypeId, ShipTypeConfig>,
): NightRenderer {
  const feel = RENDER_FEEL;
  const budget: ParticleBudget = { cap: 0, used: 0 };

  const water = createWater(art.textures.wave);
  layers.water.addChild(water.container);
  const reefs = createReefView(art, layers, feel);
  const ships = createShipView(art, types, layers, feel);
  const island = createIslandView(art, layers.island, layers.lightFx, ISLAND.radius);
  const lightMap = createLightMap(renderer, art, feel);
  const weather = createWeather(
    { underDarkness: layers.darkness, weather: layers.weather, lightFx: layers.lightFx },
    art.textures,
    budget,
    feel,
  );
  layers.darkness.addChild(lightMap.sprite);
  const beamFx = createBeamFx(art, feel);
  layers.lightFx.addChildAt(beamFx.container, 0);
  const current = new Graphics({ label: 'current' });
  layers.effects.addChild(current);
  const effects = createEffects(layers.effects, art.textures, budget, feel);
  const arrows = createArrowView(layers.effects, feel);
  const reveal = createRevealOverlay(layers.effects, types);

  const previous = new Map<number, Pose>();
  let previousBeam = 0;
  let vp: Viewport | null = null;
  let time = 0;
  let parade = false;
  let revealAll = false;
  let night: World | null = null;
  const parading = paradePoses(types);

  const drawCurrent = (): void => {
    current.clear();
    if (!night || !vp) return;
    const { currentX, currentY } = night.setup.ships;
    const strength = Math.hypot(currentX, currentY);
    if (strength <= 0) return;
    const ux = currentX / strength;
    const uy = currentY / strength;
    const length = 14 + strength * 4;
    const [x0, y0] = [-150 - (ux * length) / 2, -150 - (uy * length) / 2];
    const [x1, y1] = [x0 + ux * length, y0 + uy * length];
    current
      .moveTo(x0, y0)
      .lineTo(x1, y1)
      .moveTo(x1 - ux * 6 - uy * 4, y1 - uy * 6 + ux * 4)
      .lineTo(x1, y1)
      .lineTo(x1 - ux * 6 + uy * 4, y1 - uy * 6 - ux * 4)
      .stroke({ color: PALETTE.seaCrest, width: 1.5 / vp.scale, alpha: 0.4, cap: 'round' });
  };

  return {
    setNight(world) {
      night = world;
      previous.clear();
      previousBeam = world.state.beam.angle;
      reefs.setNight(world);
      ships.clear();
      effects.clear();
      drawCurrent();
    },
    capture(world) {
      previousBeam = world.state.beam.angle;
      previous.clear();
      for (const ship of world.state.ships)
        previous.set(ship.id, { x: ship.x, y: ship.y, heading: ship.heading });
    },
    onEvent(event, world) {
      effects.onEvent(event, world);
    },
    draw(world, alpha, frameSeconds) {
      if (!vp) return;
      const dt = frameSeconds;
      time += dt;
      const { state, setup } = world;

      effects.update(dt);
      const shake = effects.shake();
      applyViewport(layers, vp, shake.x, shake.y);
      lightMap.setOffset(shake.x, shake.y);

      const angle = lerpAngle(previousBeam, state.beam.angle, alpha);
      const lamp = art.island.lampPoint;
      water.update(
        time,
        {
          angle,
          halfAngle: setup.beam.halfAngle,
          range: setup.beam.range,
          glowRadius: setup.beam.glowRadius,
        },
        { x: vp.centerX + lamp.x * vp.scale, y: vp.centerY + lamp.y * vp.scale },
        ISLAND.radius,
      );
      reefs.draw(world, dt, time);

      const poses: ShipPose[] = state.ships.map((ship) => {
        const pose = lerpPose(previous.get(ship.id), ship, alpha);
        return {
          id: ship.id,
          type: ship.type,
          ...pose,
          lit: ship.lit,
          lost: ship.lost,
          wake: ship.wake,
        };
      });
      const pools = ships.draw(parade ? [...poses, ...parading] : poses, dt, time);
      island.draw(time);

      lightMap.draw({
        beamAngle: angle,
        beam: setup.beam,
        buoys: setup.buoys,
        lanterns: pools,
        mapLit: state.mapLight > 0 || parade,
        time,
      });
      beamFx.draw(angle, setup.beam, time);
      weather.update(dt, time, angle, setup.beam);

      const due: (Point & { inSeconds: number })[] = [];
      if (state.status === 'playing') {
        for (let i = state.spawnIndex; i < setup.spawns.length; i++) {
          const order = setup.spawns[i];
          if (!order) continue;
          const inSeconds = order.at - state.time;
          if (inSeconds > feel.arrowLookAhead) break;
          due.push({
            x: Math.cos(order.angle) * SEA.spawnRadius,
            y: Math.sin(order.angle) * SEA.spawnRadius,
            inSeconds,
          });
        }
      }
      arrows.draw(vp, poses, due, time);
      reveal.draw(world, poses, revealAll, 1 / vp.scale);
    },
    resize(next) {
      vp = next;
      water.resize(next);
      lightMap.resize(next);
      weather.resize(next);
      const textResolution = Math.max(1, next.scale * next.resolution);
      ships.setTextResolution(textResolution);
      effects.setTextResolution(textResolution);
      drawCurrent();
    },
    setQuality(profile) {
      budget.cap = profile.particleCap;
      water.setQuality(profile);
      lightMap.setQuality(profile);
      weather.setQuality(profile);
      if (budget.used > budget.cap) effects.clear();
    },
    setRegion(id) {
      const { palette } = REGIONS[id];
      water.setPalette(palette);
      lightMap.setPalette(palette);
      weather.setPalette(palette);
    },
    setWeather(next) {
      weather.setWeather(next);
    },
    setBuildings(ids) {
      island.setBuildings(ids);
    },
    setParade(on) {
      parade = on;
    },
    setRevealAll(on) {
      revealAll = on;
    },
    setReducedMotion(on) {
      effects.setReducedMotion(on);
    },
    destroy() {
      for (const view of [
        water,
        reefs,
        ships,
        island,
        lightMap,
        weather,
        beamFx,
        effects,
        arrows,
        reveal,
      ]) {
        view.destroy();
      }
      current.destroy();
    },
  };
}
