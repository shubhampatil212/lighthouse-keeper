/**
 * One vessel's sprites (hull, rig, lantern glow and core, and the "?" for a lost ship), built once and
 * reused from a pool by shipView.ts, and the wake drawn behind it.
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { RenderFeelConfig } from '../data/types';
import type { ArtProvider, Point, VesselKind } from './art/types';
import { PALETTE } from './palette';
import type { ShipPose } from './shipView';

export interface ShipSprite {
  type: VesselKind;
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
  lantern: Point;
  /** Last frame's heading, for the lean into turns. */
  heading: number;
  lean: number;
  /** 1 the moment the ship is first lit, fading to 0. */
  catch: number;
  /** Seconds the "?" has been showing. */
  lostAge: number;
  everLit: boolean;
}

/** 0 → 1 with a small overshoot past 1 before settling (the usual "back" ease). */
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const u = t - 1;
  return 1 + (c1 + 1) * u * u * u + c1 * u * u;
};

export function createShipSprite(
  art: ArtProvider,
  types: Record<VesselKind, { length: number; width: number }>,
  type: VesselKind,
  hulls: Container,
  lights: Container,
  textResolution: number,
): ShipSprite {
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
  // Pirate and coast guard lights are colored through and through; ship lanterns burn white-hot.
  core.tint = type === 'pirate' || type === 'coastGuard' ? lantern.color : PALETTE.lampHot;
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
  return {
    type,
    root,
    hull,
    rig,
    glow,
    core,
    marker,
    visible: 0,
    side: 1,
    seen: false,
    lantern: { x: 0, y: 0 },
    heading: 0,
    lean: 0,
    catch: 0,
    lostAge: 0,
    everLit: false,
  };
}

/** The wake in a few strokes, each fainter and thinner toward the stern. */
export function drawWake(
  wakes: Graphics,
  ship: ShipPose,
  v: number,
  bands: number,
  feel: RenderFeelConfig,
): void {
  const wake = ship.wake;
  const total = wake.length + 1;
  const pointAt = (i: number): Point => wake[i] ?? ship;
  for (let band = 0; band < bands; band++) {
    const from = Math.floor((band * (total - 1)) / bands);
    const to = Math.floor(((band + 1) * (total - 1)) / bands);
    if (to <= from) continue;
    const start = pointAt(from);
    wakes.moveTo(start.x, start.y);
    for (let i = from + 1; i <= to; i++) {
      const p = pointAt(i);
      wakes.lineTo(p.x, p.y);
    }
    const k = (band + 1) / bands;
    wakes.stroke({
      color: PALETTE.seaCrest,
      width: feel.wakeWidth * (0.4 + 0.6 * k),
      alpha: k * feel.wakeAlpha * v,
      cap: 'round',
      join: 'round',
    });
  }
}
