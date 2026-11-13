/**
 * Temporary play-test HUD and end card (phase 02), so a night can be played start to finish.
 * The real HUD and results screen replace these in phase 05.
 */
import './playtest.css';
import type { LevelDef } from '../data/types';
import type { ActionIntent } from '../input/controller';
import type { LevelResult } from '../sim/events';
import { STRINGS } from './strings';

export interface HudInfo {
  saved: number;
  spareHulls: number;
  caught: number;
  paused: boolean;
  /** Abilities: null hides the button (not owned / no second lamp). */
  foghorn: { cooldown: number } | null;
  flares: number | null;
  switchLamp: boolean;
}

export interface PlaytestUi {
  setLevel(level: LevelDef): void;
  showHud(info: HudInfo): void;
  showEnd(result: LevelResult): void;
  hideEnd(): void;
}

interface AbilityButton {
  button: HTMLButtonElement;
  label: string;
}

function abilityButton(text: string, onPress: () => void): AbilityButton {
  const button = Object.assign(document.createElement('button'), {
    type: 'button',
    textContent: text,
  });
  button.hidden = true;
  // pointerdown, not click: on a phone the finger is usually already busy steering.
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onPress();
  });
  return { button, label: '' };
}

export function createPlaytestUi(
  parent: HTMLElement,
  onPlayAgain: () => void,
  onAction: (action: ActionIntent) => void = () => undefined,
): PlaytestUi {
  const hud = document.createElement('p');
  hud.className = 'playtest-hud';
  hud.setAttribute('aria-live', 'polite');
  const title = document.createElement('strong');
  const line = document.createElement('span');
  hud.append(title, line);

  const card = document.createElement('section');
  card.className = 'end-card';
  card.hidden = true;
  card.setAttribute('role', 'dialog');
  const heading = document.createElement('h2');
  const stars = document.createElement('p');
  stars.className = 'stars';
  const summary = document.createElement('p');
  const bonus = document.createElement('p');
  const again = Object.assign(document.createElement('button'), {
    type: 'button',
    textContent: STRINGS.playAgain,
  });
  again.addEventListener('click', onPlayAgain);
  card.append(heading, stars, summary, bonus, again);

  // Temporary ability buttons (phase 04): bottom of the screen, thumb-sized.
  const bar = document.createElement('div');
  bar.className = 'playtest-abilities';
  const horn = abilityButton(STRINGS.abilityFoghorn, () => {
    onAction('foghorn');
  });
  const flare = abilityButton(STRINGS.abilityFlare, () => {
    onAction('flare');
  });
  const lamp = abilityButton(STRINGS.abilitySwitchLamp, () => {
    onAction('switchLamp');
  });
  bar.append(horn.button, flare.button, lamp.button);
  parent.append(hud, bar, card);

  const setButton = (
    b: AbilityButton,
    shown: boolean,
    label: string,
    text: string,
    ready: boolean,
  ) => {
    b.button.hidden = !shown;
    if (!shown) return;
    if (b.label !== label) {
      b.label = label;
      b.button.setAttribute('aria-label', label);
      b.button.textContent = text;
    }
    b.button.classList.toggle('cooling', !ready);
  };

  let level: LevelDef | null = null;
  let lastLine = '';

  return {
    setLevel(next) {
      level = next;
      title.textContent = STRINGS.levelTitle(next.id, next.name);
    },
    showHud(info) {
      const caught = info.caught > 0 ? ` · ${STRINGS.hudCaught(info.caught)}` : '';
      const text = info.paused
        ? STRINGS.paused
        : `${STRINGS.hudSaved(info.saved)} · ${STRINGS.hudSpareHulls(info.spareHulls)}${caught}`;
      if (text !== lastLine) line.textContent = lastLine = text;

      const h = info.foghorn;
      const wait = h ? Math.ceil(h.cooldown) : 0;
      setButton(
        horn,
        h !== null,
        STRINGS.abilityFoghornLabel(wait),
        wait > 0 ? `${STRINGS.abilityFoghorn} ${wait}` : STRINGS.abilityFoghorn,
        wait === 0,
      );
      const charges = info.flares ?? 0;
      setButton(
        flare,
        info.flares !== null,
        STRINGS.abilityFlareLabel(charges),
        `${STRINGS.abilityFlare} ×${charges}`,
        charges > 0,
      );
      setButton(
        lamp,
        info.switchLamp,
        STRINGS.abilitySwitchLampLabel,
        STRINGS.abilitySwitchLamp,
        true,
      );
    },
    showEnd(result) {
      heading.textContent =
        result.outcome === 'won'
          ? STRINGS.endWon
          : result.failReason === 'preciousLost'
            ? STRINGS.endFailedPrecious
            : STRINGS.endFailed;
      stars.textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
      stars.setAttribute('aria-label', STRINGS.endStarsLabel(result.stars));
      summary.textContent = STRINGS.endSummary(result.saved, result.wrecked);
      const bonusText = level ? STRINGS.bonus(level.bonus) : null;
      bonus.hidden = bonusText === null;
      if (bonusText !== null) {
        bonus.textContent = `${bonusText}: ${result.bonusMet ? STRINGS.bonusDone : STRINGS.bonusMissed}`;
      }
      card.hidden = false;
      again.focus();
    },
    hideEnd() {
      card.hidden = true;
    },
  };
}
