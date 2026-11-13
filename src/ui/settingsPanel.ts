/**
 * Every setting from docs/SCREENS.md, grouped as Sound, Display, Gameplay, Accessibility and Data.
 * Changes go straight into the settings store, so they apply at once. Used by the Settings screen
 * and by Settings opened from Pause.
 */
import { totalStars } from '../app/progress';
import type { SaveActions } from '../app/saveWiring';
import type { Store } from '../app/store';
import { pickFile } from '../save';
import type { DifficultyId, QualityChoice } from '../data/types';
import type { GameSettings } from '../data/uiTypes';
import { button, segmented, slider, toggle } from './kit/controls';
import { h, type Child } from './kit/dom';
import { openModal } from './kit/modal';
import { STRINGS } from './strings';

export interface SettingsPanelOptions {
  /** Export, import and reset. */
  data: SaveActions;
  toast(text: string): void;
  /** Where dialogs (the import check) open. */
  parent: HTMLElement;
  /** Mid-night, changing difficulty restarts the night: say so. */
  inNight?: boolean;
}

const section = (title: string, ...rows: Child[]): HTMLElement =>
  h('section', { className: 'settings-section' }, h('h2', { textContent: title }), ...rows);

export function createSettingsPanel(
  store: Store<GameSettings>,
  options: SettingsPanelOptions,
): HTMLElement {
  const s = store.get();
  const set =
    <K extends keyof GameSettings>(key: K) =>
    (value: GameSettings[K]): void => {
      store.update((current) => ({ ...current, [key]: value }));
    };

  const sound = section(
    STRINGS.settingsSound,
    slider(STRINGS.settingsMaster, s.master, set('master')),
    slider(STRINGS.settingsMusic, s.music, set('music')),
    slider(STRINGS.settingsEffects, s.effects, set('effects')),
    slider(STRINGS.settingsAmbience, s.ambience, set('ambience')),
    toggle(STRINGS.settingsMute, s.muted, set('muted')),
  );

  const display = section(
    STRINGS.settingsDisplay,
    segmented<QualityChoice>(
      STRINGS.settingsQuality,
      [
        ['low', STRINGS.qualityLow],
        ['medium', STRINGS.qualityMedium],
        ['high', STRINGS.qualityHigh],
        ['auto', STRINGS.qualityAuto],
      ],
      s.quality,
      set('quality'),
    ),
    toggle(STRINGS.settingsFps, s.showFps, set('showFps')),
    toggle(STRINGS.settingsShake, s.screenShake, set('screenShake')),
  );

  const gameplay = section(
    STRINGS.settingsGameplay,
    segmented<DifficultyId>(
      STRINGS.settingsDifficulty,
      [
        ['calm', STRINGS.difficultyName.calm],
        ['keeper', STRINGS.difficultyName.keeper],
        ['storm', STRINGS.difficultyName.storm],
      ],
      s.difficulty,
      set('difficulty'),
    ),
    options.inNight
      ? h('p', { className: 'settings-note', textContent: STRINGS.settingsDifficultyRestarts })
      : null,
    segmented(
      STRINGS.settingsBeam,
      [
        ['follow', STRINGS.beamFollow],
        ['drag', STRINGS.beamDrag],
      ],
      s.beamControl,
      set('beamControl'),
    ),
    toggle(STRINGS.settingsLeftHanded, s.leftHanded, set('leftHanded')),
    toggle(STRINGS.settingsTutorial, s.tutorialPrompts, set('tutorialPrompts')),
  );

  const access = section(
    STRINGS.settingsAccess,
    toggle(STRINGS.settingsReducedMotion, s.reducedMotion, set('reducedMotion')),
    toggle(STRINGS.settingsColorblind, s.colorblind, set('colorblind')),
    toggle(STRINGS.settingsHighContrast, s.highContrastReefs, set('highContrastReefs')),
    toggle(STRINGS.settingsLargerText, s.largerText, set('largerText')),
    toggle(STRINGS.settingsHaptics, s.haptics, set('haptics')),
  );

  // Reset needs two taps: the first arms it for a few seconds.
  let armed: ReturnType<typeof setTimeout> | null = null;
  const reset = button(
    STRINGS.settingsReset,
    () => {
      if (armed) {
        clearTimeout(armed);
        armed = null;
        reset.querySelector('span')?.replaceChildren(STRINGS.settingsResetDone);
        reset.disabled = true;
        options.data.resetProgress();
        options.toast(STRINGS.settingsResetToast);
        return;
      }
      reset.querySelector('span')?.replaceChildren(STRINGS.settingsResetConfirm);
      reset.classList.replace('ui-button--secondary', 'ui-button--danger');
      armed = setTimeout(() => {
        armed = null;
        reset.querySelector('span')?.replaceChildren(STRINGS.settingsReset);
        reset.classList.replace('ui-button--danger', 'ui-button--secondary');
      }, 4000);
    },
    { className: 'settings-wide' },
  );
  const data = section(
    STRINGS.settingsData,
    button(
      STRINGS.settingsExport,
      () => {
        options.data.exportSave();
        options.toast(STRINGS.settingsExportDone);
      },
      { className: 'settings-wide' },
    ),
    button(
      STRINGS.settingsImport,
      () => {
        pickFile((file) => {
          void importFile(file, options);
        });
      },
      { className: 'settings-wide' },
    ),
    h('p', {
      className: 'settings-note',
      textContent: options.data.canSave ? STRINGS.settingsSaveNote : STRINGS.settingsSaveOff,
    }),
    reset,
  );

  return h('div', { className: 'settings-panel' }, sound, display, gameplay, access, data);
}

/** Checks the chosen file, then asks before it replaces anything. */
async function importFile(file: File, options: SettingsPanelOptions): Promise<void> {
  const save = await options.data.checkImport(file);
  if (!save) {
    options.toast(STRINGS.settingsImportInvalid);
    return;
  }
  const summary = STRINGS.settingsImportSummary(totalStars(save.progress), save.progress.coins);
  const modal = openModal(
    options.parent,
    { title: STRINGS.settingsImportTitle, closable: true },
    h('p', { textContent: summary }),
    h(
      'div',
      { className: 'menu-stack' },
      button(
        STRINGS.settingsImportConfirm,
        () => {
          modal.close();
          options.data.applyImport(save);
          options.toast(STRINGS.settingsImportDone);
        },
        { variant: 'primary' },
      ),
      button(STRINGS.settingsImportCancel, () => {
        modal.close();
      }),
    ),
  );
}
