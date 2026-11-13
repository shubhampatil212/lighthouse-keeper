/**
 * The debug panel (?debug, or the backtick key): its settings, the campaign and sound sections, and
 * how its switches feed back into the player's settings.
 */
import type { Progress } from './progress';
import { unlockAll } from './progress';
import type { Store } from './store';
import type { GameAudio } from '../audio';
import type { GameSettings } from '../data/uiTypes';
import type { PlayScene } from '../scenes/play';
import { createDebugCampaign } from '../ui/debugCampaign';
import { createDebugPanel, type DebugPanel, type DebugSettings } from '../ui/debugPanel';
import { createDebugSound } from '../ui/debugSound';

/** The debug settings with the player's own settings (difficulty, controls, quality, colorblind) on top. */
export function withGame(d: DebugSettings, s: GameSettings): DebugSettings {
  return {
    ...d,
    difficulty: s.difficulty,
    style: s.beamControl,
    quality: s.quality,
    colorblind: s.colorblind,
  };
}

export interface DebugWiring {
  readonly panel: DebugPanel;
  /** The panel's current settings (seed, speed, overlays and so on). */
  settings(): DebugSettings;
}

export function wireDebug(options: {
  open: boolean;
  initial: DebugSettings;
  settings: Store<GameSettings>;
  progress: Store<Progress>;
  play: PlayScene;
  audio: GameAudio;
  rendererName: string;
  jump: (levelId: string) => void;
}): DebugWiring {
  const { settings, progress, play } = options;
  let current = options.initial;
  const panel = createDebugPanel(document.body, options.open, {
    onChange: (next) => {
      current = next;
      // The panel's difficulty, control style, quality and colorblind switches are player settings too.
      settings.update((s) => ({
        ...s,
        difficulty: next.difficulty,
        beamControl: next.style,
        quality: next.quality,
        colorblind: next.colorblind,
      }));
      play.applySettings(withGame(next, settings.get()));
    },
    onRestart: (newSeed) => {
      play.restart(newSeed);
    },
  });
  panel.addSection(
    createDebugCampaign({
      unlockAll: () => {
        progress.update((p) => unlockAll(p, settings.get().difficulty));
      },
      jump: options.jump,
    }),
  );
  panel.addSection(createDebugSound(options.audio, () => panel.open));
  panel.setRenderer(options.rendererName);
  play.attachDebugPanel(panel);
  return {
    panel,
    settings: () => current,
  };
}
