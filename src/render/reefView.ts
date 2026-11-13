/**
 * Layers 2 and 3: shallows, rocks and buoys. A rock is drawn only while the simulation says it's lit
 * (with a short fade). Once the light leaves, a dashed amber outline remains and fades with the
 * rock's reef memory. The lighter shallows around a reef show only while that reef is visible, so
 * they never give a hidden reef away.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { RenderFeelConfig } from '../data/types';
import type { World } from '../sim/world';
import { rockSeed } from './art/rockShape';
import type { ArtProvider, Point, RockShape } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { dashOutline } from './dash';
import { approach } from './interpolate';
import { PALETTE } from './palette';

export interface ReefView {
  /** Builds the rocks and buoys of a new night. */
  setNight(world: World): void;
  draw(world: World, dt: number, time: number): void;
  destroy(): void;
}

interface RockSprite {
  body: Container;
  shape: RockShape;
  visible: number;
}

interface BuoySprite {
  body: Container;
  light: Sprite;
  x: number;
  y: number;
  lightHeight: number;
  phase: number;
}

const ISLAND_SHALLOWS = 56;
const REEF_SHALLOWS_PAD = 20;

export function createReefView(
  art: ArtProvider,
  layers: { seabed: Container; reefs: Container; lightFx: Container },
  feel: RenderFeelConfig,
): ReefView {
  const shallows = new Container({ label: 'shallows' });
  const islandShallows = new Sprite({ texture: art.textures.pool, anchor: 0.5 });
  islandShallows.scale.set(ISLAND_SHALLOWS / GLOW_TEXTURE_RADIUS);
  islandShallows.position.set(0, 4);
  islandShallows.tint = PALETTE.seaCrest;
  islandShallows.alpha = 0.16;
  layers.seabed.addChild(islandShallows, shallows);

  const foam = new Graphics({ label: 'foam' });
  const rocksBox = new Container({ label: 'rocks' });
  const memory = new Graphics({ label: 'reefMemory' });
  const buoysBox = new Container({ label: 'buoys', sortableChildren: true });
  layers.reefs.addChild(foam, rocksBox, buoysBox, memory);
  const buoyLights = new Container({ label: 'buoyLights' });
  layers.lightFx.addChild(buoyLights);

  let rocks: RockSprite[] = [];
  let reefShallows: Sprite[] = [];
  let buoys: BuoySprite[] = [];

  const clear = (): void => {
    for (const box of [shallows, rocksBox, buoysBox, buoyLights]) {
      for (const child of box.removeChildren()) child.destroy({ children: true });
    }
    rocks = [];
    reefShallows = [];
    buoys = [];
  };

  return {
    setNight(world) {
      clear();
      const { level } = world.setup;
      rocks = world.state.rocks.map((rock, i) => {
        const shape = art.reefs.rockShape(rockSeed(level.seed, i), rock.r);
        const body = art.reefs.createRock(shape, { x: -rock.x, y: -rock.y });
        body.position.set(rock.x, rock.y);
        body.alpha = 0;
        rocksBox.addChild(body);
        return { body, shape, visible: 0 };
      });
      reefShallows = world.setup.reefs.map((reef, index) => {
        const extent = world.state.rocks
          .filter((rock) => rock.reef === index)
          .reduce(
            (m, rock) => Math.max(m, Math.hypot(rock.x - reef.x, rock.y - reef.y) + rock.r),
            0,
          );
        const s = new Sprite({ texture: art.textures.pool, anchor: 0.5 });
        s.position.set(reef.x, reef.y);
        s.scale.set((extent + REEF_SHALLOWS_PAD) / GLOW_TEXTURE_RADIUS);
        s.tint = PALETTE.seaCrest;
        s.alpha = 0;
        shallows.addChild(s);
        return s;
      });
      buoys = world.setup.buoys.map((b, i) => {
        const { body, lightHeight } = art.reefs.createBuoy();
        body.position.set(b.x, b.y);
        body.zIndex = b.y;
        buoysBox.addChild(body);
        const light = new Sprite({ texture: art.textures.glow, anchor: 0.5, blendMode: 'add' });
        light.tint = PALETTE.lampHot;
        light.scale.set(6 / GLOW_TEXTURE_RADIUS);
        buoyLights.addChild(light);
        return { body, light, x: b.x, y: b.y, lightHeight, phase: i * 1.7 };
      });
    },
    draw(world, dt, time) {
      const rate = 1 / Math.max(0.01, feel.revealFade);
      const reefVisible = new Array<number>(reefShallows.length).fill(0);
      foam.clear();
      memory.clear();
      world.state.rocks.forEach((rock, i) => {
        const sprite = rocks[i];
        if (!sprite) return;
        sprite.visible = approach(sprite.visible, rock.lit ? 1 : 0, rate, dt);
        sprite.body.alpha = sprite.visible;
        sprite.body.visible = sprite.visible > 0.01;
        reefVisible[rock.reef] = Math.max(reefVisible[rock.reef] ?? 0, sprite.visible);
        if (sprite.visible > 0.01) {
          const pulse = Math.sin(time * 2 + rock.x * 0.37) * feel.foamPulse;
          foam
            .ellipse(
              rock.x,
              rock.y + 1.5,
              rock.r + feel.foamReach + pulse,
              (rock.r + feel.foamReach * 0.6 + pulse) * 0.8,
            )
            .stroke({ color: PALETTE.seaCrest, width: 1.1, alpha: 0.5 * sprite.visible });
        }
        if (!rock.lit && rock.memory > 0.02) {
          const points: Point[] = sprite.shape.points.map((p) => ({
            x: p.x + rock.x,
            y: p.y + rock.y,
          }));
          for (const [x0, y0, x1, y1] of dashOutline(points, feel.memoryDash, feel.memoryGap)) {
            memory.moveTo(x0, y0).lineTo(x1, y1);
          }
          memory.stroke({ color: PALETTE.lamp, width: 0.9, alpha: rock.memory * feel.memoryAlpha });
        }
      });
      reefShallows.forEach((s, i) => {
        s.alpha = (reefVisible[i] ?? 0) * 0.16;
      });
      for (const b of buoys) {
        const bob = Math.sin(time * 2 + b.phase) * 0.8;
        b.body.position.set(b.x, b.y + bob);
        b.light.position.set(b.x, b.y + bob - b.lightHeight);
        b.light.alpha = Math.sin(time * 3 + b.phase) > 0 ? 0.95 : 0.25;
      }
    },
    destroy() {
      clear();
      for (const c of [islandShallows, shallows, foam, rocksBox, memory, buoysBox, buoyLights]) {
        c.destroy({ children: true });
      }
    },
  };
}
