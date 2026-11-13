/**
 * Ships: lit ships see nearby rocks and steer around them toward their harbor at full speed.
 * Dark ships drift: their heading wanders, they slow down and the current pushes them
 * (docs/GDD.md §3.2, docs/CONTENT.md §2; steering ported from the prototype's updShips).
 * Smugglers are the exception: they cross the sea toward an exit point, flee the light, and are
 * caught after 2 s of unbroken light.
 */
import type {
  HarborDef,
  SeaConfig,
  ShipBehaviorConfig,
  ShipTypeConfig,
  ShipTypeId,
  SmugglerConfig,
  TugConfig,
  WhirlpoolConfig,
} from '../data/types';
import type { LightOrigin } from './beam';
import type { Emit, WreckCause } from './events';
import { rockAt, type Rock } from './reefs';
import { createRng } from './rng';
import { atIsland, driftWithSea, keepOffIsland, shovedByIceberg } from './shipForces';
import { leanIntoPush, litHeading, turnToward, type Obstacle } from './steering';

export interface WakePoint {
  x: number;
  y: number;
}

export interface Ship {
  id: number;
  type: ShipTypeId;
  x: number;
  y: number;
  /** Direction of travel (radians). */
  heading: number;
  /** Full speed after the difficulty multiplier. */
  speed: number;
  /** Index into the world's harbors. */
  harbor: number;
  lit: boolean;
  /** Seconds since the ship was last lit. */
  darkTime: number;
  /** Seconds lit without a break (a smuggler is caught at SMUGGLER.catchSeconds). */
  litTime: number;
  /** Shown with a "?" marker after lostAfter seconds in the dark. */
  lost: boolean;
  /** In danger for the music's tension: dark for a while, or dark and close to a rock. */
  inDanger: boolean;
  /** Dark drift: current heading error, the value it eases toward, and time until a new one. */
  error: number;
  errorTarget: number;
  errorTimer: number;
  /** Each ship has its own random stream, so lighting one ship never changes how another drifts. */
  rngState: number;
  /** Smugglers only: the point past the spawn ring they're slipping away to. Null for every other ship. */
  exit: WakePoint | null;
  /** Seconds left of the foghorn's slow. */
  hornTimer: number;
  /** Id of the lit tugboat slowing this ship, or 0. */
  towedBy: number;
  /** Index of the whirlpool pulling it, or -1. */
  whirlpool: number;
  /** Index of the bell buoy whose circle it's in, or -1. */
  buoy: number;
  wake: WakePoint[];
  wakeTimer: number;
}

export interface ShipRules {
  behavior: ShipBehaviorConfig;
  types: Record<ShipTypeId, ShipTypeConfig>;
  sea: SeaConfig;
  harbors: readonly HarborDef[];
  /** Current drift in world units per second, after the difficulty multiplier. */
  currentX: number;
  currentY: number;
  islandRadius: number;
  smuggler: SmugglerConfig;
  tug: TugConfig;
  whirlpool: WhirlpoolConfig;
  /** See IcebergConfig.headOnCos. */
  icebergHeadOnCos: number;
  /** Speed multiplier while the foghorn's slow lasts. */
  foghornSpeedFactor: number;
}

/** What the sea does to every ship this tick: storm waves and whirlpools. */
export interface SeaForces {
  pushX: number;
  pushY: number;
  whirlpools: readonly WakePoint[];
}

export const CALM_SEA: SeaForces = { pushX: 0, pushY: 0, whirlpools: [] };

export type ShipFate =
  | { kind: 'sailing' }
  | { kind: 'saved' }
  | { kind: 'wrecked'; cause: WreckCause; reefIndex: number | null }
  | { kind: 'caught' }
  | { kind: 'escaped' };

const SAILING: ShipFate = { kind: 'sailing' };
const SAVED: ShipFate = { kind: 'saved' };
const CAUGHT: ShipFate = { kind: 'caught' };
const ESCAPED: ShipFate = { kind: 'escaped' };

const isSmuggler = (ship: Ship): boolean => ship.exit !== null;

export function spawnShip(
  id: number,
  type: ShipTypeId,
  angle: number,
  speedMultiplier: number,
  rngSeed: number,
  rules: ShipRules,
  harborIndex = 0,
): Ship {
  const rng = createRng(rngSeed);
  const { behavior, sea } = rules;
  const x = Math.cos(angle) * sea.spawnRadius;
  const y = Math.sin(angle) * sea.spawnRadius;
  const jitter = rng.range(-behavior.spawnHeadingJitter, behavior.spawnHeadingJitter);
  const error = rng.range(-behavior.spawnErrorRange, behavior.spawnErrorRange);
  let goal: WakePoint = rules.harbors[harborIndex] ?? { x: 0, y: 0 };
  let exit: WakePoint | null = null;
  if (type === 'smuggler') {
    // Across the sea, a little to one side so its path misses the island.
    const side = rng.float() < 0.5 ? -1 : 1;
    const exitAngle =
      angle +
      Math.PI +
      side * rng.range(rules.smuggler.exitOffsetMin, rules.smuggler.exitOffsetMax);
    const reach = sea.spawnRadius + rules.smuggler.escapeMargin * 4;
    exit = { x: Math.cos(exitAngle) * reach, y: Math.sin(exitAngle) * reach };
    goal = exit;
  }
  return {
    id,
    type,
    x,
    y,
    heading: Math.atan2(goal.y - y, goal.x - x) + jitter,
    speed: rules.types[type].speed * speedMultiplier,
    harbor: harborIndex,
    lit: false,
    darkTime: 0,
    litTime: 0,
    lost: false,
    inDanger: false,
    error,
    errorTarget: 0,
    errorTimer: behavior.spawnErrorDelay,
    rngState: rng.state,
    exit,
    hornTimer: 0,
    towedBy: 0,
    whirlpool: -1,
    buoy: -1,
    wake: [],
    wakeTimer: 0,
  };
}

/** Whirlpool cores, and the island for ships that aren't docking there. */
const NO_OBSTACLES: readonly Obstacle[] = [];

function extraObstacles(
  ship: Ship,
  harbor: HarborDef,
  rules: ShipRules,
  sea: SeaForces,
): readonly Obstacle[] {
  const aroundIsland = isSmuggler(ship) || !atIsland(harbor, rules);
  if (sea.whirlpools.length === 0 && !aroundIsland) return NO_OBSTACLES;
  const list: Obstacle[] = sea.whirlpools.map((w) => ({
    x: w.x,
    y: w.y,
    r: rules.whirlpool.coreRadius,
    pad: rules.whirlpool.avoidPadding,
  }));
  if (aroundIsland) {
    list.push({ x: 0, y: 0, r: rules.islandRadius, pad: rules.behavior.islandAvoidPadding });
  }
  return list;
}

/** Updates the dark ship's wandering heading error from its own random stream. */
function wander(ship: Ship, behavior: ShipBehaviorConfig, dt: number): void {
  ship.errorTimer -= dt;
  if (ship.errorTimer <= 0) {
    const rng = createRng(ship.rngState);
    ship.errorTimer = rng.range(behavior.darkErrorRerollMin, behavior.darkErrorRerollMax);
    ship.errorTarget = rng.range(-behavior.darkErrorRange, behavior.darkErrorRange);
    ship.rngState = rng.state;
  }
  ship.error += (ship.errorTarget - ship.error) * dt * behavior.darkErrorEase;
}

/**
 * Advances one ship by one tick and says whether it is still sailing, saved, wrecked, or (smugglers)
 * caught or escaped. `light` says where the light on a point comes from, or null if it's dark.
 */
export function stepShip(
  ship: Ship,
  rocks: readonly Rock[],
  light: (x: number, y: number) => LightOrigin | null,
  rules: ShipRules,
  dt: number,
  tick: number,
  emit: Emit,
  sea: SeaForces = CALM_SEA,
): ShipFate {
  const { behavior } = rules;
  const type = rules.types[ship.type];
  const smuggler = isSmuggler(ship);
  const harbor = rules.harbors[ship.harbor] ?? {
    x: 0,
    y: 0,
    radius: rules.sea.defaultHarborRadius,
  };
  const goal = ship.exit ?? harbor;
  const toGoal = Math.atan2(goal.y - ship.y, goal.x - ship.x);
  const extra = extraObstacles(ship, harbor, rules, sea);
  const wasLit = ship.lit;
  const origin = light(ship.x, ship.y);
  ship.lit = origin !== null;

  let desired: number;
  let turnRate: number;
  let speed: number;
  if (origin) {
    if (!wasLit) emit({ type: 'shipLit', tick, shipId: ship.id, x: ship.x, y: ship.y });
    ship.darkTime = 0;
    ship.lost = false;
    // Lighting a ship ends its danger; listeners treat shipLit as the all-clear.
    ship.inDanger = false;
    ship.litTime += dt;
    if (smuggler && ship.litTime >= rules.smuggler.catchSeconds) return CAUGHT;
    // A smuggler turns away from the light; every other ship heads for its harbor.
    const aim = smuggler ? Math.atan2(ship.y - origin.y, ship.x - origin.x) : toGoal;
    speed = ship.speed;
    desired = litHeading(ship, aim, rocks, type.avoidPadding, behavior, extra, speed);
    turnRate = behavior.litTurnRate;
  } else {
    ship.litTime = 0;
    ship.darkTime += dt;
    if (!ship.lost && ship.darkTime >= behavior.lostAfter) {
      ship.lost = true;
      emit({ type: 'shipLost', tick, shipId: ship.id, x: ship.x, y: ship.y });
    }
    wander(ship, behavior, dt);
    speed = ship.speed * behavior.darkSpeedFactor;
    desired = toGoal + ship.error;
    // Smugglers know these waters: they slip around rocks even in the dark.
    if (smuggler) {
      desired = litHeading(ship, desired, rocks, type.avoidPadding, behavior, extra, speed);
    }
    turnRate = behavior.darkTurnRate;
  }

  ship.hornTimer = Math.max(0, ship.hornTimer - dt);
  if (ship.hornTimer > 0) speed *= rules.foghornSpeedFactor;
  if (ship.towedBy !== 0) speed *= rules.tug.speedFactor;
  // Lit ships lean into the storm waves so they still go where they mean to.
  if (ship.lit) desired = leanIntoPush(desired, speed, sea.pushX, sea.pushY);

  driftWithSea(ship, type, rules, sea, tick, emit, dt);
  ship.heading = turnToward(ship.heading, desired, turnRate * type.turnRateMultiplier * dt);
  ship.x += Math.cos(ship.heading) * speed * dt;
  ship.y += Math.sin(ship.heading) * speed * dt;
  keepOffIsland(ship, harbor, smuggler, rules);

  ship.wakeTimer -= dt;
  if (ship.wakeTimer <= 0) {
    ship.wakeTimer = behavior.wakeInterval;
    ship.wake.push({ x: ship.x, y: ship.y });
    if (ship.wake.length > behavior.wakeLength) ship.wake.shift();
  }

  // Smugglers never wreck and never dock; they're caught or slip away.
  if (smuggler) {
    const out = rules.sea.spawnRadius + rules.smuggler.escapeMargin;
    return Math.hypot(ship.x, ship.y) > out ? ESCAPED : SAILING;
  }
  for (const w of sea.whirlpools) {
    if (Math.hypot(ship.x - w.x, ship.y - w.y) < rules.whirlpool.coreRadius) {
      return { kind: 'wrecked', cause: 'whirlpool', reefIndex: null };
    }
  }
  const hull = type.width * behavior.hullCollisionFactor;
  if (!ship.lit) checkDanger(ship, rocks, hull, behavior, tick, emit);
  const rock = rockAt(rocks, ship.x, ship.y, hull);
  if (rock && !(rock.kind === 'iceberg' && shovedByIceberg(ship, rock, hull, rules))) {
    const cause = rock.kind === 'iceberg' ? 'iceberg' : 'reef';
    return { kind: 'wrecked', cause, reefIndex: rock.reef };
  }
  if (Math.hypot(ship.x - harbor.x, ship.y - harbor.y) < harbor.radius) return SAVED;
  return SAILING;
}

/**
 * A dark ship is in danger once it has been unlit for `dangerDarkAfter` seconds, or while it is
 * within `dangerReefDistance` of a rock. The music's tension layer listens for the change.
 */
function checkDanger(
  ship: Ship,
  rocks: readonly Rock[],
  hull: number,
  behavior: ShipBehaviorConfig,
  tick: number,
  emit: Emit,
): void {
  const nearRock = rockAt(rocks, ship.x, ship.y, hull + behavior.dangerReefDistance) !== null;
  const longDark = ship.darkTime >= behavior.dangerDarkAfter;
  const danger = nearRock || longDark;
  if (danger === ship.inDanger) return;
  ship.inDanger = danger;
  if (danger) {
    const reason = longDark ? 'dark' : 'reef';
    emit({ type: 'shipInDanger', tick, shipId: ship.id, reason, x: ship.x, y: ship.y });
  } else emit({ type: 'shipOutOfDanger', tick, shipId: ship.id });
}
