/**
 * Layer 6, the darkness. Each frame a low-resolution "light map" is painted: the night color
 * everywhere, blended toward the light color wherever light falls (the beam cone with soft edges, the
 * island glow, the lamp spilling down the tower, buoys, and small pools under lanterns), plus the second
 * lighthouse's cone and glow. Behind each fog band the beam is cut back to the shorter range it reaches
 * through fog (a night-colored shadow drawn over the cones; the second lighthouse's cone and its shadow
 * are drawn as their own group, so each lamp's shadow only darkens its own cone). It's feathered by blur on Medium and High,
 * and on High a slow noise makes the light "breathe". The light map is then multiplied over everything
 * below it: lit areas keep their colors, the rest sinks into the night. A flare or lightning floods it
 * (warm for a flare, cold white for lightning).
 */
import {
  AlphaFilter,
  BlurFilter,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
  TilingSprite,
  type Renderer,
} from 'pixi.js';
import type { Viewport } from '../app/viewport';
import type { QualityProfile, RegionPalette, RenderFeelConfig } from '../data/types';
import type { BeamStats } from '../sim/beam';
import type { FogBand } from '../sim/fog';
import type { ArtProvider, Point } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';
import { addFogShadow } from './fogShadow';
import { rgb } from './palette';

export { beamReachThroughFog } from './fogShadow';

/** The second lighthouse, as the light map needs it. */
export interface SecondLampLight extends Point {
  angle: number;
  glowRadius: number;
}

export interface LightMapFrame {
  beamAngle: number;
  beam: BeamStats;
  buoys: readonly (Point & { radius: number })[];
  /** Lantern positions on the water (world units). */
  lanterns: readonly Point[];
  /** Light the whole map (a flare, lightning, or the debug ship parade). */
  mapLit: boolean;
  /** Color of that map-wide light (0xRRGGBB); left out = the region's light color. */
  floodColor?: number;
  lamp2: SecondLampLight | null;
  fog: readonly FogBand[];
  /** The beam reaches this fraction of its range through fog. */
  fogRangeFactor: number;
  time: number;
}

export interface LightMap {
  /** The darkness itself: add it to the darkness layer (screen space). */
  readonly sprite: Sprite;
  setQuality(profile: QualityProfile): void;
  setPalette(palette: RegionPalette): void;
  resize(vp: Viewport): void;
  /** Camera shake, in CSS px. */
  setOffset(x: number, y: number): void;
  draw(frame: LightMapFrame): void;
  destroy(): void;
}

export function createLightMap(
  renderer: Renderer,
  art: ArtProvider,
  feel: RenderFeelConfig,
): LightMap {
  const { textures } = art;
  const target = RenderTexture.create({ width: 2, height: 2, resolution: feel.lightMapResolution });
  const sprite = new Sprite({ texture: target, label: 'darkness', blendMode: 'multiply' });

  const scene = new Container({ label: 'lightScene' });
  const world = new Container({ label: 'lightWorld' });
  const lights = new Container({ label: 'lights' });
  world.addChild(lights);
  const breath = new TilingSprite({
    texture: textures.breath,
    width: 2,
    height: 2,
    blendMode: 'multiply',
  });
  scene.addChild(world, breath);

  const glowSprite = (texture = textures.glow): Sprite => new Sprite({ texture, anchor: 0.5 });
  const cone = new Sprite({ label: 'cone' });
  const cone2 = new Sprite({ label: 'cone2' });
  const island = glowSprite(textures.pool);
  const island2 = glowSprite(textures.pool);
  const tower = glowSprite();
  const lamp = glowSprite();
  // The flood sits outside the tinted lights so lightning can be cold white and a flare warm.
  const flood = new Graphics({ label: 'flood' }).rect(-4000, -4000, 8000, 8000).fill(0xffffff);
  const fogShadow = new Graphics({ label: 'fogShadow' });
  // The second lamp's cone and shadow. When both fog and a second lamp are out, the group is drawn on
  // its own (a filter) and the shadow erases the cone, so neither lamp's shadow darkens the other cone.
  const fogShadow2 = new Graphics({ label: 'fogShadow2', blendMode: 'erase' });
  const lamp2Group = new Container({ label: 'secondCone' });
  lamp2Group.addChild(cone2, fogShadow2);
  const isolate = new AlphaFilter({ alpha: 1, resolution: 'inherit' });
  const buoys = new Container({ label: 'buoyLights' });
  const lanterns = new Container({ label: 'lanternPools' });
  // Cones first, then the fog shadow over them, then the glows and pools it must never hide.
  lights.addChild(tower, lamp, cone, fogShadow, lamp2Group, island, island2, buoys, lanterns);
  world.addChild(flood);

  const { lampPoint, towerBase, towerHeight } = art.island;
  tower.position.set(towerBase.x, towerBase.y - towerHeight / 2);
  tower.scale.set(14 / GLOW_TEXTURE_RADIUS, (towerHeight / 2 + 12) / GLOW_TEXTURE_RADIUS);
  tower.alpha = 0.6;
  lamp.position.set(lampPoint.x, lampPoint.y);
  lamp.scale.set(16 / GLOW_TEXTURE_RADIUS);

  const blur = new BlurFilter({ strength: 4, quality: 1, resolution: 'inherit' });
  let blurOn = false;
  let breathOn = false;
  let clear: [number, number, number, number] = [0, 0, 0, 1];
  let lightColor = 0xffffff;
  /** The night color divided by the light tint, so the shadow comes out as plain night once tinted. */
  let shadowColor = 0x000000;
  let vp: Viewport | null = null;
  let offsetX = 0;
  let offsetY = 0;

  const sync = (box: Container, count: number, texture = textures.glow): Sprite[] => {
    while (box.children.length < count) box.addChild(glowSprite(texture));
    const children = box.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child) child.visible = i < count;
    }
    return children as Sprite[];
  };
  const islandLamp = { x: 0, y: 0, angle: 0 };
  let isolated = false;

  const place = (): void => {
    if (!vp) return;
    world.position.set(vp.centerX + offsetX, vp.centerY + offsetY);
    world.scale.set(vp.scale);
  };

  return {
    sprite,
    setQuality(profile) {
      blurOn = profile.darknessBlurPasses > 0;
      blur.quality = Math.max(1, profile.darknessBlurPasses);
      lights.filters = blurOn ? [blur] : [];
      breathOn = profile.darknessNoise;
      breath.visible = breathOn;
    },
    setPalette(palette) {
      const [r, g, b] = rgb(palette.night);
      clear = [r, g, b, 1];
      // The container's tint colors every light inside it.
      lights.tint = palette.light;
      lightColor = palette.light;
      const [lr, lg, lb] = rgb(palette.light);
      const ch = (n: number, l: number): number =>
        Math.round(Math.min(1, n / Math.max(l, 0.01)) * 255);
      shadowColor = (ch(r, lr) << 16) | (ch(g, lg) << 8) | ch(b, lb);
    },
    resize(next) {
      vp = next;
      target.resize(next.width, next.height, next.resolution * feel.lightMapResolution);
      breath.width = next.width;
      breath.height = next.height;
      breath.tileScale.set(Math.max(1, next.scale * 1.6));
      blur.strength = Math.max(2, 3.5 * next.scale);
      place();
    },
    setOffset(x, y) {
      offsetX = x;
      offsetY = y;
      place();
    },
    draw(frame) {
      if (!vp) return;
      const { beam } = frame;
      const shape = art.beamCone(beam.halfAngle, feel.beamHaloWidth, feel.beamHalo);
      if (cone.texture !== shape.texture) {
        cone.texture = shape.texture;
        cone.anchor.set(shape.anchorX, shape.anchorY);
      }
      cone.scale.set(
        (shape.reach * beam.range) / shape.texture.width,
        (shape.heightPerRange * beam.range) / shape.texture.height,
      );
      cone.rotation = frame.beamAngle;
      cone.alpha = feel.beamLight;

      island.scale.set((beam.glowRadius * 1.25) / GLOW_TEXTURE_RADIUS);
      island.alpha = feel.islandLight;

      const second = frame.lamp2;
      cone2.visible = second !== null;
      island2.visible = second !== null;
      if (second) {
        if (cone2.texture !== shape.texture) {
          cone2.texture = shape.texture;
          cone2.anchor.set(shape.anchorX, shape.anchorY);
        }
        cone2.scale.copyFrom(cone.scale);
        cone2.position.set(second.x, second.y);
        cone2.rotation = second.angle;
        cone2.alpha = feel.beamLight;
        island2.position.set(second.x, second.y);
        island2.scale.set((second.glowRadius * 1.25) / GLOW_TEXTURE_RADIUS);
        island2.alpha = feel.islandLight;
      }

      fogShadow.clear();
      fogShadow2.clear();
      const fogged = frame.fog.length > 0;
      const spread = beam.halfAngle * feel.beamHaloWidth * 1.2;
      if (fogged) {
        islandLamp.angle = frame.beamAngle;
        addFogShadow(fogShadow, islandLamp, beam, spread, frame.fog, frame.fogRangeFactor);
        fogShadow.fill({ color: shadowColor, alpha: 0.96 });
      }
      const split = fogged && second !== null;
      if (split) {
        addFogShadow(fogShadow2, second, beam, spread, frame.fog, frame.fogRangeFactor);
        fogShadow2.fill({ color: 0xffffff, alpha: 0.96 });
      }
      fogShadow2.visible = split;
      if (split !== isolated) {
        isolated = split;
        lamp2Group.filters = split ? [isolate] : [];
      }

      const buoySprites = sync(buoys, frame.buoys.length, textures.pool);
      for (let i = 0; i < frame.buoys.length; i++) {
        const buoy = frame.buoys[i];
        const s = buoySprites[i];
        if (!s || !buoy) continue;
        s.position.set(buoy.x, buoy.y);
        s.scale.set((buoy.radius * 1.25) / GLOW_TEXTURE_RADIUS);
        s.alpha = feel.buoyLight;
      }
      const lanternSprites = sync(lanterns, frame.lanterns.length);
      for (let i = 0; i < frame.lanterns.length; i++) {
        const p = frame.lanterns[i];
        const s = lanternSprites[i];
        if (!s || !p) continue;
        s.position.set(p.x, p.y);
        s.scale.set(feel.lanternPoolRadius / GLOW_TEXTURE_RADIUS);
        s.alpha = feel.lanternLight;
      }
      flood.visible = frame.mapLit;
      flood.tint = frame.floodColor ?? lightColor;

      if (breathOn) {
        breath.tilePosition.set(
          Math.sin(frame.time * feel.beamBreathSpeed) * 40 + frame.time * 6,
          Math.cos(frame.time * feel.beamBreathSpeed * 0.7) * 30 + frame.time * 3,
        );
        // The noise texture runs from 0.72 to 1, so this alpha darkens the light by at most beamBreath.
        breath.alpha = Math.min(1, feel.beamBreath / 0.28);
      }

      renderer.render({ container: scene, target, clear: true, clearColor: clear });
    },
    destroy() {
      scene.destroy({ children: true });
      sprite.destroy();
      target.destroy(true);
      blur.destroy();
      isolate.destroy();
    },
  };
}
