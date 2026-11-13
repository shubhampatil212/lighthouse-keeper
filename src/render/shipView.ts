/**
 * Layer 4, the ships, and their lanterns above the darkness. A hull lies on the water; the mast, sails
 * and funnels stand upright (the 2.5D trick), skewed so they line up with the hull's direction. Ships
 * bob and roll gently. A ship in the dark shows only its lantern: the hull, rig and wake are drawn only
 * while the simulation says it's lit (with a short fade). After 4 s in the dark a "?" marker pulses.
 * Ships lean into turns, and a lantern flares the first time its ship is lit. Sprites are reused
 * (one pool per vessel kind), so a busy night doesn't build and throw away ships.
 */
import { Container, Graphics } from 'pixi.js';
import { wrapAngle } from '../sim/angle';
import type { RenderFeelConfig } from '../data/types';
import type { WakePoint } from '../sim/ships';
import type { ArtProvider, Point, VesselKind } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { approach } from './interpolate';
import { VESSEL_FEEL } from '../data/vesselFeel';
import { createShipSprite, drawWake, easeOutBack, type ShipSprite } from './shipSprite';

/** What the view needs to know about one ship this frame (already blended between ticks). */
export interface ShipPose {
  id: number;
  type: VesselKind;
  x: number;
  y: number;
  heading: number;
  lit: boolean;
  lost: boolean;
  wake: readonly WakePoint[];
  /** 0–1: how close a hunting pirate is to boarding (its lantern throbs faster). */
  alarm?: number;
  /** Brightness multiplier (a smuggler under tow is dimmed). */
  dim?: number;
}

export interface ShipView {
  /** Draws the ships and returns where their lanterns light the water (for the light map). */
  draw(ships: readonly ShipPose[], dt: number, time: number): Point[];
  /** Where a vessel's lantern hangs this frame (after draw), for markers drawn beside it. */
  lanternAt(id: number): Point | undefined;
  /** Text needs to know the pixel density to stay sharp. */
  setTextResolution(resolution: number): void;
  /** CSS px per world unit: small screens draw ships a little larger (VESSEL_FEEL.smallScreen). */
  setViewScale(scale: number): void;
  clear(): void;
  destroy(): void;
}

/** A rig is never drawn narrower than this, so sails don't vanish when a ship sails up or down the screen. */
const MIN_RIG_WIDTH = 0.35;
const RIG_TURN_RATE = 4;
const MARKER_GAP = 9;

export function createShipView(
  art: ArtProvider,
  types: Record<VesselKind, { length: number; width: number }>,
  layers: { ships: Container; lightFx: Container },
  feel: RenderFeelConfig,
): ShipView {
  const wakes = new Graphics({ label: 'wakes' });
  const hulls = new Container({ label: 'shipBodies', sortableChildren: true });
  layers.ships.addChild(wakes, hulls);
  const lights = new Container({ label: 'lanterns' });
  layers.lightFx.addChild(lights);

  const sprites = new Map<number, ShipSprite>();
  const spare = new Map<VesselKind, ShipSprite[]>();
  /** Lantern pools on the water, reused every frame (the light map reads the first `length`). */
  const pools: Point[] = [];
  let textResolution = 2;
  let drawScale = 1;
  const { smallScreen } = VESSEL_FEEL;
  const bands = Math.max(1, Math.round(VESSEL_FEEL.wakeBands));

  const reset = (sprite: ShipSprite, heading: number): ShipSprite => {
    sprite.visible = 0;
    sprite.side = Math.cos(heading) >= 0 ? 1 : -1;
    sprite.heading = heading;
    sprite.lean = 0;
    sprite.catch = 0;
    sprite.lostAge = 0;
    sprite.everLit = false;
    sprite.root.visible = false;
    sprite.root.scale.set(drawScale);
    return sprite;
  };

  const take = (type: VesselKind, heading: number): ShipSprite => {
    const reused = spare.get(type)?.pop();
    return reset(
      reused ?? createShipSprite(art, types, type, hulls, lights, textResolution),
      heading,
    );
  };

  /** Hides a ship that has left and keeps it for the next one of its kind. */
  const remove = (id: number, sprite: ShipSprite): void => {
    sprite.root.visible = false;
    sprite.glow.visible = false;
    sprite.core.visible = false;
    sprite.marker.visible = false;
    sprites.delete(id);
    const list = spare.get(sprite.type);
    if (list) list.push(sprite);
    else spare.set(sprite.type, [sprite]);
  };

  return {
    draw(ships, dt, time) {
      for (const s of sprites.values()) s.seen = false;
      let poolCount = 0;
      wakes.clear();
      const fadeRate = 1 / Math.max(0.01, feel.revealFade);

      for (const ship of ships) {
        let sprite = sprites.get(ship.id);
        if (!sprite) {
          sprite = take(ship.type, ship.heading);
          sprites.set(ship.id, sprite);
        }
        sprite.seen = true;
        const length = types[ship.type].length * drawScale;
        const lantern = art.ships.lantern(ship.type);
        sprite.visible = approach(sprite.visible, ship.lit ? 1 : 0, fadeRate, dt);
        const v = sprite.visible;
        if (ship.lit && !sprite.everLit) {
          sprite.everLit = true;
          sprite.catch = 1;
        }
        sprite.catch = Math.max(0, sprite.catch - dt / VESSEL_FEEL.catchLightSeconds);
        const flare = 1 + sprite.catch * sprite.catch * VESSEL_FEEL.catchLight;

        // Lean into turns: roll toward the outside of the turn, eased so it settles after.
        const turnRate = dt > 0 ? wrapAngle(ship.heading - sprite.heading) / dt : 0;
        sprite.heading = ship.heading;
        const leanMax = VESSEL_FEEL.turnLeanMax;
        const leanTarget = Math.max(-leanMax, Math.min(leanMax, turnRate * VESSEL_FEEL.turnLean));
        sprite.lean = approach(sprite.lean, leanTarget, RIG_TURN_RATE * leanMax, dt);

        // Bob and roll (each ship on its own phase).
        const bob = Math.sin(time * feel.bobSpeed + ship.id * 1.3) * feel.bobHeight;
        const roll =
          Math.sin(time * feel.rollSpeed + ship.id * 2.1) * feel.rollAngle +
          sprite.lean * sprite.side;
        sprite.root.position.set(ship.x, ship.y + bob);
        sprite.glow.visible = true;
        sprite.core.visible = true;
        sprite.root.zIndex = ship.y;
        const dim = ship.dim ?? 1;
        sprite.root.visible = v > 0.01;
        sprite.root.alpha = v * dim;
        sprite.hull.rotation = ship.heading;

        // The rig's x axis follows the hull on screen: across by cos(heading), up and down by sin(heading).
        const cos = Math.cos(ship.heading);
        const targetSide = cos >= 0 ? Math.max(cos, MIN_RIG_WIDTH) : Math.min(cos, -MIN_RIG_WIDTH);
        sprite.side = approach(sprite.side, targetSide, RIG_TURN_RATE, dt);
        const alongX = sprite.side;
        const alongY = Math.sin(ship.heading) * 0.5;
        sprite.rig.scale.x = Math.hypot(alongX, alongY);
        sprite.rig.skew.y = Math.atan2(alongY, alongX);
        sprite.rig.rotation = roll;

        // The lantern hangs at the masthead; it's the only thing a dark ship shows.
        const mast = lantern.along * length;
        const height = lantern.height * drawScale;
        const lx = ship.x + alongX * mast + Math.sin(roll) * height;
        const ly = ship.y + bob + alongY * mast - height;
        // Pirate lanterns throb (faster as they close in), the coast guard's light flashes.
        const alarm = ship.alarm ?? 0;
        const pulseRate = lantern.pulse + alarm * VESSEL_FEEL.huntPulse;
        const throb = pulseRate > 0 ? 0.75 + 0.25 * Math.sin(time * Math.PI * 2 * pulseRate) : 1;
        const flash =
          lantern.blink > 0 && Math.sin(time * Math.PI * 2 * lantern.blink) < 0 ? 0.2 : 1;
        const shine = throb * flash * dim;
        const glowRadius =
          (ship.lit ? feel.lanternGlowLit : feel.lanternGlowDark) *
          lantern.glowScale *
          (1 + alarm * 0.35 * throb);
        sprite.glow.position.set(lx, ly);
        sprite.glow.scale.set((glowRadius * flare) / GLOW_TEXTURE_RADIUS);
        sprite.glow.alpha = Math.min(
          1,
          (ship.lit ? 0.95 : 0.7) * lantern.brightness * shine * flare,
        );
        sprite.core.position.set(lx, ly);
        sprite.core.scale.set((ship.lit ? 0.42 : 0.32) * lantern.glowScale * Math.sqrt(flare));
        sprite.core.alpha = Math.min(1, 0.9 * lantern.brightness * shine);
        sprite.lantern.x = lx;
        sprite.lantern.y = ly;
        let pool = pools[poolCount];
        if (!pool) {
          pool = { x: 0, y: 0 };
          pools.push(pool);
        }
        pool.x = ship.x + alongX * mast;
        pool.y = ship.y;
        poolCount++;

        sprite.marker.visible = ship.lost && !ship.lit;
        sprite.lostAge = sprite.marker.visible ? sprite.lostAge + dt : 0;
        if (sprite.marker.visible) {
          sprite.marker.position.set(lx, ly - MARKER_GAP);
          sprite.marker.alpha = 0.55 + Math.sin(time * feel.lostPulseSpeed) * 0.3;
          // Pops in: grows past full size, then settles.
          const t = Math.min(1, sprite.lostAge / VESSEL_FEEL.lostMarkerPop);
          sprite.marker.scale.set(Math.max(0.01, easeOutBack(t)));
        }

        // The wake, brighter near the ship.
        if (v > 0.01 && ship.wake.length > 0) drawWake(wakes, ship, v, bands, feel);
      }
      for (const [id, sprite] of sprites) if (!sprite.seen) remove(id, sprite);
      pools.length = poolCount;
      return pools;
    },
    lanternAt(id) {
      return sprites.get(id)?.lantern;
    },
    setTextResolution(resolution) {
      textResolution = resolution;
      for (const s of sprites.values()) s.marker.resolution = resolution;
      for (const list of spare.values()) for (const s of list) s.marker.resolution = resolution;
    },
    setViewScale(scale) {
      drawScale = Math.min(smallScreen.scale, Math.max(1, smallScreen.belowScale / scale));
      for (const s of sprites.values()) s.root.scale.set(drawScale);
    },
    clear() {
      for (const [id, sprite] of sprites) remove(id, sprite);
      wakes.clear();
    },
    destroy() {
      sprites.clear();
      spare.clear();
      wakes.destroy();
      hulls.destroy({ children: true });
      lights.destroy({ children: true });
    },
  };
}
