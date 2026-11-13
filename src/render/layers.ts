/**
 * The drawing layers from docs/ART_AUDIO.md, bottom to top. The HUD (layer 10) is DOM, not Pixi.
 * World layers are placed so world (0,0) is the island and one unit = S pixels.
 * Screen layers (water, darkness, weather) are drawn in CSS pixels.
 */
import { Container } from 'pixi.js';
import type { Viewport } from '../app/viewport';

export const LAYER_ORDER = [
  'water',
  'seabed',
  'reefs',
  'ships',
  'island',
  'darkness',
  'lightFx',
  'weather',
  'effects',
] as const;

export type LayerName = (typeof LAYER_ORDER)[number];

const SCREEN_SPACE: ReadonlySet<LayerName> = new Set<LayerName>(['water', 'darkness', 'weather']);

export type Layers = Record<LayerName, Container>;

export function createLayers(stage: Container): Layers {
  const layers = {} as Layers;
  for (const name of LAYER_ORDER) {
    const layer = new Container({ label: name });
    stage.addChild(layer);
    layers[name] = layer;
  }
  return layers;
}

/** Places the world layers; `offsetX`/`offsetY` (CSS px) move them for camera shake. */
export function applyViewport(layers: Layers, vp: Viewport, offsetX = 0, offsetY = 0): void {
  for (const name of LAYER_ORDER) {
    if (SCREEN_SPACE.has(name)) continue;
    const layer = layers[name];
    layer.position.set(vp.centerX + offsetX, vp.centerY + offsetY);
    layer.scale.set(vp.scale);
  }
}

export function destroyLayers(layers: Layers): void {
  for (const name of LAYER_ORDER) layers[name].destroy({ children: true });
}
