/**
 * Phone browser habits that get in a game's way: the long-press menu on the sea, pinch-zoom on iOS
 * (which ignores the viewport's no-zoom hint), double-tap zoom, and dragging the canvas as an image.
 * CSS (base.css) already stops pull-to-refresh, page scrolling and text selection.
 */
export function guardMobileGestures(stage: HTMLElement): () => void {
  const block = (event: Event): void => {
    event.preventDefault();
  };
  // iOS Safari's own pinch gesture events (not in TypeScript's DOM types, so added by name).
  const gestures = ['gesturestart', 'gesturechange', 'gestureend'];
  stage.addEventListener('contextmenu', block);
  stage.addEventListener('dragstart', block);
  stage.addEventListener('dblclick', block);
  for (const name of gestures) document.addEventListener(name, block, { passive: false });
  return () => {
    stage.removeEventListener('contextmenu', block);
    stage.removeEventListener('dragstart', block);
    stage.removeEventListener('dblclick', block);
    for (const name of gestures) document.removeEventListener(name, block);
  };
}
