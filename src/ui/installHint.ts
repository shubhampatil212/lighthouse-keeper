/**
 * The "Add to home screen" hint on the title (phones and tablets only, never once installed). On
 * Android Chrome it has an Install button that opens the browser's own prompt; on iPhone Safari it
 * says where Safari keeps the option. "Not now" hides it for good (remembered in the save).
 */
import { installRoute, onInstallChange, promptInstall } from '../app/pwa';
import { button } from './kit/controls';
import { h } from './kit/dom';
import { STRINGS } from './strings';

/** A slot that shows the hint whenever it applies. `onDismiss` remembers "Not now". */
export function installHint(dismissed: boolean, onDismiss: () => void): HTMLElement {
  const slot = h('div', { className: 'install-hint-slot' });
  const touch = matchMedia('(pointer: coarse)').matches;
  let closed = dismissed;

  const render = (): void => {
    const route = closed || !touch ? null : installRoute();
    if (!route) {
      slot.replaceChildren();
      return;
    }
    const close = button(
      STRINGS.installHintClose,
      () => {
        closed = true;
        onDismiss();
        render();
      },
      { variant: 'quiet' },
    );
    const install =
      route === 'prompt'
        ? button(
            STRINGS.installHintButton,
            () => {
              void promptInstall().then(render);
            },
            { variant: 'secondary' },
          )
        : null;
    slot.replaceChildren(
      h(
        'aside',
        { className: 'install-hint', attrs: { 'aria-label': STRINGS.installHintButton } },
        h('p', {
          textContent: route === 'prompt' ? STRINGS.installHintPrompt : STRINGS.installHintIos,
        }),
        h('div', { className: 'install-hint__actions' }, install, close),
      ),
    );
  };

  render();
  // The browser's install offer can arrive a moment after the title shows.
  const stop = onInstallChange(() => {
    if (slot.isConnected) render();
    else stop();
  });
  return slot;
}
