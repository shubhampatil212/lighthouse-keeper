/**
 * Which effect answers which simulation event. A ship home gives ripple rings and a coin pop; a wreck
 * gives splinters, foam, a ring and a small shake, with a red flash when a pirate boarded it, ice
 * shards on an iceberg, and rings closing in when a whirlpool took it. A revealed reef puffs foam,
 * a ship's first light gets a small ring, a caught smuggler pops its bonus in coast guard blue.
 */
import type { SimEvent } from '../sim/events';
import type { World } from '../sim/world';
import type { Point } from './art/types';
import type { FxKit } from './effects';
import { PALETTE } from './palette';

const PIRATE_RED = 0xff3b3b;
const COAST_GUARD_BLUE = 0x6fb8ff;
const ICE_SHARDS = [0xe8f6ff, 0xb9e1f5, 0x8cc7e6];
const ROPE = 0xd8c9a0;

function wreck(kit: FxKit, event: Extract<SimEvent, { type: 'shipWrecked' }>): void {
  const { x, y, cause } = event;
  const { feel } = kit;
  if (cause === 'whirlpool') {
    // Dragged under: rings closing in on the centre and a little foam.
    for (let i = 0; i < 3; i++)
      kit.ring(x, y, feel.rippleRadius, PALETTE.seaCrest, 0.9, i * 0.2, true);
    kit.burst(x, y, Math.round(feel.foamBurstCount / 2), 10, PALETTE.seaCrest);
    kit.shake();
    return;
  }
  kit.splinters(x, y, cause === 'iceberg' ? ICE_SHARDS : undefined);
  if (cause === 'iceberg') kit.splinters(x, y);
  kit.burst(x, y, feel.foamBurstCount, 26, PALETTE.seaCrest);
  kit.ring(x, y, feel.rippleRadius * 0.8, PALETTE.seaCrest, feel.rippleSeconds);
  if (cause === 'pirate') {
    kit.ring(x, y, feel.rippleRadius * 0.6, PIRATE_RED, 0.5);
    kit.ring(x, y, feel.rippleRadius, PIRATE_RED, 0.8, 0.1);
  }
  kit.shake();
}

export function reactToEvent(
  event: SimEvent,
  world: World,
  at: Point | undefined,
  kit: FxKit,
): void {
  const { feel } = kit;
  switch (event.type) {
    case 'shipSaved': {
      const { x, y } = event;
      kit.ring(x, y, feel.rippleRadius, PALETTE.lamp, feel.rippleSeconds);
      kit.ring(x, y, feel.rippleRadius * 0.7, PALETTE.lampHot, feel.rippleSeconds, 0.18);
      kit.burst(x, y, 6, 14, PALETTE.lampHot);
      if (event.coins > 0) kit.pop(x, y, `+${event.coins}`, PALETTE.lamp);
      break;
    }
    case 'shipWrecked':
      wreck(kit, event);
      break;
    case 'reefRevealed':
      kit.burst(event.x, event.y, Math.round(feel.foamBurstCount / 2), 16, PALETTE.seaCrest);
      break;
    case 'shipLit': {
      const ship = world.state.ships.find((s) => s.id === event.shipId);
      if (ship) kit.ring(ship.x, ship.y, 12, PALETTE.lamp, 0.6);
      break;
    }
    case 'smugglerCaught':
      kit.ring(event.x, event.y, feel.rippleRadius, COAST_GUARD_BLUE, feel.rippleSeconds);
      kit.ring(event.x, event.y, feel.rippleRadius * 0.6, PALETTE.lampHot, 0.8, 0.15);
      kit.pop(event.x, event.y, `+${event.coins}`, COAST_GUARD_BLUE);
      break;
    case 'smugglerTowed':
      kit.ring(event.x, event.y, 10, ROPE, 0.5);
      break;
    case 'smugglerEscaped':
      if (at) kit.ring(at.x, at.y, 16, PALETTE.fog, 1);
      break;
    case 'pirateDrivenOff': {
      const pirate = world.state.pirates.find((p) => p.id === event.pirateId);
      if (pirate) {
        kit.ring(pirate.x, pirate.y, 22, PALETTE.lampHot, 0.7);
        kit.burst(pirate.x, pirate.y, 6, 18, PALETTE.seaCrest);
      }
      break;
    }
    case 'buoyRang': {
      const buoy = world.setup.buoys[event.buoyIndex];
      if (buoy) {
        kit.ring(buoy.x, buoy.y, 10, PALETTE.lampHot, 0.6);
        kit.ring(buoy.x, buoy.y, 16, PALETTE.lamp, 0.8, 0.2);
      }
      break;
    }
    case 'tugTowing': {
      const ship = world.state.ships.find((s) => s.id === event.shipId);
      if (ship) kit.ring(ship.x, ship.y, 9, ROPE, 0.5);
      break;
    }
    default:
      break;
  }
}
