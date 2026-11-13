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
import { createHarborView } from './harborView';
import type { Pose } from './interpolate';
import { createIslandView } from './islandView';
import { applyViewport, type Layers } from './layers';
import { beamReachThroughFog, createLightMap } from './lightMap';
import { PALETTE } from './palette';
import type { ParticleBudget } from './particles';
import { createReefView } from './reefView';
import { createShipView } from './shipView';
import { createVesselMarks } from './vesselMarks';
import { capturePoses, paradePoses, vesselPoses, vesselSizes } from './vessels';
import { createWater } from './water';
import { createWeather } from './weather';
import { ABILITIES, HAZARDS } from '../data';
import { createHazardView } from './hazardView';
import { createSecondLampView } from './secondLampView';
import { createSkyFx } from './skyFx';

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
  /** Debug: every vessel (six ship types, pirate, coast guard) side by side, lit, to compare them. */
  setParade(on: boolean): void;
  /** Colorblind mode: harbor colors switch to blue/orange and gain circle/triangle markers. */
  setColorblind(on: boolean): void;
  /** Debug: outline hidden rocks and dark ships in red (drawing only). */
  setRevealAll(on: boolean): void;
  setReducedMotion(on: boolean): void;
  setHighContrastReefs(on: boolean): void;
  /** Keeps the edge arrows clear of the HUD's top and bottom bars (CSS px). */
  setHudInsets(top: number, bottom: number): void;
  destroy(): void;
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
  const sizes = vesselSizes(types);
  const ships = createShipView(art, sizes, layers, feel);
  const harbors = createHarborView(layers, art.textures);
  const marks = createVesselMarks(layers.lightFx);
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
  const reveal = createRevealOverlay(layers.effects, sizes);
  // Phase 04 environment: fog bands, whirlpools, storm waves, the second lighthouse, sky effects.
  const hazards = createHazardView(layers, art.textures, HAZARDS.whirlpool, feel);
  const secondLamp = createSecondLampView(art, layers, feel);
  const sky = createSkyFx(
    layers,
    art.textures,
    art.island.lampPoint,
    ABILITIES.foghorn.radius,
    feel,
  );
  let previousLamp2 = 0;

  const previous = new Map<number, Pose>();
  let previousBeam = 0;
  let vp: Viewport | null = null;
  let time = 0;
  /** The sea's own clock: slower with reduced motion, so fog, waves and swell move calmly. */
  let seaTime = 0;
  let seaPace = 1;
  let parade = false;
  let revealAll = false;
  let night: World | null = null;
  const parading = paradePoses(sizes);

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
      previousLamp2 = world.state.lamp2?.angle ?? 0;
      hazards.clear();
      sky.clear();
      if (world.state.waves) hazards.showWaveCue();
      reefs.setNight(world);
      harbors.setNight(world);
      ships.clear();
      effects.clear();
      drawCurrent();
    },
    capture(world) {
      previousBeam = world.state.beam.angle;
      previousLamp2 = world.state.lamp2?.angle ?? 0;
      capturePoses(world, previous);
    },
    onEvent(event, world) {
      effects.onEvent(event, world, 'shipId' in event ? previous.get(event.shipId) : undefined);
      sky.onEvent(event);
      if (event.type === 'wavesShifted') hazards.showWaveCue();
    },
    draw(world, alpha, frameSeconds) {
      if (!vp) return;
      const dt = frameSeconds;
      time += dt;
      const seaDt = dt * seaPace;
      seaTime += seaDt;
      const { state, setup } = world;

      effects.update(dt);
      const shake = effects.shake();
      applyViewport(layers, vp, shake.x, shake.y);
      lightMap.setOffset(shake.x, shake.y);

      const angle = lerpAngle(previousBeam, state.beam.angle, alpha);
      const lamp2 = state.lamp2
        ? {
            x: state.lamp2.x,
            y: state.lamp2.y,
            angle: lerpAngle(previousLamp2, state.lamp2.angle, alpha),
          }
        : null;
      const lamp = art.island.lampPoint;
      // Fog stops the beam short: the glow in the air and the lit water end where the light does.
      const fogFactor = HAZARDS.fog.rangeFactor;
      const reach = beamReachThroughFog(0, 0, angle, setup.beam.range, state.fogBands, fogFactor);
      water.update(
        seaTime,
        {
          angle,
          halfAngle: setup.beam.halfAngle,
          range: reach,
          glowRadius: setup.beam.glowRadius,
        },
        { x: vp.centerX + lamp.x * vp.scale, y: vp.centerY + lamp.y * vp.scale },
        ISLAND.radius,
      );
      reefs.draw(world, dt, time);

      const poses = vesselPoses(world, previous, alpha);
      const pools = ships.draw(parade ? [...poses, ...parading] : poses, dt, seaTime);
      harbors.draw(time);
      marks.draw(world, poses, (id) => ships.lanternAt(id), time, 1 / vp.scale);
      island.draw(time);

      lightMap.draw({
        beamAngle: angle,
        beam: setup.beam,
        buoys: setup.buoys,
        lanterns: pools,
        mapLit: state.mapLight > 0 || parade,
        floodColor: sky.floodColor() ?? undefined,
        lamp2: lamp2 ? { ...lamp2, glowRadius: ABILITIES.secondLamp.glowRadius } : null,
        fog: state.fogBands,
        fogRangeFactor: fogFactor,
        time,
      });
      beamFx.draw(angle, { ...setup.beam, range: reach }, time);
      const reach2 = lamp2
        ? beamReachThroughFog(
            lamp2.x,
            lamp2.y,
            lamp2.angle,
            setup.beam.range,
            state.fogBands,
            fogFactor,
          )
        : setup.beam.range;
      beamFx.drawSecond(lamp2, { ...setup.beam, range: reach2 }, time);
      hazards.draw(world, seaDt, seaTime);
      secondLamp.draw(lamp2, ABILITIES.secondLamp.isletRadius, state.activeLamp, time);
      sky.update(dt, time);
      weather.update(seaDt, seaTime, angle, setup.beam);

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
      // Edge arrows point at ships only (not pirates or the coast guard).
      arrows.draw(
        vp,
        poses.filter((p) => p.type in types),
        due,
        time,
      );
      reveal.draw(world, poses, revealAll, 1 / vp.scale);
    },
    resize(next) {
      vp = next;
      water.resize(next);
      lightMap.resize(next);
      sky.resize(next);
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
      hazards.setFogColor(palette.fog);
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
    setColorblind(on) {
      marks.setColorblind(on);
      harbors.setColorblind(on);
    },
    setReducedMotion(on) {
      effects.setReducedMotion(on);
      sky.setReducedMotion(on);
      seaPace = on ? RENDER_FEEL.reducedMotionSea : 1;
    },
    setHighContrastReefs(on) {
      reefs.setHighContrast(on);
    },
    setHudInsets(top, bottom) {
      arrows.setHudInsets(top, bottom);
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
        harbors,
        marks,
        hazards,
        secondLamp,
        sky,
      ]) {
        view.destroy();
      }
      current.destroy();
    },
  };
}
