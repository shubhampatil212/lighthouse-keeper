/**
 * Layer 4, the ships, and their lanterns above the darkness. A hull lies on the water; the mast, sails
 * and funnels stand upright (the 2.5D trick), skewed so they line up with the hull's direction. Ships
 * bob and roll gently. A ship in the dark shows only its lantern: the hull, rig and wake are drawn only
 * while the simulation says it's lit (with a short fade). After 4 s in the dark a "?" marker pulses.
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { RenderFeelConfig, ShipTypeConfig, ShipTypeId } from '../data/types';
import type { WakePoint } from '../sim/ships';
import type { ArtProvider, Point } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { approach } from './interpolate';
import { PALETTE } from './palette';

/** What the view needs to know about one ship this frame (already blended between ticks). */
export interface ShipPose {
  id: number;
  type: ShipTypeId;
  x: number;
  y: number;
  heading: number;
  lit: boolean;
  lost: boolean;
  wake: readonly WakePoint[];
}

export interface ShipView {
  /** Draws the ships and returns where their lanterns light the water (for the light map). */
  draw(ships: readonly ShipPose[], dt: number, time: number): Point[];
  /** Text needs to know the pixel density to stay sharp. */
  setTextResolution(resolution: number): void;
  clear(): void;
  destroy(): void;
}

interface ShipSprite {
  root: Container;
  hull: Container;
  rig: Container;
  glow: Sprite;
  core: Sprite;
  marker: Text;
  visible: number;
  /** The rig's sideways direction on screen, eased so it doesn't flip in one frame. */
  side: number;
  seen: boolean;
}

/** A rig is never drawn narrower than this, so sails don't vanish when a ship sails up or down the screen. */
const MIN_RIG_WIDTH = 0.35;
const RIG_TURN_RATE = 4;
const MARKER_GAP = 9;

export function createShipView(
  art: ArtProvider,
  types: Record<ShipTypeId, ShipTypeConfig>,
  layers: { ships: Container; lightFx: Container },
  feel: RenderFeelConfig,
): ShipView {
  const wakes = new Graphics({ label: 'wakes' });
  const hulls = new Container({ label: 'shipBodies', sortableChildren: true });
  layers.ships.addChild(wakes, hulls);
  const lights = new Container({ label: 'lanterns' });
  layers.lightFx.addChild(lights);

  const sprites = new Map<number, ShipSprite>();
  let textResolution = 2;

  const make = (type: ShipTypeId): ShipSprite => {
    const { length, width } = types[type];
    const root = new Container();
    const hull = art.ships.createHull(type, length, width);
    const rig = art.ships.createRig(type, length, width);
    root.addChild(hull, rig);
    hulls.addChild(root);
    const lantern = art.ships.lantern(type);
    const glow = new Sprite({ texture: art.textures.glow, anchor: 0.5, blendMode: 'add' });
    glow.tint = lantern.color;
    const core = new Sprite({ texture: art.textures.dot, anchor: 0.5, blendMode: 'add' });
    core.tint = PALETTE.lampHot;
    const marker = new Text({
      text: '?',
      anchor: 0.5,
      resolution: textResolution,
      style: {
        fontFamily: 'Karla, sans-serif',
        fontWeight: '700',
        fontSize: 13,
        fill: PALETTE.parchment,
      },
    });
    lights.addChild(glow, core, marker);
    return { root, hull, rig, glow, core, marker, visible: 0, side: 1, seen: false };
  };

  const remove = (id: number, sprite: ShipSprite): void => {
    sprite.root.destroy({ children: true });
    sprite.glow.destroy();
    sprite.core.destroy();
    sprite.marker.destroy();
    sprites.delete(id);
  };

  return {
    draw(ships, dt, time) {
      for (const s of sprites.values()) s.seen = false;
      const pools: Point[] = [];
      wakes.clear();
      const fadeRate = 1 / Math.max(0.01, feel.revealFade);

      for (const ship of ships) {
        let sprite = sprites.get(ship.id);
        if (!sprite) {
          sprite = make(ship.type);
          sprite.side = Math.cos(ship.heading) >= 0 ? 1 : -1;
          sprites.set(ship.id, sprite);
        }
        sprite.seen = true;
        const { length } = types[ship.type];
        const lantern = art.ships.lantern(ship.type);
        sprite.visible = approach(sprite.visible, ship.lit ? 1 : 0, fadeRate, dt);
        const v = sprite.visible;

        // Bob and roll (each ship on its own phase).
        const bob = Math.sin(time * feel.bobSpeed + ship.id * 1.3) * feel.bobHeight;
        const roll = Math.sin(time * feel.rollSpeed + ship.id * 2.1) * feel.rollAngle;
        sprite.root.position.set(ship.x, ship.y + bob);
        sprite.root.zIndex = ship.y;
        sprite.root.visible = v > 0.01;
        sprite.root.alpha = v;
        sprite.hull.rotation = ship.heading;

        // The rig's x axis follows the hull on screen: across by cos(heading), up and down by sin(heading).
        const cos = Math.cos(ship.heading);
        const targetSide = cos >= 0 ? Math.max(cos, MIN_RIG_WIDTH) : Math.min(cos, -MIN_RIG_WIDTH);
        sprite.side = approach(sprite.side, targetSide, RIG_TURN_RATE, dt);
        const along = { x: sprite.side, y: Math.sin(ship.heading) * 0.5 };
        sprite.rig.scale.x = Math.hypot(along.x, along.y);
        sprite.rig.skew.y = Math.atan2(along.y, along.x);
        sprite.rig.rotation = roll;

        // The lantern hangs at the masthead; it's the only thing a dark ship shows.
        const mast = lantern.along * length;
        const lx = ship.x + along.x * mast + Math.sin(roll) * lantern.height;
        const ly = ship.y + bob + along.y * mast - lantern.height;
        const glowRadius =
          (ship.lit ? feel.lanternGlowLit : feel.lanternGlowDark) * lantern.glowScale;
        sprite.glow.position.set(lx, ly);
        sprite.glow.scale.set(glowRadius / GLOW_TEXTURE_RADIUS);
        sprite.glow.alpha = Math.min(1, (ship.lit ? 0.95 : 0.7) * lantern.brightness);
        sprite.core.position.set(lx, ly);
        sprite.core.scale.set((ship.lit ? 0.42 : 0.32) * lantern.glowScale);
        sprite.core.alpha = Math.min(1, 0.9 * lantern.brightness);
        pools.push({ x: ship.x + along.x * mast, y: ship.y });

        sprite.marker.visible = ship.lost && !ship.lit;
        if (sprite.marker.visible) {
          sprite.marker.position.set(lx, ly - MARKER_GAP);
          sprite.marker.alpha = 0.55 + Math.sin(time * feel.lostPulseSpeed) * 0.3;
        }

        // The wake, brighter near the ship.
        if (v > 0.01 && ship.wake.length > 0) {
          const points = [...ship.wake, { x: ship.x, y: ship.y }];
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            if (!a || !b) continue;
            wakes
              .moveTo(a.x, a.y)
              .lineTo(b.x, b.y)
              .stroke({
                color: PALETTE.seaCrest,
                width: feel.wakeWidth * (0.4 + (0.6 * i) / points.length),
                alpha: (i / points.length) * feel.wakeAlpha * v,
                cap: 'round',
              });
          }
        }
      }
      for (const [id, sprite] of sprites) if (!sprite.seen) remove(id, sprite);
      return pools;
    },
    setTextResolution(resolution) {
      textResolution = resolution;
      for (const s of sprites.values()) s.marker.resolution = resolution;
    },
    clear() {
      for (const [id, sprite] of sprites) remove(id, sprite);
      wakes.clear();
    },
    destroy() {
      this.clear();
      wakes.destroy();
      hulls.destroy({ children: true });
      lights.destroy({ children: true });
    },
  };
}
