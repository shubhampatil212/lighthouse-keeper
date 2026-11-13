/**
 * The second lighthouse (Lantern Archipelago): a smaller striped tower on its own rocky islet, always
 * visible because it stands in its own glow. When a level has two lamps, a soft pulsing ring on the
 * water marks the one the player is steering.
 */
import { Container, Graphics } from 'pixi.js';
import type { RenderFeelConfig } from '../data/types';
import type { ArtProvider, Point } from './art/types';
import { PALETTE } from './palette';

export interface SecondLampView {
  /** `lamp` = where the second tower stands (null = none); `active` = 0 island lamp, 1 second lamp. */
  draw(lamp: Point | null, isletRadius: number, active: number, time: number): void;
  destroy(): void;
}

export function createSecondLampView(
  art: ArtProvider,
  layers: { island: Container; lightFx: Container },
  feel: RenderFeelConfig,
): SecondLampView {
  const root = new Container({ label: 'secondLamp', visible: false });
  const tower = art.island.createTower();
  tower.scale.set(art.island.secondTowerScale);
  root.addChild(tower);
  layers.island.addChild(root);
  let islet: Container | null = null;
  let isletSize = 0;

  const marker = new Graphics({ label: 'activeLamp', blendMode: 'add' });
  layers.lightFx.addChild(marker);

  return {
    draw(lamp, isletRadius, active, time) {
      root.visible = lamp !== null;
      marker.clear();
      if (!lamp) return;
      if (!islet || isletSize !== isletRadius) {
        islet?.destroy({ children: true });
        islet = art.island.createIslet(isletRadius);
        isletSize = isletRadius;
        root.addChildAt(islet, 0);
      }
      root.position.set(lamp.x, lamp.y);

      // The ring around the steered lamp's base: big round the island, small round the islet.
      const at = active === 1 ? lamp : { x: 0, y: 0 };
      const r = active === 1 ? isletRadius + 6 : feel.activeLampRing;
      const pulse = 0.5 + 0.5 * Math.sin(time * 3);
      marker
        .ellipse(at.x, at.y + 2, r + pulse * 2, (r + pulse * 2) * 0.8)
        .stroke({ color: PALETTE.lamp, width: 1.4, alpha: 0.35 + pulse * 0.25 });
    },
    destroy() {
      root.destroy({ children: true });
      marker.destroy();
    },
  };
}
