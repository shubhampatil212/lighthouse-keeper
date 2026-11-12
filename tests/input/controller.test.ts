import { beforeEach, describe, expect, it } from 'vitest';
import { CONTROLS } from '../../src/data';
import { createInputController, type InputController, type PointerSurface } from '../../src/input';

/** A stand-in canvas: an EventTarget with a bounding box at (0, 0). */
class FakeCanvas extends EventTarget implements PointerSurface {
  getBoundingClientRect() {
    return { left: 0, top: 0 };
  }
}

const center = { centerX: 100, centerY: 100 };
const beam = { angle: 0, target: 0 };

function pointer(type: string, x: number, y: number, extra: Record<string, unknown> = {}): Event {
  return Object.assign(new Event(type), {
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'touch',
    ...extra,
  });
}
const key = (type: string, k: string): Event =>
  Object.assign(new Event(type), { key: k, repeat: false });

let canvas: FakeCanvas;
let keys: EventTarget;
let input: InputController;

beforeEach(() => {
  canvas = new FakeCanvas();
  keys = new EventTarget();
  input = createInputController(canvas, keys, () => center, CONTROLS);
});

describe('follow finger', () => {
  it('aims at a touch and holds the aim after the finger lifts', () => {
    canvas.dispatchEvent(pointer('pointerdown', 100, 0));
    expect(input.read(beam).aimAngle).toBeCloseTo(-Math.PI / 2);
    canvas.dispatchEvent(pointer('pointerup', 100, 0));
    expect(input.read(beam).aimAngle).toBeNull();
  });

  it('follows a hovering mouse but ignores a hovering touch', () => {
    canvas.dispatchEvent(pointer('pointermove', 200, 100, { pointerType: 'mouse' }));
    expect(input.read(beam).aimAngle).toBeCloseTo(0);
    canvas.dispatchEvent(pointer('pointermove', 0, 100));
    expect(input.read(beam).aimAngle).toBeNull();
  });

  it('listens to one finger only', () => {
    canvas.dispatchEvent(pointer('pointerdown', 200, 100));
    canvas.dispatchEvent(pointer('pointerdown', 0, 100, { pointerId: 2 }));
    expect(input.read(beam).aimAngle).toBeCloseTo(0);
  });
});

describe('drag to rotate', () => {
  it('turns the target by the angle the finger sweeps around the island', () => {
    input.style = 'drag';
    canvas.dispatchEvent(pointer('pointerdown', 200, 100)); // angle 0: just grabs
    expect(input.read(beam).aimAngle).toBeNull();
    canvas.dispatchEvent(pointer('pointermove', 100, 200)); // swept to PI/2
    expect(input.read({ angle: 0, target: 0.5 }).aimAngle).toBeCloseTo(0.5 + Math.PI / 2);
  });

  it('ignores a hovering mouse', () => {
    input.style = 'drag';
    canvas.dispatchEvent(pointer('pointermove', 200, 100, { pointerType: 'mouse' }));
    canvas.dispatchEvent(pointer('pointermove', 100, 200, { pointerType: 'mouse' }));
    expect(input.read(beam).aimAngle).toBeNull();
  });
});

describe('keyboard', () => {
  it('turns continuously while an arrow is held and stops on release', () => {
    keys.dispatchEvent(key('keydown', 'ArrowRight'));
    expect(input.read({ angle: 1, target: 1 }).aimAngle).toBeCloseTo(1 + CONTROLS.keyboardLead);
    expect(input.read({ angle: 1.1, target: 1 }).aimAngle).toBeCloseTo(1.1 + CONTROLS.keyboardLead);
    keys.dispatchEvent(key('keyup', 'ArrowRight'));
    expect(input.read({ angle: 1.2, target: 1.5 }).aimAngle).toBeCloseTo(1.2);
    expect(input.read({ angle: 1.2, target: 1.2 }).aimAngle).toBeNull();
  });

  it('reports a pause press once', () => {
    keys.dispatchEvent(key('keydown', 'Escape'));
    expect(input.read(beam).pause).toBe(true);
    expect(input.read(beam).pause).toBe(false);
  });
});

it('stops listening after dispose', () => {
  input.dispose();
  canvas.dispatchEvent(pointer('pointerdown', 100, 0));
  keys.dispatchEvent(key('keydown', 'Escape'));
  expect(input.read(beam)).toMatchObject({ aimAngle: null, pause: false });
});
