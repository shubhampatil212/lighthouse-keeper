/**
 * Layer 9, effects. Each one answers a simulation event: a ship home gives ripple rings and a coin pop,
 * a wreck gives splinters, a foam burst, a dark ring and a small camera shake (none with reduced
 * motion), a revealed reef gives a puff of foam, and a ship's first light a small ring.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { RenderFeelConfig } from '../data/types';
import type { SimEvent } from '../sim/events';
import type { World } from '../sim/world';
import type { ArtTextures, Point } from './art/types';
import { PALETTE } from './palette';
import { createParticles, type ParticleBudget } from './particles';
import { shakeOffset } from './shake';

export interface Effects {
  onEvent(event: SimEvent, world: World): void;
  update(dt: number): void;
  /** Current camera shake offset (CSS px). */
  shake(): Point;
  setReducedMotion(on: boolean): void;
  setTextResolution(resolution: number): void;
  clear(): void;
  destroy(): void;
}

interface Ring {
  x: number;
  y: number;
  age: number;
  life: number;
  radius: number;
  color: number;
  width: number;
}

interface CoinPop {
  text: Text;
  x: number;
  y: number;
  age: number;
}

const SPLINTER_COLORS = [0x8a6a45, 0x6b4f33, 0xa4825a];
const GRAVITY_ISH = 18;

export function createEffects(
  layer: Container,
  textures: ArtTextures,
  budget: ParticleBudget,
  feel: RenderFeelConfig,
): Effects {
  const rings: Ring[] = [];
  const ringGraphics = new Graphics({ label: 'rings' });
  const splinters = createParticles(textures.splinter, budget, 'splinters');
  const foam = createParticles(textures.dot, budget, 'foam');
  const pops = new Container({ label: 'coinPops' });
  layer.addChild(ringGraphics, foam.container, splinters.container, pops);

  const popList: CoinPop[] = [];
  let reducedMotion = false;
  let shakeAge = Infinity;
  let textResolution = 2;

  const ring = (
    x: number,
    y: number,
    radius: number,
    color: number,
    life: number,
    delay = 0,
  ): void => {
    rings.push({ x, y, age: -delay, life, radius, color, width: 1.6 });
  };

  const burst = (x: number, y: number, count: number, speed: number, tint: number): void => {
    for (let i = 0; i < count; i++) {
      const m = foam.spawn();
      if (!m) return;
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      m.particle.x = x;
      m.particle.y = y;
      m.vx = Math.cos(a) * v;
      m.vy = Math.sin(a) * v * 0.8;
      m.life = feel.foamSeconds * (0.6 + Math.random() * 0.4);
      m.a = 0.35 + Math.random() * 0.35;
      m.particle.tint = tint;
    }
  };

  const wreck = (x: number, y: number): void => {
    for (let i = 0; i < feel.splinterCount; i++) {
      const m = splinters.spawn();
      if (!m) break;
      const a = Math.random() * Math.PI * 2;
      const v = 10 + Math.random() * 22;
      m.particle.x = x;
      m.particle.y = y;
      m.vx = Math.cos(a) * v;
      m.vy = Math.sin(a) * v * 0.8 - 8;
      m.spin = (Math.random() - 0.5) * 10;
      m.life = feel.splinterSeconds * (0.7 + Math.random() * 0.3);
      m.a = 0.12 + Math.random() * 0.1;
      m.particle.tint = SPLINTER_COLORS[i % SPLINTER_COLORS.length] ?? 0x8a6a45;
    }
    burst(x, y, feel.foamBurstCount, 26, PALETTE.seaCrest);
    ring(x, y, feel.rippleRadius * 0.8, PALETTE.seaCrest, feel.rippleSeconds);
    if (!reducedMotion) shakeAge = 0;
  };

  const saved = (x: number, y: number, coins: number): void => {
    ring(x, y, feel.rippleRadius, PALETTE.lamp, feel.rippleSeconds);
    ring(x, y, feel.rippleRadius * 0.7, PALETTE.lampHot, feel.rippleSeconds, 0.18);
    burst(x, y, 6, 14, PALETTE.lampHot);
    if (coins <= 0) return;
    const text = new Text({
      text: `+${coins}`,
      anchor: 0.5,
      resolution: textResolution,
      style: {
        fontFamily: 'Karla, sans-serif',
        fontWeight: '700',
        fontSize: 13,
        fill: PALETTE.lamp,
        stroke: { color: 0x0a222c, width: 2.5 },
      },
    });
    pops.addChild(text);
    popList.push({ text, x, y: y - 14, age: 0 });
  };

  return {
    onEvent(event, world) {
      switch (event.type) {
        case 'shipSaved':
          saved(event.x, event.y, event.coins);
          break;
        case 'shipWrecked':
          wreck(event.x, event.y);
          break;
        case 'reefRevealed': {
          const reef = world.setup.reefs[event.reefIndex];
          if (reef)
            burst(reef.x, reef.y, Math.round(feel.foamBurstCount / 2), 16, PALETTE.seaCrest);
          break;
        }
        case 'shipLit': {
          const ship = world.state.ships.find((s) => s.id === event.shipId);
          if (ship) ring(ship.x, ship.y, 12, PALETTE.lamp, 0.6);
          break;
        }
        default:
          break;
      }
    },
    update(dt) {
      shakeAge += dt;
      ringGraphics.clear();
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        if (!r) continue;
        r.age += dt;
        if (r.age >= r.life) {
          rings.splice(i, 1);
          continue;
        }
        if (r.age < 0) continue;
        const t = r.age / r.life;
        const eased = 1 - (1 - t) * (1 - t);
        ringGraphics
          .ellipse(r.x, r.y, 3 + eased * r.radius, (3 + eased * r.radius) * 0.85)
          .stroke({ color: r.color, width: r.width * (1 - t * 0.6), alpha: (1 - t) * 0.9 });
      }
      splinters.update((m) => {
        m.age += dt;
        if (m.age >= m.life) return false;
        const t = m.age / m.life;
        m.vx *= 1 - dt * 1.6;
        m.vy = m.vy * (1 - dt * 1.6) + GRAVITY_ISH * dt;
        m.particle.x += m.vx * dt;
        m.particle.y += m.vy * dt;
        m.particle.rotation += m.spin * dt;
        m.particle.scaleX = m.a * 3;
        m.particle.scaleY = m.a * 3;
        m.particle.alpha = 1 - t * t;
        return true;
      });
      foam.update((m) => {
        m.age += dt;
        if (m.age >= m.life) return false;
        const t = m.age / m.life;
        m.vx *= 1 - dt * 3;
        m.vy *= 1 - dt * 3;
        m.particle.x += m.vx * dt;
        m.particle.y += m.vy * dt;
        const size = m.a * (0.6 + t * 0.8);
        m.particle.scaleX = size;
        m.particle.scaleY = size;
        m.particle.alpha = (1 - t) * 0.85;
        return true;
      });
      for (let i = popList.length - 1; i >= 0; i--) {
        const pop = popList[i];
        if (!pop) continue;
        pop.age += dt;
        const t = pop.age / feel.coinPopSeconds;
        if (t >= 1) {
          pop.text.destroy();
          popList.splice(i, 1);
          continue;
        }
        const grow = t < 0.15 ? 0.6 + (t / 0.15) * 0.5 : 1.1 - Math.min(0.1, (t - 0.15) * 0.4);
        pop.text.position.set(pop.x, pop.y - t * 22);
        pop.text.scale.set(grow);
        pop.text.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      }
    },
    shake() {
      return shakeOffset(shakeAge, feel.shakeSeconds, feel.shakeStrength);
    },
    setReducedMotion(on) {
      reducedMotion = on;
      if (on) shakeAge = Infinity;
    },
    setTextResolution(resolution) {
      textResolution = resolution;
      for (const pop of popList) pop.text.resolution = resolution;
    },
    clear() {
      rings.length = 0;
      ringGraphics.clear();
      splinters.clear();
      foam.clear();
      for (const pop of popList) pop.text.destroy();
      popList.length = 0;
      shakeAge = Infinity;
    },
    destroy() {
      this.clear();
      splinters.destroy();
      foam.destroy();
      ringGraphics.destroy();
      pops.destroy({ children: true });
    },
  };
}
