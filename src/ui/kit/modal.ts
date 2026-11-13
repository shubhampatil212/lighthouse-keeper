/**
 * Modal dialogs. They stack (Settings opened from Pause sits on top of it); Esc or back closes the
 * top one. Focus moves into the dialog, Tab stays inside it, and returns where it was on close.
 */
import { STRINGS } from '../strings';
import { focusables, h, type Child } from './dom';
import { iconButton } from './controls';

export interface ModalOptions {
  title: string;
  /** Extra class on the dialog box. */
  className?: string;
  /** Show a close (×) button. Esc and back close the dialog either way, unless `onBack` is set. */
  closable?: boolean;
  /** Handles Esc / back instead of closing (Pause resumes the night). */
  onBack?: () => boolean;
  onClose?: () => void;
}

export interface Modal {
  readonly element: HTMLElement;
  close(): void;
}

const open: { modal: Modal; options: ModalOptions }[] = [];

/** Closes (or lets handle back) the top dialog. Returns false if none is open. */
export function closeTopModal(): boolean {
  const top = open[open.length - 1];
  if (!top) return false;
  if (top.options.onBack) return top.options.onBack();
  top.modal.close();
  return true;
}

export function openModal(parent: HTMLElement, options: ModalOptions, ...content: Child[]): Modal {
  const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const titleId = `modal-title-${open.length + 1}-${Date.now()}`;
  const box = h(
    'div',
    {
      className: `ui-modal__box ${options.className ?? ''}`,
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        tabindex: '-1',
      },
    },
    h('h2', { id: titleId, className: 'ui-modal__title', textContent: options.title }),
    ...content,
  );
  const element = h('div', { className: 'ui-modal' }, box);
  let closed = false;
  const modal: Modal = {
    element,
    close() {
      if (closed) return;
      closed = true;
      const i = open.findIndex((m) => m.modal === modal);
      if (i >= 0) open.splice(i, 1);
      element.remove();
      options.onClose?.();
      returnFocus?.focus();
    },
  };
  if (options.closable) {
    box.prepend(
      iconButton(
        'close',
        STRINGS.close,
        () => {
          modal.close();
        },
        'ui-modal__close',
      ),
    );
  }
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = focusables(box);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  parent.append(element);
  open.push({ modal, options });
  (focusables(box).find((el) => !el.classList.contains('ui-modal__close')) ?? box).focus();
  return modal;
}
