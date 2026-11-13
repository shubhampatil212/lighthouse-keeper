/**
 * Cues drawn above the darkness, beside the vessels: each ship's destination color (and shape in
 * colorblind mode) when the night has more than one harbor, the smuggler's catch ring, tugboat and
 * coast guard tow lines, the foghorn's "slowed" mark, and a hunting pirate's closing-in cue on its
 * prey, which tightens over the boarding delay (the player's window to act).
 */
import { Graphics, type Container } from 'pixi.js';
import { HARBOR_STYLE, SMUGGLER, VESSEL_FEEL } from '../data';
import type { HarborShape } from '../data/types';
import type { World } from '../sim/world';
import type { Point } from './art/types';
import { PALETTE } from './palette';
import type { ShipPose } from './shipView';

export interface VesselMarks {
  draw(
    world: World,
    poses: readonly ShipPose[],
    lanternAt: (id: number) => Point | undefined,
    time: number,
    pixel: number,
  ): void;
  setColorblind(on: boolean): void;
  destroy(): void;
}

const HUNT_RED = 0xff3b3b;
const SLOWED_BLUE = 0x9fd4ff;
const ROPE = 0xd8c9a0;

/** A harbor's color, and in colorblind mode its shape too. */
export function harborLook(
  index: number,
  colorblind: boolean,
): { color: number; shape: HarborShape | null } {
  const colors = colorblind ? HARBOR_STYLE.colorblindColors : HARBOR_STYLE.colors;
  return {
    color: colors[index % colors.length] ?? PALETTE.lamp,
    shape: colorblind ? (HARBOR_STYLE.shapes[index % HARBOR_STYLE.shapes.length] ?? null) : null,
  };
}

/** Draws a filled destination marker: a dot, or a circle/triangle with a dark rim in colorblind mode. */
export function drawMarker(
  g: Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  shape: HarborShape | null,
): void {
  if (shape === 'triangle') {
    const h = size * 1.15;
    g.poly([x, y - h, x + h, y + h * 0.8, x - h, y + h * 0.8])
      .fill(color)
      .stroke({ color: PALETTE.seaDeep, width: size * 0.35 });
  } else if (shape === 'circle') {
    g.circle(x, y, size)
      .fill(color)
      .stroke({ color: PALETTE.seaDeep, width: size * 0.35 });
  } else {
    g.circle(x, y, size * 0.9).fill(color);
  }
}

export function createVesselMarks(layer: Container): VesselMarks {
  const g = new Graphics({ label: 'vesselMarks' });
  layer.addChild(g);
  let colorblind = false;
  const feel = VESSEL_FEEL;

  return {
    draw(world, poses, lanternAt, time, pixel) {
      g.clear();
      const byId = new Map(poses.map((p) => [p.id, p]));
      const { state, setup } = world;
      const multiHarbor = setup.harbors.length > 1;

      for (const ship of state.ships) {
        const pose = byId.get(ship.id);
        if (!pose) continue;
        const lantern = lanternAt(ship.id) ?? pose;

        // Where it's bound: shown even in the dark, beside the lantern.
        if (multiHarbor && ship.exit === null) {
          const { color, shape } = harborLook(ship.harbor, colorblind);
          drawMarker(
            g,
            lantern.x + feel.destinationOffsetX,
            lantern.y + feel.destinationOffsetY,
            feel.destinationSize,
            color,
            shape,
          );
        }

        // A smuggler being caught: a ring that fills over the 2 s of light.
        if (ship.exit !== null && ship.lit && ship.litTime > 0) {
          const t = Math.min(1, ship.litTime / SMUGGLER.catchSeconds);
          const r = feel.catchRingRadius;
          g.circle(pose.x, pose.y, r).stroke({
            color: PALETTE.seaCrest,
            width: feel.catchRingWidth * 0.5,
            alpha: 0.35,
          });
          g.moveTo(pose.x, pose.y - r)
            .arc(pose.x, pose.y, r, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2)
            .stroke({
              color: 0x6fb8ff,
              width: feel.catchRingWidth,
              alpha: 0.95,
              cap: 'round',
            });
        }

        // Slowed by the foghorn: two small sound arcs under the lantern (clear of the "?"), fading as
        // the slow ends.
        if (ship.hornTimer > 0) {
          const s = feel.slowedSize;
          const a = Math.min(1, ship.hornTimer) * 0.85;
          for (let i = 1; i <= 2; i++) {
            const rr = s * i * 0.7;
            const a0 = Math.PI * 0.2;
            const cy = lantern.y + 2;
            g.moveTo(lantern.x + Math.cos(a0) * rr, cy + Math.sin(a0) * rr)
              .arc(lantern.x, cy, rr, a0, Math.PI * 0.8)
              .stroke({
                color: SLOWED_BLUE,
                width: 0.9,
                alpha: a / i,
              });
          }
        }

        // A lit tugboat towing this dark ship: a rope between them.
        if (ship.towedBy !== 0) {
          const tug = byId.get(ship.towedBy);
          if (tug) {
            g.moveTo(tug.x, tug.y)
              .lineTo(pose.x, pose.y)
              .stroke({ color: ROPE, width: feel.ropeWidth, alpha: feel.ropeAlpha });
          }
        }
      }

      // Coast guard tow lines.
      for (const tow of state.tows) {
        if (tow.phase !== 'towing') continue;
        const boat = byId.get(tow.id);
        const smuggler = byId.get(tow.smuggler.id);
        if (!boat || !smuggler) continue;
        g.moveTo(boat.x, boat.y)
          .lineTo(smuggler.x, smuggler.y)
          .stroke({ color: ROPE, width: feel.ropeWidth, alpha: feel.ropeAlpha });
      }

      // A hunting pirate: a dashed red line to its prey and a ring closing in on it.
      for (const pirate of state.pirates) {
        if (pirate.mode !== 'hunt') continue;
        // Lantern to lantern: in the dark, the lanterns are what the player sees.
        const fromPose = byId.get(pirate.id);
        const preyPose = byId.get(pirate.targetId);
        if (!fromPose || !preyPose) continue;
        const from = lanternAt(pirate.id) ?? fromPose;
        const prey = lanternAt(pirate.targetId) ?? preyPose;
        const t = Math.min(1, pirate.huntTime / setupBoardDelay(world));
        const pulse = 0.6 + 0.4 * Math.sin(time * (6 + t * 10));
        dashedLine(g, from, prey, 3, 3);
        g.stroke({ color: HUNT_RED, width: Math.max(0.8, pixel * 1.2), alpha: 0.35 + 0.4 * t });
        const r = feel.huntRingStart + (feel.huntRingEnd - feel.huntRingStart) * t;
        g.circle(prey.x, prey.y, r).stroke({
          color: HUNT_RED,
          width: 1.2 + t,
          alpha: (0.45 + 0.5 * t) * pulse,
        });
      }
    },
    setColorblind(on) {
      colorblind = on;
    },
    destroy() {
      g.destroy();
    },
  };
}

/** Adds a dashed straight line to the path (stroke it afterwards). */
function dashedLine(g: Graphics, a: Point, b: Point, dash: number, gap: number): void {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < 0.01) return;
  const ux = (b.x - a.x) / length;
  const uy = (b.y - a.y) / length;
  for (let s = 0; s < length; s += dash + gap) {
    const e = Math.min(length, s + dash);
    g.moveTo(a.x + ux * s, a.y + uy * s).lineTo(a.x + ux * e, a.y + uy * e);
  }
}

const setupBoardDelay = (world: World): number => world.setup.pirates.pirate.boardDelay;
