/**
 * Debug panel section for the campaign: unlock every level, or jump straight into any night.
 * A developer tool, so its labels aren't in strings.ts.
 */
import { CAMPAIGN } from '../data';

export interface DebugCampaignHandlers {
  unlockAll(): void;
  jump(levelId: string): void;
}

export function createDebugCampaign(handlers: DebugCampaignHandlers): HTMLFieldSetElement {
  const section = document.createElement('fieldset');
  section.append(Object.assign(document.createElement('legend'), { textContent: 'Campaign' }));
  const pick = document.createElement('select');
  for (const region of CAMPAIGN) {
    for (const level of region.levels)
      pick.append(new Option(`${level.id} ${level.name}`, level.id));
  }
  const jump = Object.assign(document.createElement('button'), {
    type: 'button',
    textContent: 'Jump to level',
  });
  jump.addEventListener('click', () => {
    handlers.jump(pick.value);
  });
  const unlock = Object.assign(document.createElement('button'), {
    type: 'button',
    textContent: 'Unlock all',
  });
  unlock.addEventListener('click', () => {
    handlers.unlockAll();
  });
  section.append(pick, jump, unlock);
  return section;
}
