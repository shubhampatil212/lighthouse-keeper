/**
 * One module per screen (title, map, levelSelect, briefing, play, pause, results, shop, settings,
 * logbook, credits), each a Scene registered with the SceneManager. Only `play` exists so far.
 */
export const SCENE = {
  play: 'play',
} as const;
