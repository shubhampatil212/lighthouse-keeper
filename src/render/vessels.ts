/**
 * Everything drawn as a vessel this frame: the ships at sea, pirate ships, and coast guard boats with
 * the smugglers they tow. Gives each a pose blended between the last two ticks, so the views can draw
 * them all the same way.
 */
import { HAZARDS, SMUGGLER, VESSEL_FEEL } from '../data';
import type { ShipTypeConfig, ShipTypeId } from '../data/types';
import type { World } from '../sim/world';
import type { VesselKind } from './art/types';
import type { WakePoint } from '../sim/ships';
import type { Pose } from './interpolate';
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

const NO_WAKE: readonly WakePoint[] = [];

/** Blends `from` → `to` by t (the short way round) into `out`. */
function blendInto(out: ShipPose, from: Pose | undefined, to: Pose, t: number): void {
  if (!from) {
    out.x = to.x;
    out.y = to.y;
    out.heading = to.heading;
    return;
  }
  const turn = Math.atan2(Math.sin(to.heading - from.heading), Math.cos(to.heading - from.heading));
  out.x = from.x + (to.x - from.x) * t;
  out.y = from.y + (to.y - from.y) * t;
  out.heading = from.heading + turn * t;
}

/**
 * Poses for every vessel, blended by `alpha`, written into `out` (its objects are reused from frame to
 * frame, so nothing new is made while the fleet stays the same size). A caught smuggler keeps its ship
 * id, so its sprite carries on smoothly into the tow.
 */
export function vesselPoses(
  world: World,
  previous: Map<number, Pose>,
  alpha: number,
  out: ShipPose[],
): ShipPose[] {
  const { ships, pirates, tows } = world.state;
  const boardDelay = HAZARDS.pirate.boardDelay;
  let n = 0;
  const next = (id: number, type: VesselKind, from: Pose, lit: boolean): ShipPose => {
    let pose = out[n];
    if (!pose) {
      pose = { id, type, x: 0, y: 0, heading: 0, lit, lost: false, wake: NO_WAKE };
      out.push(pose);
    }
    n++;
    pose.id = id;
    pose.type = type;
    pose.lit = lit;
    pose.lost = false;
    pose.wake = NO_WAKE;
    pose.alarm = 0;
    pose.dim = 1;
    blendInto(pose, previous.get(id), from, alpha);
    return pose;
  };
  for (const ship of ships) {
    const pose = next(ship.id, ship.type, ship, ship.lit);
    pose.lost = ship.lost;
    pose.wake = ship.wake;
  }
  for (const p of pirates) {
    const pose = next(p.id, 'pirate', p, p.lit);
    pose.wake = p.wake;
    pose.alarm = p.mode === 'hunt' ? Math.min(1, p.huntTime / boardDelay) : 0;
  }
  for (const t of tows) {
    next(t.id, 'coastGuard', t, t.lit).wake = t.wake;
    next(t.smuggler.id, 'smuggler', t.smuggler, t.lit).dim = VESSEL_FEEL.towedDim;
  }
  out.length = n;
  return out;
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
