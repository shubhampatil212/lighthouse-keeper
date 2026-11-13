/**
 * Layers 2 and 3: shallows, rocks, icebergs and buoys. A rock is drawn only while the simulation says
 * it's lit (with a short fade). Once the light leaves, a dashed amber outline remains and fades with
 * the rock's reef memory (ice-blue for icebergs). The lighter shallows around a reef show only while
 * that reef is visible, so they never give a hidden reef away. Icebergs drift every tick, and the
 * sandbox can add or remove them mid-night, so sprites are kept per rock rather than per position.
 * The second lighthouse's islet is drawn by secondLampView, not here. Each rock's foam ring and memory
 * outline are drawn once and then only moved, scaled and faded, rather than redrawn every frame.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { RenderFeelConfig } from '../data/types';
import type { Rock } from '../sim/reefs';
import type { World } from '../sim/world';
import { ICE_EDGE } from './art/reefs';
import { rockSeed } from './art/rockShape';
import type { ArtProvider, RockShape } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { dashOutline } from './dash';
import { approach } from './interpolate';
import { PALETTE } from './palette';

export interface ReefView {
  /** Builds the rocks and buoys of a new night. */
  setNight(world: World): void;
  draw(world: World, dt: number, time: number): void;
  /** High-contrast reefs: a stronger memory outline that lasts longer. */
  setHighContrast(on: boolean): void;
  destroy(): void;
}

interface RockSprite {
  body: Container;
  shape: RockShape;
  visible: number;
  /** How strongly the memory outline shows, 0–1 (follows the rock's memory, or outlasts it). */
  outline: number;
  /** The foam ring at its resting size (scaled to pulse). */
  foam: Graphics;
  foamRx: number;
  foamRy: number;
  /** The dashed memory outline, drawn in the style `outlineHigh` says (redrawn when it changes). */
  memory: Graphics;
  outlineHigh: boolean | null;
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

  const foam = new Container({ label: 'foam' });
  const rocksBox = new Container({ label: 'rocks' });
  const memory = new Container({ label: 'reefMemory' });
  const buoysBox = new Container({ label: 'buoys', sortableChildren: true });
  layers.reefs.addChild(foam, rocksBox, buoysBox, memory);
  const buoyLights = new Container({ label: 'buoyLights' });
  layers.lightFx.addChild(buoyLights);

  const rocks = new Map<Rock, RockSprite>();
  let reefShallows: Sprite[] = [];
  let buoys: BuoySprite[] = [];
  let levelSeed = 0;
  let highContrast = false;
  /** Per-frame bookkeeping, reused: how lit each reef is, and the frame each rock was last seen. */
  const reefVisible: number[] = [];
  const seenOn = new WeakMap<Rock, number>();
  let frame = 0;

  const clear = (): void => {
    for (const box of [shallows, rocksBox, buoysBox, buoyLights, foam, memory]) {
      for (const child of box.removeChildren()) child.destroy({ children: true });
    }
    rocks.clear();
    reefShallows = [];
    buoys = [];
  };

  /** Rocks keep the look they had since phase 03; icebergs added later get a seed from their reef. */
  const makeSprite = (rock: Rock, seed: number): RockSprite => {
    const shape = art.reefs.rockShape(seed, rock.r);
    const lightFrom = { x: -rock.x, y: -rock.y };
    const body =
      rock.kind === 'iceberg'
        ? art.reefs.createIceberg(shape, lightFrom)
        : art.reefs.createRock(shape, lightFrom);
    body.position.set(rock.x, rock.y);
    body.alpha = 0;
    body.visible = false;
    rocksBox.addChild(body);
    const ice = rock.kind === 'iceberg';
    const foamRx = rock.r + feel.foamReach;
    const foamRy = (rock.r + feel.foamReach * 0.6) * 0.8;
    const foamRing = new Graphics({ visible: false })
      .ellipse(0, 1.5, foamRx, foamRy)
      .stroke({ color: ice ? ICE_EDGE : PALETTE.seaCrest, width: ice ? 1.4 : 1.1 });
    foam.addChild(foamRing);
    const outline = new Graphics({ visible: false });
    memory.addChild(outline);
    return {
      body,
      shape,
      visible: 0,
      outline: 0,
      foam: foamRing,
      foamRx,
      foamRy,
      memory: outline,
      outlineHigh: null,
    };
  };

  /** Draws a rock's dashed outline (around its own centre) in the normal or high-contrast style. */
  const drawOutline = (sprite: RockSprite, ice: boolean): void => {
    const high = feel.memoryHigh;
    const g = sprite.memory.clear();
    const dash = highContrast ? high.dash : feel.memoryDash;
    const gap = highContrast ? high.gap : feel.memoryGap;
    for (const [x0, y0, x1, y1] of dashOutline(sprite.shape.points, dash, gap)) {
      g.moveTo(x0, y0).lineTo(x1, y1);
    }
    g.stroke({
      color: highContrast ? high.color : ice ? ICE_EDGE : PALETTE.lamp,
      width: highContrast ? high.width : 0.9,
    });
    sprite.outlineHigh = highContrast;
  };

  const removeSprite = (rock: Rock, sprite: RockSprite): void => {
    sprite.body.destroy({ children: true });
    sprite.foam.destroy();
    sprite.memory.destroy();
    rocks.delete(rock);
  };

  return {
    setNight(world) {
      clear();
      const { level } = world.setup;
      levelSeed = level.seed;
      world.state.rocks.forEach((rock, i) => {
        if (rock.kind !== 'islet') rocks.set(rock, makeSprite(rock, rockSeed(level.seed, i)));
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
      reefVisible.length = reefShallows.length;
      reefVisible.fill(0);
      frame++;
      for (const rock of world.state.rocks) {
        if (rock.kind === 'islet') continue;
        let sprite = rocks.get(rock);
        if (!sprite) {
          sprite = makeSprite(rock, rockSeed(levelSeed, 1000 + rock.reef));
          rocks.set(rock, sprite);
        }
        seenOn.set(rock, frame);
        const ice = rock.kind === 'iceberg';
        if (ice) sprite.body.position.set(rock.x, rock.y);
        sprite.visible = approach(sprite.visible, rock.lit ? 1 : 0, rate, dt);
        sprite.body.alpha = sprite.visible;
        // Revealed rocks settle into place; hidden ones just fade.
        sprite.body.scale.set(rock.lit ? 1 + feel.revealSettle * (1 - sprite.visible) : 1);
        sprite.body.visible = sprite.visible > 0.01;
        if (rock.reef < reefVisible.length) {
          reefVisible[rock.reef] = Math.max(reefVisible[rock.reef] ?? 0, sprite.visible);
        }
        const ring = sprite.foam;
        ring.visible = sprite.visible > 0.01;
        if (ring.visible) {
          const pulse = Math.sin(time * 2 + rock.x * 0.37) * feel.foamPulse;
          ring.position.set(rock.x, rock.y);
          ring.scale.set(
            (sprite.foamRx + pulse) / sprite.foamRx,
            (sprite.foamRy + pulse * 0.8) / sprite.foamRy,
          );
          ring.alpha = (ice ? 0.75 : 0.5) * sprite.visible;
        }
        const high = feel.memoryHigh;
        sprite.outline = highContrast
          ? Math.max(
              rock.memory,
              sprite.outline - dt / Math.max(0.1, world.setup.difficulty.reefMemory * high.lasts),
            )
          : rock.memory;
        const outline = sprite.memory;
        outline.visible = !rock.lit && sprite.outline > 0.02;
        if (outline.visible) {
          if (sprite.outlineHigh !== highContrast) drawOutline(sprite, ice);
          outline.position.set(rock.x, rock.y);
          outline.alpha = sprite.outline * (highContrast ? high.alpha : feel.memoryAlpha);
        }
      }
      for (const [rock, sprite] of rocks) {
        if (seenOn.get(rock) !== frame) removeSprite(rock, sprite);
      }
      for (let i = 0; i < reefShallows.length; i++) {
        const s = reefShallows[i];
        if (s) s.alpha = (reefVisible[i] ?? 0) * 0.16;
      }
      for (const b of buoys) {
        const bob = Math.sin(time * 2 + b.phase) * 0.8;
        b.body.position.set(b.x, b.y + bob);
        b.light.position.set(b.x, b.y + bob - b.lightHeight);
        b.light.alpha = Math.sin(time * 3 + b.phase) > 0 ? 0.95 : 0.25;
      }
    },
    setHighContrast(on) {
      highContrast = on;
    },
    destroy() {
      clear();
      for (const c of [islandShallows, shallows, foam, rocksBox, memory, buoysBox, buoyLights]) {
        c.destroy({ children: true });
      }
    },
  };
}
