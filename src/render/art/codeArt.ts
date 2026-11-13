/** The default ArtProvider: every shape and texture drawn in code. Swap this object to bring in sprites. */
import { createIslandArt } from './island';
import { createReefArt } from './reefs';
import { createShipArt } from './ships';
import { createBeamCone, createTextures } from './textures';
import type { ArtProvider, BeamConeTexture } from './types';

/** Cones kept at once (the light map's and the glow in the air, plus room for an upgrade change). */
const CONE_CACHE_SIZE = 4;

export function createCodeArt(): ArtProvider {
  const textures = createTextures();
  const ships = createShipArt();
  const cones = new Map<string, BeamConeTexture>();
  return {
    textures,
    ships,
    reefs: createReefArt(),
    island: createIslandArt(),
    beamCone(halfAngle, haloWidth, halo) {
      const key = `${halfAngle}:${haloWidth}:${halo}`;
      let cone = cones.get(key);
      if (!cone) {
        const oldestKey = cones.keys().next().value;
        if (cones.size >= CONE_CACHE_SIZE && oldestKey !== undefined) {
          cones.get(oldestKey)?.texture.destroy(true);
          cones.delete(oldestKey);
        }
        cone = createBeamCone(halfAngle, haloWidth, halo);
        cones.set(key, cone);
      }
      return cone;
    },
    destroy() {
      ships.destroy();
      for (const cone of cones.values()) cone.texture.destroy(true);
      cones.clear();
      for (const name of Object.keys(textures) as (keyof typeof textures)[]) {
        textures[name].destroy(true);
      }
    },
  };
}
