/**
 * The ArtProvider is the single place drawing gets its shapes and textures from. Today every piece is
 * drawn in code (codeArt.ts); an artist can later return Sprites instead without touching the views.
 * All sizes are world units. "Upright" parts stand up from the water (screen up = -y): the 2.5D trick.
 */
import type { Container, Texture } from 'pixi.js';
import type { IslandBuildingId, ShipTypeId } from '../../data/types';

export interface Point {
  x: number;
  y: number;
}

/** Generated textures, all white so they can be tinted. */
export interface ArtTextures {
  /** Soft round glow: full at the centre, fading to nothing at the edge. 1 texture unit = radius 1 when scaled by radius / 64. */
  glow: Texture;
  /** A pool of light: flat in the middle, soft edge from 60% to 100% of the radius (same radius as glow). */
  pool: Texture;
  /** Tileable soft noise for fog banks. */
  fog: Texture;
  /** Tileable fine noise (0.75–1 grey) for the "breathing" beam edge. */
  breath: Texture;
  /** Particles. */
  dot: Texture;
  splinter: Texture;
  drop: Texture;
  flake: Texture;
  /** A small wave crest for the Low-quality water. */
  wave: Texture;
}

/** The size of the glow texture's radius in texture pixels (scale a glow sprite by radius / this). */
export const GLOW_TEXTURE_RADIUS = 64;

/** Everything drawn as a vessel: the six ship types, plus pirate ships and coast guard boats. */
export type VesselKind = ShipTypeId | 'pirate' | 'coastGuard';

export interface ShipLanternArt {
  /** Height of the lantern above the water (world units). */
  height: number;
  /** Where its mast stands along the hull, as a fraction of the length (+ = toward the bow). */
  along: number;
  color: number;
  /** Glow size multiplier (the ferry's gold lantern is bigger). */
  glowScale: number;
  /** Brightness multiplier (the smuggler's lantern is dim). */
  brightness: number;
  /** Pulses this many times a second (the pirate's lantern throbs); 0 = steady. */
  pulse: number;
  /** Flashes on and off this many times a second (the coast guard's blue light); 0 = steady. */
  blink: number;
}

export interface ShipArt {
  /** Lies flat on the water; the bow points along +x. The view rotates it by the heading. */
  createHull(type: VesselKind, length: number, width: number): Container;
  /** Stands upright from the hull's centre; drawn facing right (the view mirrors it for ships heading left). */
  createRig(type: VesselKind, length: number, width: number): Container;
  lantern(type: VesselKind): ShipLanternArt;
}

/** A rock's outline around its centre, plus a peak point used for the low-poly faces. */
export interface RockShape {
  points: readonly Point[];
  peak: Point;
}

export interface ReefArt {
  /** A deterministic outline for a rock of radius r (the same seed always gives the same rock). */
  rockShape(seed: number, r: number): RockShape;
  /** Top and side faces, lit from `lightFrom` (a direction, usually toward the island). */
  createRock(shape: RockShape, lightFrom: Point): Container;
  /** A bell buoy standing upright at the origin; returns its light's height above the water. */
  createBuoy(): { body: Container; lightHeight: number };
  /** An iceberg: pale low-poly ice with a blue side and an ice-blue edge, lit from `lightFrom`. */
  createIceberg(shape: RockShape, lightFrom: Point): Container;
}

export interface IslandArt {
  /** Cliffs, grass and the jetty, flat on the water around (0, 0). */
  createGround(radius: number): Container;
  /** The striped tower with gallery and lamp room (upright). */
  createTower(): Container;
  /** The lamp glass on its own, so the view can make it flicker. */
  createLampGlass(): Container;
  /** Where the lamp glass sits, in world units (the beam shaft starts here). */
  lampPoint: Point;
  /** The tower's base and top, for the soft light the lamp spills down the tower. */
  towerBase: Point;
  towerHeight: number;
  createBuilding(id: IslandBuildingId): Container;
  /** The small rocky islet a second lighthouse stands on (flat on the water, around (0, 0)). */
  createIslet(radius: number): Container;
  /** The second lighthouse is the main tower drawn at this scale, standing on its islet. */
  secondTowerScale: number;
  /** Small light points on a building (windows, festival bulbs) that glow above the darkness. */
  buildingLights(id: IslandBuildingId): readonly (Point & { color: number })[];
}

export interface ArtProvider {
  readonly textures: ArtTextures;
  readonly ships: ShipArt;
  readonly reefs: ReefArt;
  readonly island: IslandArt;
  /** Builds the beam cone's texture for a given half-angle (it changes with lens upgrades). */
  beamCone(halfAngle: number, haloWidth: number, halo: number): BeamConeTexture;
  destroy(): void;
}

export interface BeamConeTexture {
  texture: Texture;
  /** Scale the sprite by (range × this) / texture width so the cone reaches the beam's range. */
  reach: number;
  /** Sprite anchor so the cone's tip sits on the lamp's foot. */
  anchorX: number;
  anchorY: number;
  /** World-unit height of the texture when its width spans `reach` × range. */
  heightPerRange: number;
}
