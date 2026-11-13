/**
 * Works out, once per frame, where each lamp points (blended between ticks) and how far its light
 * reaches through fog, in the shapes the water, the light map and the beam effects read. The objects
 * are made once and refilled every frame.
 */
import type { Viewport } from '../app/viewport';
import { ABILITIES, HAZARDS } from '../data';
import { lerpAngle } from '../sim/angle';
import type { BeamStats } from '../sim/beam';
import type { World } from '../sim/world';
import type { Point } from './art/types';
import { beamReachThroughFog, type SecondLampLight } from './lightMap';
import type { SecondWaterLight, WaterLight } from './water';

export interface NightLightsFrame {
  /** The island beam's angle this frame. */
  angle: number;
  /** The island beam with its range cut back by fog. */
  reachBeam: BeamStats;
  /** The second lighthouse (null on nights without one) and its beam cut back by fog. */
  lamp2: SecondLampLight | null;
  reachBeam2: BeamStats;
  water: WaterLight;
  water2: SecondWaterLight | null;
  /** The lamp glass on screen (CSS px), for its reflection on the water. */
  lampOnScreen: Point;
}

export interface NightLights {
  update(
    world: World,
    previousBeam: number,
    previousLamp2: number,
    alpha: number,
    vp: Viewport,
    lamp: Point,
  ): NightLightsFrame;
}

export function createNightLights(): NightLights {
  const fogFactor = HAZARDS.fog.rangeFactor;
  const lamp2: SecondLampLight = {
    x: 0,
    y: 0,
    angle: 0,
    glowRadius: ABILITIES.secondLamp.glowRadius,
  };
  const water2: SecondWaterLight = { x: 0, y: 0, angle: 0, halfAngle: 0, range: 0, glowRadius: 0 };
  const frame: NightLightsFrame = {
    angle: 0,
    reachBeam: { halfAngle: 0, range: 0, turnSpeed: 0, glowRadius: 0 },
    lamp2: null,
    reachBeam2: { halfAngle: 0, range: 0, turnSpeed: 0, glowRadius: 0 },
    water: { angle: 0, halfAngle: 0, range: 0, glowRadius: 0 },
    water2: null,
    lampOnScreen: { x: 0, y: 0 },
  };

  return {
    update(world, previousBeam, previousLamp2, alpha, vp, lamp) {
      const { state, setup } = world;
      const angle = lerpAngle(previousBeam, state.beam.angle, alpha);
      const reach = beamReachThroughFog(0, 0, angle, setup.beam.range, state.fogBands, fogFactor);
      frame.angle = angle;
      Object.assign(frame.reachBeam, setup.beam);
      frame.reachBeam.range = reach;
      const water = frame.water;
      water.angle = angle;
      water.halfAngle = setup.beam.halfAngle;
      water.range = reach;
      water.glowRadius = setup.beam.glowRadius;
      frame.lampOnScreen.x = vp.centerX + lamp.x * vp.scale;
      frame.lampOnScreen.y = vp.centerY + lamp.y * vp.scale;

      const second = state.lamp2;
      frame.lamp2 = second ? lamp2 : null;
      frame.water2 = second ? water2 : null;
      Object.assign(frame.reachBeam2, setup.beam);
      if (!second) return frame;
      lamp2.x = second.x;
      lamp2.y = second.y;
      lamp2.angle = lerpAngle(previousLamp2, second.angle, alpha);
      frame.reachBeam2.range = beamReachThroughFog(
        lamp2.x,
        lamp2.y,
        lamp2.angle,
        setup.beam.range,
        state.fogBands,
        fogFactor,
      );
      water2.x = lamp2.x;
      water2.y = lamp2.y;
      water2.angle = lamp2.angle;
      water2.halfAngle = setup.beam.halfAngle;
      water2.range = frame.reachBeam2.range;
      water2.glowRadius = lamp2.glowRadius;
      return frame;
    },
  };
}
