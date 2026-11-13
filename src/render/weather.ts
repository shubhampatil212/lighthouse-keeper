/**
 * Layer 8, weather. Two fog banks drift at different speeds and sizes for depth: the far one sits under
 * the darkness, so it glows where the beam passes through it; the near one sits above everything as a
 * faint haze. Rain streaks and snowflakes fall in screen space, and on High a few specks of spray
 * drift in the beam. Amounts come from the level's weather (0 = none, 1 = heavy).
 */
import { TilingSprite, type Container } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import type { QualityProfile, RegionPalette, RenderFeelConfig, WeatherDef } from '../data/types';
import type { BeamStats } from '../sim/beam';
import type { ArtTextures } from './art/types';
import { PALETTE } from './palette';
import { createParticles, type ParticleBudget } from './particles';

export interface Weather {
  setQuality(profile: QualityProfile): void;
  setPalette(palette: RegionPalette): void;
  setWeather(weather: WeatherDef): void;
  resize(vp: Viewport): void;
  update(dt: number, time: number, beamAngle: number, beam: BeamStats): void;
  destroy(): void;
}

/** Weather may use this share of the particle cap; the rest is kept for effects. */
const WEATHER_SHARE = 0.6;
const SPRAY_COUNT = 40;

export function createWeather(
  layers: { underDarkness: Container; weather: Container; lightFx: Container },
  textures: ArtTextures,
  budget: ParticleBudget,
  feel: RenderFeelConfig,
): Weather {
  const far = new TilingSprite({ texture: textures.fog, width: 2, height: 2, label: 'fogFar' });
  const near = new TilingSprite({ texture: textures.fog, width: 2, height: 2, label: 'fogNear' });
  layers.underDarkness.addChild(far);
  const rain = createParticles(textures.drop, budget, 'rain');
  const snow = createParticles(textures.flake, budget, 'snow');
  const spray = createParticles(textures.dot, budget, 'spray');
  spray.container.blendMode = 'add';
  layers.weather.addChild(near, rain.container, snow.container);
  layers.lightFx.addChild(spray.container);

  let vp: Viewport | null = null;
  let amounts: WeatherDef = { fog: 0, rain: 0, snow: 0 };
  let fogLayers = 2;
  let sprayOn = false;
  let rainTint: number = PALETTE.seaCrest;

  const share = (): number => Math.floor(budget.cap * WEATHER_SHARE);

  const applyFog = (): void => {
    far.visible = amounts.fog > 0;
    near.visible = amounts.fog > 0 && fogLayers >= 2;
    far.alpha = feel.fogAlphaFar * amounts.fog;
    near.alpha = feel.fogAlphaNear * amounts.fog;
  };

  const placeDrop = (x: number, y: number, m: { particle: { x: number; y: number } }): void => {
    m.particle.x = x;
    m.particle.y = y;
  };

  return {
    setQuality(profile) {
      fogLayers = profile.fogLayers;
      sprayOn = profile.fogSpray;
      rain.clear();
      snow.clear();
      spray.clear();
      applyFog();
    },
    setPalette(palette) {
      far.tint = palette.fog;
      near.tint = palette.fog;
      rainTint = palette.waterCrest;
    },
    setWeather(weather) {
      amounts = weather;
      rain.clear();
      snow.clear();
      applyFog();
    },
    resize(next) {
      vp = next;
      for (const fog of [far, near]) {
        fog.width = next.width;
        fog.height = next.height;
      }
      far.tileScale.set(Math.max(1.2, next.scale * 2.2));
      near.tileScale.set(Math.max(1.8, next.scale * 3.4));
      rain.clear();
      snow.clear();
    },
    update(dt, time, beamAngle, beam) {
      if (!vp) return;
      const { width, height } = vp;
      far.tilePosition.set(time * feel.fogSpeedFar, Math.sin(time * 0.05) * 20);
      near.tilePosition.set(time * feel.fogSpeedNear, time * feel.fogSpeedNear * 0.15);

      // Rain: fast streaks slanted by the wind, reused from the top when they fall off the bottom.
      const rainWanted = Math.min(Math.round(feel.rainDrops * amounts.rain), share());
      while (rain.count < rainWanted) {
        const m = rain.spawn();
        if (!m) break;
        placeDrop(Math.random() * width * 1.2, Math.random() * height, m);
        m.vy = 520 + Math.random() * 200;
        m.vx = -m.vy * 0.18;
        m.particle.rotation = Math.atan2(-m.vx, m.vy);
        m.particle.alpha = 0.14 + Math.random() * 0.16;
        m.particle.tint = rainTint;
      }
      let extraRain = rain.count - rainWanted;
      rain.update((m) => {
        if (extraRain > 0) {
          extraRain--;
          return false;
        }
        m.particle.x += m.vx * dt;
        m.particle.y += m.vy * dt;
        if (m.particle.y > height + 20) placeDrop(Math.random() * width * 1.2, -20, m);
        return true;
      });

      // Snow: slow flakes swaying side to side.
      const snowWanted = Math.min(Math.round(feel.snowFlakes * amounts.snow), share() - rain.count);
      while (snow.count < snowWanted) {
        const m = snow.spawn();
        if (!m) break;
        placeDrop(Math.random() * width, Math.random() * height, m);
        m.vy = 22 + Math.random() * 30;
        m.a = Math.random() * Math.PI * 2;
        const size = 0.5 + Math.random() * 0.8;
        m.particle.scaleX = size;
        m.particle.scaleY = size;
        m.particle.alpha = 0.25 + Math.random() * 0.35;
      }
      let extraSnow = snow.count - snowWanted;
      snow.update((m) => {
        if (extraSnow > 0) {
          extraSnow--;
          return false;
        }
        m.particle.y += m.vy * dt;
        m.particle.x += Math.sin(time * 0.9 + m.a) * 14 * dt - 6 * dt;
        if (m.particle.y > height + 10) placeDrop(Math.random() * width, -10, m);
        return true;
      });

      // Spray: specks drifting inside the beam, fading in and out (High quality).
      const sprayWanted = sprayOn ? Math.min(SPRAY_COUNT, share() - rain.count - snow.count) : 0;
      while (spray.count < sprayWanted) {
        const m = spray.spawn();
        if (!m) break;
        const d = beam.range * (0.2 + Math.random() * 0.7);
        const a = beamAngle + (Math.random() * 2 - 1) * beam.halfAngle * 0.9;
        m.particle.x = Math.cos(a) * d;
        m.particle.y = Math.sin(a) * d;
        m.vx = (Math.random() - 0.5) * 3;
        m.vy = -1 - Math.random() * 3;
        m.life = 1.5 + Math.random() * 2;
        m.particle.tint = PALETTE.lampHot;
        const size = 0.15 + Math.random() * 0.2;
        m.particle.scaleX = size;
        m.particle.scaleY = size;
      }
      spray.update((m) => {
        m.age += dt;
        if (m.age >= m.life || spray.count > sprayWanted) return false;
        m.particle.x += m.vx * dt;
        m.particle.y += m.vy * dt;
        const off = Math.atan2(m.particle.y, m.particle.x) - beamAngle;
        const inBeam = Math.abs(Math.atan2(Math.sin(off), Math.cos(off))) < beam.halfAngle;
        const t = m.age / m.life;
        m.particle.alpha = inBeam ? Math.sin(t * Math.PI) * 0.7 : 0;
        return true;
      });
    },
    destroy() {
      rain.destroy();
      snow.destroy();
      spray.destroy();
      far.destroy();
      near.destroy();
    },
  };
}
