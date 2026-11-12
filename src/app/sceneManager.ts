/**
 * Switches between screens (scenes). Keeps a back stack, calls enter/exit hooks,
 * and plays a transition (a fade) around each switch.
 */
import type { Viewport } from './viewport';

export type SceneParams = Readonly<Record<string, unknown>>;

export interface Scene {
  enter(params: SceneParams): void;
  exit(): void;
  /** One fixed simulation step. */
  update(dt: number): void;
  /** Draw; alpha is the interpolation between simulation steps. */
  render(alpha: number): void;
  resize?(vp: Viewport): void;
}

/** Runs `swap` at the midpoint of a visual transition and resolves when it has finished. */
export type Transition = (swap: () => void) => Promise<void>;

export const instantTransition: Transition = (swap) => {
  swap();
  return Promise.resolve();
};

interface StackEntry {
  name: string;
  params: SceneParams;
}

export interface SceneManager {
  register(name: string, scene: Scene): void;
  /** Switch to a scene. The current one goes on the back stack unless `replace` is true. */
  go(name: string, params?: SceneParams, options?: { replace?: boolean }): Promise<void>;
  /** Return to the previous scene. Resolves to false if there is nowhere to go back to. */
  back(): Promise<boolean>;
  readonly currentName: string | null;
  readonly canGoBack: boolean;
  update(dt: number): void;
  render(alpha: number): void;
  resize(vp: Viewport): void;
}

export function createSceneManager(
  transition: Transition,
  getViewport: () => Viewport,
): SceneManager {
  const scenes = new Map<string, Scene>();
  const stack: StackEntry[] = [];
  let current: (StackEntry & { scene: Scene }) | null = null;
  // Each switch waits for the one before it, so rapid taps can't interleave enter/exit calls.
  let queue: Promise<unknown> = Promise.resolve();

  const lookup = (name: string): Scene => {
    const scene = scenes.get(name);
    if (!scene) throw new Error(`Unknown scene "${name}"`);
    return scene;
  };

  const switchTo = (entry: StackEntry): Promise<void> => {
    const scene = lookup(entry.name);
    return transition(() => {
      current?.scene.exit();
      current = { ...entry, scene };
      scene.resize?.(getViewport());
      scene.enter(entry.params);
    });
  };

  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    register(name, scene) {
      if (scenes.has(name)) throw new Error(`Scene "${name}" is already registered`);
      scenes.set(name, scene);
    },
    go(name, params = {}, options = {}) {
      lookup(name);
      return enqueue(async () => {
        if (current && !options.replace) stack.push({ name: current.name, params: current.params });
        await switchTo({ name, params });
      });
    },
    back() {
      return enqueue(async () => {
        const previous = stack.pop();
        if (!previous) return false;
        await switchTo(previous);
        return true;
      });
    },
    get currentName() {
      return current?.name ?? null;
    },
    get canGoBack() {
      return stack.length > 0;
    },
    update(dt) {
      current?.scene.update(dt);
    },
    render(alpha) {
      current?.scene.render(alpha);
    },
    resize(vp) {
      current?.scene.resize?.(vp);
    },
  };
}
