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
  /**
   * Back (Esc or the browser's back button) inside the scene: close a panel, open pause.
   * Returns true if it handled it; otherwise the scene manager goes back a screen.
   */
  back?(): boolean;
}

/** Runs `swap` at the midpoint of a visual transition and resolves when it has finished. */
export type Transition = (swap: () => void) => Promise<void>;

export const instantTransition: Transition = (swap) => {
  swap();
  return Promise.resolve();
};

export interface StackEntry {
  name: string;
  params: SceneParams;
}

export interface SceneManager {
  register(name: string, scene: Scene): void;
  /**
   * Switch to a scene. The current one goes on the back stack unless `replace` is true;
   * `stack` replaces the whole back stack (for example Results → Map with Title under it).
   */
  go(
    name: string,
    params?: SceneParams,
    options?: { replace?: boolean; stack?: readonly StackEntry[] },
  ): Promise<void>;
  /** The scene showing now. */
  readonly current: Scene | null;
  /** Return to the previous scene. Resolves to false if there is nowhere to go back to. */
  back(): Promise<boolean>;
  readonly currentName: string | null;
  readonly canGoBack: boolean;
  /** Calls `listener` each time a scene is entered (audio picks its music this way). */
  onEnter(listener: (name: string, params: SceneParams) => void): void;
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
  const enterListeners: ((name: string, params: SceneParams) => void)[] = [];

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
      for (const listener of enterListeners) listener(entry.name, entry.params);
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
        if (options.stack) stack.splice(0, stack.length, ...options.stack);
        else if (current && !options.replace) {
          stack.push({ name: current.name, params: current.params });
        }
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
    get current() {
      return current?.scene ?? null;
    },
    get currentName() {
      return current?.name ?? null;
    },
    get canGoBack() {
      return stack.length > 0;
    },
    onEnter(listener) {
      enterListeners.push(listener);
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
