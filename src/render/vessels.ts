/**
 * Everything drawn as a vessel this frame: the ships at sea, pirate ships, and coast guard boats with
 * the smugglers they tow. Gives each a pose blended between the last two ticks, so the views can draw
 * them all the same way.
 */
import { HAZARDS, SMUGGLER, VESSEL_FEEL } from '../data';
import type { ShipTypeConfig, ShipTypeId } from '../data/types';
import type { World } from '../sim/world';
import type { VesselKind } from './art/types';
import { lerpPose, type Pose } from './interpolate';
import type { ShipPose } from './shipView';

export interface VesselSize {
  length: number;
  width: number;
}

export function vesselSizes(
  types: Record<ShipTypeId, ShipTypeConfig>,
): Record<VesselKind, VesselSize> {
  const sizes = {} as Record<VesselKind, VesselSize>;
  for (const [id, t] of Object.entries(types) as [ShipTypeId, ShipTypeConfig][]) {
    sizes[id] = { length: t.length, width: t.width };
  }
  sizes.pirate = { length: HAZARDS.pirate.length, width: HAZARDS.pirate.width };
  sizes.coastGuard = { length: SMUGGLER.coastGuardLength, width: SMUGGLER.coastGuardWidth };
  return sizes;
}

/** Remembers every vessel's pose before a tick (call from the renderer's capture()). */
export function capturePoses(world: World, into: Map<number, Pose>): void {
  into.clear();
  const { ships, pirates, tows } = world.state;
  for (const s of ships) into.set(s.id, { x: s.x, y: s.y, heading: s.heading });
  for (const p of pirates) into.set(p.id, { x: p.x, y: p.y, heading: p.heading });
  for (const t of tows) {
    into.set(t.id, { x: t.x, y: t.y, heading: t.heading });
    const s = t.smuggler;
    into.set(s.id, { x: s.x, y: s.y, heading: s.heading });
  }
}

/**
 * Poses for every vessel, blended by `alpha`. A caught smuggler keeps its ship id, so its sprite
 * carries on smoothly into the tow.
 */
export function vesselPoses(world: World, previous: Map<number, Pose>, alpha: number): ShipPose[] {
  const { ships, pirates, tows } = world.state;
  const boardDelay = HAZARDS.pirate.boardDelay;
  const poses: ShipPose[] = ships.map((ship) => ({
    id: ship.id,
    type: ship.type,
    ...lerpPose(previous.get(ship.id), ship, alpha),
    lit: ship.lit,
    lost: ship.lost,
    wake: ship.wake,
  }));
  for (const p of pirates) {
    poses.push({
      id: p.id,
      type: 'pirate',
      ...lerpPose(previous.get(p.id), p, alpha),
      lit: p.lit,
      lost: false,
      wake: p.wake,
      alarm: p.mode === 'hunt' ? Math.min(1, p.huntTime / boardDelay) : 0,
    });
  }
  for (const t of tows) {
    poses.push({
      id: t.id,
      type: 'coastGuard',
      ...lerpPose(previous.get(t.id), t, alpha),
      lit: t.lit,
      lost: false,
      wake: t.wake,
    });
    const s = t.smuggler;
    poses.push({
      id: s.id,
      type: 'smuggler',
      ...lerpPose(previous.get(s.id), s, alpha),
      lit: t.lit,
      lost: false,
      wake: [],
      dim: VESSEL_FEEL.towedDim,
    });
  }
  return poses;
}

const PARADE_ORDER: readonly VesselKind[] = [
  'fishing',
  'cargo',
  'sailboat',
  'ferry',
  'tugboat',
  'smuggler',
  'pirate',
  'coastGuard',
];
const PARADE_Y = 120;
const PARADE_GAP = 12;

/** Debug "Ship parade": every vessel side by side, lit, so they can be compared. */
export function paradePoses(sizes: Record<VesselKind, VesselSize>): ShipPose[] {
  const total =
    PARADE_ORDER.reduce((sum, t) => sum + sizes[t].length, 0) +
    PARADE_GAP * (PARADE_ORDER.length - 1);
  let x = -total / 2;
  return PARADE_ORDER.map((type, i) => {
    const length = sizes[type].length;
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
