/**
 * One module per screen (boot, title, difficulty, map, levelSelect, briefing, play, results,
 * endlessResults, shop, logbook, settings, credits), each a Scene registered with the SceneManager.
 * Pause is an overlay inside play. Screen names live in context.ts.
 */
export { SCENE, type GameContext, type SceneName } from './context';
