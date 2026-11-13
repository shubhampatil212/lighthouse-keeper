/**
 * Pooled particles on a Pixi ParticleContainer (one draw call per texture). Every system takes from
 * one shared budget, so all particles on screen together stay under the quality level's cap. A spent
 * particle stays in the container, shrunk to nothing, until it's used again: adding and removing
 * particles would make Pixi rebuild the container's buffers.
 */
import { Particle, ParticleContainer, type Texture } from 'pixi.js';

export interface ParticleBudget {
  cap: number;
  used: number;
}

/** One particle plus the motion it needs. Positions and looks live on `particle`. */
export interface Mote {
  particle: Particle;
  vx: number;
  vy: number;
  spin: number;
  /** Seconds lived and seconds it lives for. */
  age: number;
  life: number;
  /** Free values for each system's own use (sway phase, start alpha and so on). */
  a: number;
  b: number;
}

export interface Particles {
  readonly container: ParticleContainer;
  readonly count: number;
  /** A fresh particle, or null when the shared budget is spent. */
  spawn(): Mote | null;
  /** Calls `step` for every live particle; those it returns false for are removed. */
  update(step: (mote: Mote) => boolean): void;
  clear(): void;
  destroy(): void;
}

export function createParticles(
  texture: Texture,
  budget: ParticleBudget,
  label: string,
): Particles {
  const container = new ParticleContainer({
    label,
    dynamicProperties: { position: true, rotation: true, vertex: true, color: true, uvs: false },
  });
  const live: Mote[] = [];
  const spare: Mote[] = [];

  const release = (mote: Mote): void => {
    const p = mote.particle;
    p.scaleX = 0;
    p.scaleY = 0;
    p.alpha = 0;
    spare.push(mote);
    budget.used--;
  };

  return {
    container,
    get count() {
      return live.length;
    },
    spawn() {
      if (budget.used >= budget.cap) return null;
      budget.used++;
      let mote = spare.pop();
      if (!mote) {
        mote = {
          particle: new Particle({ texture, anchorX: 0.5, anchorY: 0.5 }),
          vx: 0,
          vy: 0,
          spin: 0,
          age: 0,
          life: 1,
          a: 0,
          b: 0,
        };
        container.addParticle(mote.particle);
      }
      const p = mote.particle;
      p.rotation = 0;
      p.scaleX = 1;
      p.scaleY = 1;
      p.alpha = 1;
      p.tint = 0xffffff;
      mote.vx = 0;
      mote.vy = 0;
      mote.spin = 0;
      mote.age = 0;
      mote.life = 1;
      mote.a = 0;
      mote.b = 0;
      live.push(mote);
      return mote;
    },
    update(step) {
      for (let i = live.length - 1; i >= 0; i--) {
        const mote = live[i];
        if (!mote) continue;
        if (!step(mote)) {
          // Swap-remove: order doesn't matter, and it avoids shifting the whole list.
          const last = live.pop();
          if (last && last !== mote) live[i] = last;
          release(mote);
        }
      }
    },
    clear() {
      while (live.length > 0) {
        const mote = live.pop();
        if (mote) release(mote);
      }
    },
    destroy() {
      this.clear();
      container.destroy();
    },
  };
}
