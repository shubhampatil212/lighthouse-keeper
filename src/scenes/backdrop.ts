/**
 * The live sea behind the menus (docs/SCREENS.md): the island with the buildings earned so far and
 * a slowly sweeping beam, on an empty endless night. Menu scenes show it; the play scene hides it
 * (both draw into the same layers, so only one may be up at a time).
 */
import type { Renderer as PixiRenderer } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import { BACKDROP_LEVEL, NO_UPGRADES, REGIONS, SHIP_TYPES, UI_FEEL } from '../data';
import type { IslandBuildingId, QualityProfile, RegionId } from '../data/types';
import type { ArtProvider } from '../render/art/types';
import type { Layers } from '../render/layers';
import { createNightRenderer, type NightRenderer } from '../render/Renderer';
import { NO_INTENTS } from '../sim/intents';
import { createWorld, type World } from '../sim/world';

export interface BackdropOptions {
  pixi: PixiRenderer;
  layers: Layers;
  art: ArtProvider;
  quality: QualityProfile;
}

export interface Backdrop {
  show(): void;
  hide(): void;
  readonly visible: boolean;
  setRegion(region: RegionId): void;
  setBuildings(ids: readonly IslandBuildingId[]): void;
  setQuality(profile: QualityProfile): void;
  setReducedMotion(on: boolean): void;
  update(dt: number): void;
  render(frameSeconds: number): void;
  resize(vp: Viewport): void;
}

export function createBackdrop(options: BackdropOptions): Backdrop {
  let view: NightRenderer | null = null;
  let world: World | null = null;
  let aim = -Math.PI / 2;
  let region: RegionId = 'harborBay';
  let buildings: readonly IslandBuildingId[] = [];
  let quality = options.quality;
  let reducedMotion = false;
  let viewport: Viewport | null = null;

  const look = (): void => {
    if (!view) return;
    view.setRegion(region);
    view.setWeather(REGIONS[region].weather);
    view.setBuildings(buildings);
  };

  return {
    show() {
      if (view) return;
      world = createWorld(BACKDROP_LEVEL, 'keeper', NO_UPGRADES, 1, { endless: true });
      view = createNightRenderer(options.pixi, options.layers, options.art, SHIP_TYPES);
      view.setQuality(quality);
      view.setReducedMotion(reducedMotion);
      if (viewport) view.resize(viewport);
      look();
      view.setNight(world);
    },
    hide() {
      view?.destroy();
      view = null;
      world = null;
    },
    get visible() {
      return view !== null;
    },
    setRegion(id) {
      region = id;
      look();
    },
    setBuildings(ids) {
      buildings = ids;
      look();
    },
    setQuality(profile) {
      quality = profile;
      view?.setQuality(profile);
    },
    setReducedMotion(on) {
      reducedMotion = on;
      view?.setReducedMotion(on);
    },
    update(dt) {
      if (!world || !view) return;
      aim += UI_FEEL.menuSweepSpeed * dt;
      view.capture(world);
      world.step(dt, { ...NO_INTENTS, aimAngle: aim });
      world.drainEvents();
    },
    render(frameSeconds) {
      if (world) view?.draw(world, 1, frameSeconds);
    },
    resize(vp) {
      viewport = vp;
      view?.resize(vp);
    },
  };
}
