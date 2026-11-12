/**
 * Placeholder play scene (phase 01): the sea, the island and a beam that sweeps by itself.
 * It proves the scale, the layers and the fixed-step loop. Phase 02 replaces it with the real game.
 */
import { Graphics } from 'pixi.js';
import type { Scene } from '../app/sceneManager';
import type { Viewport } from '../app/viewport';
import { BEAM, ISLAND, VIEWPORT } from '../data';
import { createIsland } from '../render/art/island';
import { createBeam } from '../render/beam';
import { createSafeRing, drawSafeRing } from '../render/debug';
import type { Layers } from '../render/layers';
import { createSea, drawSea } from '../render/sea';
import { lerpAngle, wrapAngle } from '../sim/angle';

export interface PlaySceneOptions {
  layers: Layers;
  showSafeRing: boolean;
}

export function createPlayScene({ layers, showSafeRing }: PlaySceneOptions): Scene {
  const sea = createSea();
  const island = createIsland(ISLAND);
  const beam = createBeam(BEAM);
  const safeRing: Graphics | null = showSafeRing ? createSafeRing() : null;

  let angle = -Math.PI / 2;
  let previousAngle = angle;

  return {
    enter() {
      angle = -Math.PI / 2;
      previousAngle = angle;
      layers.water.addChild(sea);
      layers.island.addChild(island);
      layers.lightFx.addChild(beam);
      if (safeRing) layers.effects.addChild(safeRing);
    },
    exit() {
      sea.removeFromParent();
      island.removeFromParent();
      beam.removeFromParent();
      safeRing?.removeFromParent();
    },
    update(dt) {
      previousAngle = angle;
      angle = wrapAngle(angle + BEAM.idleSweepSpeed * dt);
    },
    render(alpha) {
      beam.rotation = lerpAngle(previousAngle, angle, alpha);
    },
    resize(vp: Viewport) {
      drawSea(sea, vp);
      if (safeRing) drawSafeRing(safeRing, vp, VIEWPORT);
    },
  };
}
