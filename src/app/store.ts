/** A tiny observable value: settings and progress live in one each, and screens listen for changes. */
export interface Store<T> {
  get(): T;
  set(next: T): void;
  update(change: (current: T) => T): void;
  /** Calls `listener` on every change; returns a function that stops listening. */
  subscribe(listener: (value: T) => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  const set = (next: T): void => {
    if (next === value) return;
    value = next;
    for (const listener of [...listeners]) listener(value);
  };
  return {
    get: () => value,
    set,
    update(change) {
      set(change(value));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
