/**
 * Draws a night. Builds every view on the layers from docs/ART_AUDIO.md, reads the world each frame
 * (blending ship poses and the beam between the last two ticks), and never changes the simulation.
 * Scenes call capture() before each tick, onEvent() for each event, and draw() once per frame.
 */
import type { Renderer as PixiRenderer } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import { ABILITIES, HAZARDS, ISLAND, REGIONS, RENDER_FEEL } from '../data';
import type {
  IslandBuildingId,
  QualityProfile,
  RegionId,
  ShipTypeConfig,
  ShipTypeId,
  WeatherDef,
} from '../data/types';
import type { SimEvent } from '../sim/events';
import type { World } from '../sim/world';
import { createArrowView } from './arrowView';
import type { ArtProvider } from './art/types';
import { createBeamFx } from './beamFx';
import { createCurrentView } from './currentView';
import { createRevealOverlay } from './debug/revealOverlay';
import { createEffects } from './effects';
import { createHarborView } from './harborView';
import type { Pose } from './interpolate';
import { createIslandView } from './islandView';
import { applyViewport, type Layers } from './layers';
import { createLightMap, type LightMapFrame } from './lightMap';
import type { ParticleBudget } from './particles';
import { createReefView } from './reefView';
import { createShipView, type ShipPose } from './shipView';
import { createVesselMarks } from './vesselMarks';
import { capturePoses, paradePoses, vesselPoses, vesselSizes } from './vessels';
import { createNightLights } from './nightLights';
import { createWater } from './water';
import { createWeather } from './weather';
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
  const current = createCurrentView(layers.effects);
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

  // Objects reused every frame, so drawing a night makes (almost) no garbage.
  const poses: ShipPose[] = [];
  const lights = createNightLights();
  const lightFrame: LightMapFrame = {
    beamAngle: 0,
    beam: { halfAngle: 0, range: 0, turnSpeed: 0, glowRadius: 0 },
    buoys: [],
    lanterns: [],
    mapLit: false,
    lamp2: null,
    fog: [],
    fogRangeFactor: HAZARDS.fog.rangeFactor,
    time: 0,
  };
  const lanternAt = (id: number): ReturnType<typeof ships.lanternAt> => ships.lanternAt(id);

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
      current.draw(world, vp?.scale ?? 1);
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

      const lit = lights.update(
        world,
        previousBeam,
        previousLamp2,
        alpha,
        vp,
        art.island.lampPoint,
      );
      const { angle, lamp2, reachBeam, reachBeam2 } = lit;
      water.update(seaTime, lit.water, lit.lampOnScreen, ISLAND.radius, lit.water2);
      reefs.draw(world, dt, time);

      vesselPoses(world, previous, alpha, poses);
      const pools = ships.draw(parade ? [...poses, ...parading] : poses, dt, seaTime);
      harbors.draw(time);
      marks.draw(world, poses, lanternAt, time, 1 / vp.scale);
      island.draw(time);

      lightFrame.beamAngle = angle;
      lightFrame.beam = setup.beam;
      lightFrame.buoys = setup.buoys;
      lightFrame.lanterns = pools;
      lightFrame.mapLit = state.mapLight > 0 || parade;
      lightFrame.floodColor = sky.floodColor() ?? undefined;
      lightFrame.lamp2 = lamp2;
      lightFrame.fog = state.fogBands;
      lightFrame.time = time;
      lightMap.draw(lightFrame);
      beamFx.draw(angle, reachBeam, time);
      beamFx.drawSecond(lamp2, reachBeam2, time);
      hazards.draw(world, seaDt, seaTime);
      secondLamp.draw(lamp2, ABILITIES.secondLamp.isletRadius, state.activeLamp, time);
      sky.update(dt, time);
      weather.update(seaDt, seaTime, angle, setup.beam);

      // Edge arrows point at ships only (not pirates or the coast guard).
      arrows.draw(vp, world, poses, types, time);
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
      ships.setViewScale(next.scale);
      effects.setTextResolution(textResolution);
      current.draw(night, next.scale);
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
