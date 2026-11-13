/** The bar along the top of most screens: back button, title, and an optional item on the right. */
import { iconButton } from './kit/controls';
import { h, type Child } from './kit/dom';
import { STRINGS } from './strings';

export function screenHeader(title: string, onBack: () => void, right?: Child): HTMLElement {
  return h(
    'header',
    { className: 'screen-header' },
    iconButton('back', STRINGS.back, onBack, 'screen-header__back'),
    h('h1', { className: 'screen-header__title', textContent: title }),
    h('div', { className: 'screen-header__right' }, right),
  );
}
