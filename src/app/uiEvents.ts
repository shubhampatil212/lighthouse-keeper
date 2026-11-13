/**
 * Events from the screens (not the simulation): button taps, back, buying, stars landing on the
 * results screen. Audio listens to these the same way it listens to simulation events.
 */
export type UiEvent =
  | { type: 'tap' }
  | { type: 'back' }
  | { type: 'buy' }
  /** The results screen's star `n` (1–3) has just landed. */
  | { type: 'star'; n: number };

type Listener = (event: UiEvent) => void;
const listeners = new Set<Listener>();

export function emitUi(event: UiEvent): void {
  for (const listener of listeners) listener(event);
}

/** Calls `listener` for every UI event; returns a function that stops listening. */
export function onUi(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
