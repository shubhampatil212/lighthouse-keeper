/**
 * Layer 5, the island: cliffs, grass, jetty, the lighthouse and the buildings the campaign has added
 * (a list of flags for now). Windows and festival bulbs glow above the darkness.
 */
import { Container, Sprite } from 'pixi.js';
import type { IslandBuildingId } from '../data/types';
import type { ArtProvider } from './art/types';
import { GLOW_TEXTURE_RADIUS } from './art/types';

export interface IslandView {
  setBuildings(ids: readonly IslandBuildingId[]): void;
  draw(time: number): void;
  destroy(): void;
}

/** Radius of a window's glow, world units. */
const WINDOW_GLOW = 5;

export function createIslandView(
  art: ArtProvider,
  islandLayer: Container,
  lightLayer: Container,
  radius: number,
): IslandView {
  const root = new Container({ label: 'islandView', sortableChildren: true });
  const ground = art.island.createGround(radius);
  ground.zIndex = -1000;
  const tower = art.island.createTower();
  tower.zIndex = art.island.towerBase.y;
  root.addChild(ground, tower);
  islandLayer.addChild(root);

  const glows = new Container({ label: 'islandLights' });
  lightLayer.addChild(glows);

  let buildings: Container[] = [];
  let twinkles: { sprite: Sprite; phase: number; base: number }[] = [];

  return {
    setBuildings(ids) {
      for (const b of buildings) b.destroy();
      buildings = ids.map((id) => {
        const b = art.island.createBuilding(id);
        b.zIndex = b.y;
        root.addChild(b);
        return b;
      });
      for (const c of glows.removeChildren()) c.destroy();
      twinkles = ids.flatMap((id) =>
        art.island.buildingLights(id).map((p, i) => {
          const sprite = new Sprite({ texture: art.textures.glow, anchor: 0.5, blendMode: 'add' });
          sprite.position.set(p.x, p.y);
          sprite.tint = p.color;
          sprite.scale.set(WINDOW_GLOW / GLOW_TEXTURE_RADIUS);
          glows.addChild(sprite);
          return { sprite, phase: i * 1.3 + p.x * 0.1, base: id === 'festivalLights' ? 0.75 : 0.6 };
        }),
      );
    },
    draw(time) {
      for (const t of twinkles) t.sprite.alpha = t.base + Math.sin(time * 2.2 + t.phase) * 0.12;
    },
    destroy() {
      root.destroy({ children: true });
      glows.destroy({ children: true });
    },
  };
}
