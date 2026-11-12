import { describe, expect, it } from 'vitest';
import { createSceneManager, instantTransition, type Scene } from '../src/app/sceneManager';
import { computeViewport, NO_INSETS } from '../src/app/viewport';
import { VIEWPORT } from '../src/data/viewport';

const viewport = computeViewport(
  { width: 390, height: 844, insets: NO_INSETS, devicePixelRatio: 1, maxPixelRatio: 1 },
  VIEWPORT,
);

function recorder(log: string[], name: string): Scene {
  return {
    enter: (params) => log.push(`${name}.enter ${JSON.stringify(params)}`),
    exit: () => log.push(`${name}.exit`),
    update: () => log.push(`${name}.update`),
    render: () => log.push(`${name}.render`),
    resize: () => log.push(`${name}.resize`),
  };
}

function setup(): { log: string[]; scenes: ReturnType<typeof createSceneManager> } {
  const log: string[] = [];
  const scenes = createSceneManager(instantTransition, () => viewport);
  for (const name of ['title', 'map', 'play']) scenes.register(name, recorder(log, name));
  return { log, scenes };
}

describe('createSceneManager', () => {
  it('exits the old scene before entering the new one, passing params', async () => {
    const { log, scenes } = setup();
    await scenes.go('title');
    await scenes.go('play', { level: '1-2' });
    expect(log).toEqual([
      'title.resize',
      'title.enter {}',
      'title.exit',
      'play.resize',
      'play.enter {"level":"1-2"}',
    ]);
    expect(scenes.currentName).toBe('play');
  });

  it('goes back through the stack with the original params', async () => {
    const { log, scenes } = setup();
    await scenes.go('title');
    await scenes.go('map', { region: 2 });
    await scenes.go('play');
    log.length = 0;
    expect(await scenes.back()).toBe(true);
    expect(scenes.currentName).toBe('map');
    expect(log).toContain('map.enter {"region":2}');
    expect(await scenes.back()).toBe(true);
    expect(scenes.currentName).toBe('title');
    expect(scenes.canGoBack).toBe(false);
    expect(await scenes.back()).toBe(false);
  });

  it('does not push to the back stack when replacing', async () => {
    const { scenes } = setup();
    await scenes.go('title');
    await scenes.go('map', {}, { replace: true });
    expect(scenes.canGoBack).toBe(false);
  });

  it('only updates and renders the current scene', async () => {
    const { log, scenes } = setup();
    await scenes.go('title');
    await scenes.go('play');
    log.length = 0;
    scenes.update(1 / 60);
    scenes.render(0.5);
    expect(log).toEqual(['play.update', 'play.render']);
  });

  it('runs rapid switches in order', async () => {
    const { log, scenes } = setup();
    await Promise.all([scenes.go('title'), scenes.go('map'), scenes.go('play')]);
    expect(log.filter((l) => l.endsWith('.enter {}') || l.endsWith('.exit'))).toEqual([
      'title.enter {}',
      'title.exit',
      'map.enter {}',
      'map.exit',
      'play.enter {}',
    ]);
  });

  it('rejects unknown and duplicate scenes', () => {
    const { scenes } = setup();
    expect(() => scenes.go('nowhere')).toThrow();
    expect(() => {
      scenes.register('title', recorder([], 'x'));
    }).toThrow();
  });
});
