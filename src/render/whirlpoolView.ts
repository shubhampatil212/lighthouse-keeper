/**
 * Whirlpools: spiral arms turning round a dark core ringed in rust (the deadly part), with a faint
 * dashed circle where the pull begins. Each whirlpool's shapes are drawn once; every frame they only
 * turn and fade. The view is squashed vertically for the 2.5D look, with the turning inside it.
 */
import { Container, Graphics } from 'pixi.js';
import type { RenderFeelConfig, WhirlpoolConfig } from '../data/types';
import type { World } from '../sim/world';
import type { Point } from './art/types';
import { PALETTE } from './palette';

const SPIRAL_ARMS = 4;
const SPIRAL_POINTS = 14;
const DASHES = 24;
const SQUASH = 0.85;

interface WhirlpoolSprite {
  root: Container;
  arms: Graphics;
  ring: Graphics;
  rust: Graphics;
  core: Graphics;
}

export interface WhirlpoolView {
  draw(world: World, time: number): void;
  clear(): void;
  destroy(): void;
}

export function createWhirlpoolView(
  layers: { lightFx: Container; reefs: Container },
  config: WhirlpoolConfig,
  feel: RenderFeelConfig,
): WhirlpoolView {
  const { pullRadius, coreRadius } = config;
  const swirlBox = new Container({ label: 'whirlpools' });
  const coreBox = new Container({ label: 'whirlpoolCores' });
  layers.reefs.addChild(coreBox);
  layers.lightFx.addChild(swirlBox);
  let sprites: WhirlpoolSprite[] = [];
  let seen: readonly Point[] = [];

  const make = (w: Point): WhirlpoolSprite => {
    const root = new Container();
    root.position.set(w.x, w.y);
    root.scale.y = SQUASH;
    const arms = new Graphics({ blendMode: 'add' });
    for (let arm = 0; arm < SPIRAL_ARMS; arm++) {
      const base = (arm * Math.PI * 2) / SPIRAL_ARMS;
      for (let i = 0; i <= SPIRAL_POINTS; i++) {
        const t = i / SPIRAL_POINTS;
        const r = coreRadius + (pullRadius * 0.95 - coreRadius) * t;
        // Arms curl tighter toward the centre.
        const a = base + (1 - t) * 3.2;
        if (i === 0) arms.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else arms.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      arms.stroke({ color: PALETTE.seaCrest, width: 1.6, cap: 'round' });
    }
    const ring = new Graphics({ blendMode: 'add' });
    for (let i = 0; i < DASHES; i += 2) {
      const a0 = (i / DASHES) * Math.PI * 2;
      const a1 = ((i + 1) / DASHES) * Math.PI * 2;
      ring
        .moveTo(Math.cos(a0) * pullRadius, Math.sin(a0) * pullRadius)
        .lineTo(Math.cos(a1) * pullRadius, Math.sin(a1) * pullRadius);
    }
    ring.stroke({ color: PALETTE.seaCrest, width: 1 });
    const rust = new Graphics({ blendMode: 'add' })
      .ellipse(0, 0, coreRadius, coreRadius)
      .stroke({ color: PALETTE.rust, width: 2 });
    root.addChild(arms, ring, rust);
    swirlBox.addChild(root);
    // The deadly core: a dark hole under the darkness.
    const core = new Graphics()
      .ellipse(w.x, w.y, coreRadius * 1.3, coreRadius * 1.1)
      .fill({ color: 0x03080b, alpha: 0.8 });
    coreBox.addChild(core);
    return { root, arms, ring, rust, core };
  };

  const clear = (): void => {
    for (const s of sprites) {
      s.root.destroy({ children: true });
      s.core.destroy();
    }
    sprites = [];
    seen = [];
  };

  return {
    draw(world, time) {
      const list = world.state.whirlpools;
      if (list !== seen || list.length !== sprites.length) {
        clear();
        sprites = list.map(make);
        seen = list;
      }
      const spin = time * feel.whirlpoolSpin;
      const throb = 0.6 + 0.4 * Math.sin(time * 4);
      for (let i = 0; i < list.length; i++) {
        const w = list[i];
        const s = sprites[i];
        if (!w || !s) continue;
        const alpha = world.isLit(w.x, w.y) ? feel.whirlpoolLitAlpha : feel.whirlpoolDarkAlpha;
        s.arms.rotation = spin;
        s.arms.alpha = alpha;
        s.ring.rotation = spin * 0.2;
        s.ring.alpha = alpha * 0.5;
        s.rust.alpha = Math.min(1, alpha * 2.4 * throb);
      }
    },
    clear,
    destroy() {
      clear();
      swirlBox.destroy({ children: true });
      coreBox.destroy({ children: true });
    },
  };
}
