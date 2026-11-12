/**
 * Temporary play-test HUD and end card (phase 02), so a night can be played start to finish.
 * The real HUD and results screen replace these in phase 05.
 */
import './playtest.css';
import type { LevelDef } from '../data/types';
import type { LevelResult } from '../sim/events';
import { STRINGS } from './strings';

export interface HudInfo {
  saved: number;
  spareHulls: number;
  paused: boolean;
}

export interface PlaytestUi {
  setLevel(level: LevelDef): void;
  showHud(info: HudInfo): void;
  showEnd(result: LevelResult): void;
  hideEnd(): void;
}

export function createPlaytestUi(parent: HTMLElement, onPlayAgain: () => void): PlaytestUi {
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
  parent.append(hud, card);

  let level: LevelDef | null = null;
  let lastLine = '';

  return {
    setLevel(next) {
      level = next;
      title.textContent = STRINGS.levelTitle(next.id, next.name);
    },
    showHud(info) {
      const text = info.paused
        ? STRINGS.paused
        : `${STRINGS.hudSaved(info.saved)} · ${STRINGS.hudSpareHulls(info.spareHulls)}`;
      if (text !== lastLine) line.textContent = lastLine = text;
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
