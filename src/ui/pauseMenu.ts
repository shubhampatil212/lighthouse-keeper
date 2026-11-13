/**
 * Pause (docs/SCREENS.md): Resume · Restart · Settings · Quit to map, over the frozen, dimmed night.
 * Back or Esc resumes. Settings opens on top and returns here.
 */
import { button } from './kit/controls';
import { h } from './kit/dom';
import { openModal, type Modal } from './kit/modal';
import { STRINGS } from './strings';

export interface PauseHandlers {
  resume(): void;
  restart(): void;
  quit(): void;
  /** Builds the settings panel shown from Pause. */
  settingsPanel(): HTMLElement;
}

export interface PauseMenu {
  readonly open: boolean;
  show(): void;
  hide(): void;
}

export function createPauseMenu(parent: HTMLElement, handlers: PauseHandlers): PauseMenu {
  let modal: Modal | null = null;
  let closingByCode = false;

  const hide = (): void => {
    closingByCode = true;
    modal?.close();
    closingByCode = false;
    modal = null;
  };

  return {
    get open() {
      return modal !== null;
    },
    show() {
      if (modal) return;
      const resume = button(
        STRINGS.pauseResume,
        () => {
          handlers.resume();
        },
        { variant: 'primary', icon: 'play' },
      );
      const settings = button(
        STRINGS.pauseSettings,
        () => {
          openModal(
            parent,
            { title: STRINGS.settingsTitle, closable: true, className: 'ui-modal__box--wide' },
            handlers.settingsPanel(),
          );
        },
        { icon: 'gear' },
      );
      modal = openModal(
        parent,
        {
          title: STRINGS.pauseTitle,
          className: 'pause-menu',
          onBack: () => {
            handlers.resume();
            return true;
          },
          onClose: () => {
            if (!closingByCode) handlers.resume();
          },
        },
        h(
          'div',
          { className: 'menu-stack' },
          resume,
          button(
            STRINGS.pauseRestart,
            () => {
              handlers.restart();
            },
            { icon: 'restart' },
          ),
          settings,
          button(
            STRINGS.pauseQuit,
            () => {
              handlers.quit();
            },
            { variant: 'quiet', icon: 'anchor' },
          ),
        ),
      );
      modal.element.classList.add('pause-overlay');
    },
    hide,
  };
}
