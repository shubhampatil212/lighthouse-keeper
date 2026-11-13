/**
 * Collects pointer, touch and keyboard input and hands the simulation one Intents object per tick.
 * Two beam control styles: "follow" (the beam turns toward the finger or cursor) and "drag"
 * (the finger turns the beam like a dial). Either way, the simulation's turn-speed limit applies.
 */
import type { ControlStyle, ControlsConfig } from '../data/types';
import type { BeamState } from '../sim/beam';
import type { Intents } from '../sim/intents';
import { aimFromPointer, dialDelta, keyboardAim, type ScreenCenter } from './aim';

/** One-shot actions a button (or key) can ask for. */
export type ActionIntent = 'foghorn' | 'flare' | 'switchLamp' | 'pause';

export interface InputController {
  /** Call once per simulation tick. Button presses are used up by the read. */
  read(beam: Readonly<BeamState>): Intents;
  /** An on-screen button was pressed; the next read() carries it. */
  press(action: ActionIntent): void;
  style: ControlStyle;
  dispose(): void;
}

/** The parts of a canvas the controller uses (a real canvas in the game, a stand-in in tests). */
export interface PointerSurface extends EventTarget {
  getBoundingClientRect(): { left: number; top: number };
  setPointerCapture?(pointerId: number): void;
}

const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
// Esc is "back" everywhere (src/app/navigator.ts); in play, back opens Pause.
const PAUSE_KEYS = new Set(['p', 'P']);
/** Ability keys: H = horn, F = flare, Q = switch lamp. */
const ACTION_KEYS: Readonly<Record<string, ActionIntent>> = {
  h: 'foghorn',
  H: 'foghorn',
  f: 'flare',
  F: 'flare',
  q: 'switchLamp',
  Q: 'switchLamp',
};

export function createInputController(
  surface: PointerSurface,
  keys: EventTarget,
  center: () => ScreenCenter,
  config: ControlsConfig,
): InputController {
  let style: ControlStyle = config.defaultStyle;
  /** The pointer that's steering (one finger only), or null. */
  let activePointer: number | null = null;
  let pointerAim: number | null = null;
  let dragAngle: number | null = null;
  let dragSweep = 0;
  let left = false;
  let right = false;
  let keyReleased = false;
  const pressed = new Set<ActionIntent>();

  const angleAt = (event: PointerEvent): number | null => {
    const rect = surface.getBoundingClientRect();
    return aimFromPointer(
      center(),
      event.clientX - rect.left,
      event.clientY - rect.top,
      config.deadZonePx,
    );
  };

  const track = (event: PointerEvent): void => {
    const angle = angleAt(event);
    if (angle === null) return;
    if (style === 'follow') {
      pointerAim = angle;
    } else if (dragAngle === null) {
      dragAngle = angle;
    } else {
      dragSweep += dialDelta(dragAngle, angle);
      dragAngle = angle;
    }
  };

  const onDown = (e: Event): void => {
    const event = e as PointerEvent;
    if (activePointer !== null && event.pointerId !== activePointer) return;
    activePointer = event.pointerId;
    surface.setPointerCapture?.(event.pointerId);
    dragAngle = null;
    track(event);
  };
  const onMove = (e: Event): void => {
    const event = e as PointerEvent;
    const hovering = event.pointerType === 'mouse' && activePointer === null && style === 'follow';
    if (hovering || event.pointerId === activePointer) track(event);
  };
  const onUp = (e: Event): void => {
    if ((e as PointerEvent).pointerId !== activePointer) return;
    activePointer = null;
    dragAngle = null;
  };
  const onKeyDown = (e: Event): void => {
    const { key, repeat } = e as KeyboardEvent;
    if (LEFT_KEYS.has(key)) left = true;
    else if (RIGHT_KEYS.has(key)) right = true;
    else if (PAUSE_KEYS.has(key) && !repeat) pressed.add('pause');
    else if (key in ACTION_KEYS && !repeat) {
      const action = ACTION_KEYS[key];
      if (action) pressed.add(action);
    }
  };
  const onKeyUp = (e: Event): void => {
    const { key } = e as KeyboardEvent;
    if (LEFT_KEYS.has(key)) left = false;
    else if (RIGHT_KEYS.has(key)) right = false;
    else return;
    if (!left && !right) keyReleased = true;
  };
  const onBlur = (): void => {
    left = right = false;
    activePointer = null;
    dragAngle = null;
  };

  surface.addEventListener('pointerdown', onDown);
  surface.addEventListener('pointermove', onMove);
  surface.addEventListener('pointerup', onUp);
  surface.addEventListener('pointercancel', onUp);
  keys.addEventListener('keydown', onKeyDown);
  keys.addEventListener('keyup', onKeyUp);
  keys.addEventListener('blur', onBlur);

  return {
    read(beam) {
      let aimAngle: number | null = keyboardAim(left, right, beam.angle, config.keyboardLead);
      if (aimAngle === null && keyReleased) aimAngle = beam.angle; // stop where it is
      if (pointerAim !== null) aimAngle = pointerAim;
      if (dragSweep !== 0) aimAngle = beam.target + dragSweep;
      const intents: Intents = {
        aimAngle,
        foghorn: pressed.has('foghorn'),
        flare: pressed.has('flare'),
        switchLamp: pressed.has('switchLamp'),
        pause: pressed.has('pause'),
      };
      pointerAim = null;
      dragSweep = 0;
      keyReleased = false;
      pressed.clear();
      return intents;
    },
    press(action) {
      pressed.add(action);
    },
    get style() {
      return style;
    },
    set style(next) {
      style = next;
      pointerAim = null;
      dragAngle = null;
      dragSweep = 0;
    },
    dispose() {
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerup', onUp);
      surface.removeEventListener('pointercancel', onUp);
      keys.removeEventListener('keydown', onKeyDown);
      keys.removeEventListener('keyup', onKeyUp);
      keys.removeEventListener('blur', onBlur);
    },
  };
}
