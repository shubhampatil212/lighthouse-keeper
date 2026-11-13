/**
 * Sky and ability effects, each answering a simulation event:
 * - lightningWarning: a pale glow pulses in the clouds near the top of the screen for the warning second;
 * - lightning: a jagged bolt and a cold white-blue flash over the whole screen (gentler with reduced
 *   motion), and the map-wide light turns cold white instead of warm;
 * - flareFired: a red-white flare climbs from the lamp and fades, trailing a little smoke;
 * - foghornUsed: rings roll out from the island to the foghorn's reach.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import type { RenderFeelConfig } from '../data/types';
import type { SimEvent } from '../sim/events';
import type { ArtTextures, Point } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { PALETTE } from './palette';

export interface SkyFx {
  onEvent(event: SimEvent): void;
  /** Color for the map-wide light: cold just after lightning, otherwise null (the region's warm light). */
  floodColor(): number | null;
  update(dt: number, time: number): void;
  resize(vp: Viewport): void;
  setReducedMotion(on: boolean): void;
  clear(): void;
  destroy(): void;
}

const COLD_LIGHT = 0xe2ecff;
const FLARE_RED = 0xff6a4d;
/** How long after a strike the map-wide light stays cold (a little past the 0.25 s flash). */
const COLD_SECONDS = 0.5;

export function createSkyFx(
  layers: { weather: Container; lightFx: Container; effects: Container },
  textures: ArtTextures,
  lamp: Point,
  hornRadius: number,
  feel: RenderFeelConfig,
): SkyFx {
  // Screen space (weather layer): the warning glow, the flash and the bolt.
  const warning = new Sprite({ texture: textures.glow, anchor: 0.5, blendMode: 'add' });
  warning.tint = COLD_LIGHT;
  warning.visible = false;
  const flash = new Graphics({ label: 'lightningFlash' });
  flash.visible = false;
  const bolt = new Graphics({ label: 'bolt', blendMode: 'add' });
  layers.weather.addChild(warning, flash, bolt);

  // World space: the flare (light effects) and the foghorn rings (effects).
  const flare = new Container({ label: 'flare', visible: false });
  const flareGlow = new Sprite({ texture: textures.glow, anchor: 0.5, blendMode: 'add' });
  flareGlow.tint = FLARE_RED;
  const flareCore = new Sprite({ texture: textures.dot, anchor: 0.5, blendMode: 'add' });
  flareCore.tint = 0xfff2e6;
  const trail = new Graphics({ label: 'flareTrail' });
  flare.addChild(trail, flareGlow, flareCore);
  layers.lightFx.addChild(flare);
  const rings = new Graphics({ label: 'foghornRings' });
  layers.effects.addChild(rings);

  let vp: Viewport | null = null;
  let reducedMotion = false;
  let warnAge = Infinity;
  let warnPoint = { x: 0, y: 0 };
  let flashAge = Infinity;
  let flareAge = Infinity;
  let hornAge = Infinity;
  let ringsDrawn = false;
  let flashWidth = 0;
  let flashHeight = 0;

  const drawBolt = (): void => {
    bolt.clear();
    if (!vp) return;
    let x = warnPoint.x;
    let y = 0;
    const end = vp.height * (0.35 + Math.random() * 0.25);
    bolt.moveTo(x, y);
    while (y < end) {
      x += (Math.random() - 0.5) * 50;
      y += 18 + Math.random() * 30;
      bolt.lineTo(x, y);
    }
    bolt.stroke({ color: COLD_LIGHT, width: 2.4, alpha: 0.95, join: 'miter' });
  };

  return {
    onEvent(event) {
      switch (event.type) {
        case 'lightningWarning':
          warnAge = 0;
          warnPoint = {
            x: (vp?.width ?? 400) * (0.15 + Math.random() * 0.7),
            y: (vp?.height ?? 600) * 0.06,
          };
          break;
        case 'lightning':
          warnAge = Infinity;
          flashAge = 0;
          drawBolt();
          break;
        case 'flareFired':
          flareAge = 0;
          break;
        case 'foghornUsed':
          hornAge = 0;
          break;
        default:
          break;
      }
    },
    floodColor() {
      return flashAge < COLD_SECONDS ? COLD_LIGHT : null;
    },
    update(dt, time) {
      warnAge += dt;
      flashAge += dt;
      flareAge += dt;
      hornAge += dt;

      // Warning: a flickering glow behind the clouds.
      warning.visible = warnAge < 1.2;
      if (warning.visible && vp) {
        const flick = 0.5 + 0.5 * Math.sin(time * 23) * Math.sin(time * 7.3);
        const grow = Math.min(1, warnAge / 0.8);
        warning.position.set(warnPoint.x, warnPoint.y);
        warning.scale.set((Math.min(vp.width, vp.height) * 0.45) / GLOW_TEXTURE_RADIUS);
        warning.alpha = feel.lightningWarnAlpha * grow * (0.4 + 0.6 * flick);
      }

      // Flash and bolt.
      const f = flashAge / feel.lightningFlashSeconds;
      flash.visible = f < 1;
      if (flash.visible && vp) {
        const strength = reducedMotion ? 0.35 : 1;
        if (flashWidth !== vp.width || flashHeight !== vp.height) {
          flashWidth = vp.width;
          flashHeight = vp.height;
          flash.clear().rect(0, 0, vp.width, vp.height).fill(COLD_LIGHT);
        }
        flash.alpha = feel.lightningFlashAlpha * strength * (1 - f) * (1 - f);
      }
      bolt.visible = flashAge < 0.18;

      // Flare: climbs fast, slows, flickers, fades over the map-light time.
      const t = flareAge / feel.flareSeconds;
      flare.visible = t < 1;
      if (flare.visible) {
        const rise = feel.flareRise * (1 - (1 - Math.min(1, t * 1.6)) ** 2);
        const x = lamp.x + Math.sin(t * 5) * 2;
        const y = lamp.y - rise;
        const flick = 1 + Math.sin(time * 40) * 0.12;
        flareGlow.position.set(x, y);
        flareGlow.scale.set((feel.flareGlowRadius * flick) / GLOW_TEXTURE_RADIUS);
        flareGlow.alpha = 0.9 * (1 - t * t);
        flareCore.position.set(x, y);
        flareCore.scale.set(0.6 * flick);
        flareCore.alpha = 1 - t * t;
        trail
          .clear()
          .moveTo(lamp.x, lamp.y)
          .quadraticCurveTo(lamp.x + 3, lamp.y - rise * 0.5, x, y)
          .stroke({ color: PALETTE.fog, width: 1.6, alpha: 0.45 * (1 - t) });
      }

      // Foghorn: three rings rolling out to the horn's reach.
      const horn = hornAge < 0.5 + feel.hornRingSeconds;
      if (horn || ringsDrawn) rings.clear();
      ringsDrawn = horn;
      for (let i = 0; horn && i < 3; i++) {
        const age = hornAge - i * 0.25;
        const h = age / feel.hornRingSeconds;
        if (h < 0 || h >= 1) continue;
        const r = 20 + (hornRadius - 20) * (1 - (1 - h) ** 2);
        rings
          .ellipse(0, 0, r, r * 0.85)
          .stroke({ color: PALETTE.parchment, width: 2 - h, alpha: 0.55 * (1 - h) });
      }
    },
    resize(next) {
      vp = next;
    },
    setReducedMotion(on) {
      reducedMotion = on;
    },
    clear() {
      warnAge = flashAge = flareAge = hornAge = Infinity;
      warning.visible = flash.visible = bolt.visible = flare.visible = false;
      rings.clear();
    },
    destroy() {
      for (const c of [warning, flash, bolt, flare, rings]) c.destroy({ children: true });
    },
  };
}
