/**
 * What the play scene shows in the HUD each frame, read from the world into one reused object (the
 * HUD only touches the page when something in it changes), and the words for tutorial prompts.
 */
import { ABILITIES } from '../data';
import type { TutorialPromptId } from '../data/types';
import { foghornCooldown } from '../sim/abilities';
import type { World } from '../sim/world';
import type { DebugSettings } from '../ui/debugPanel';
import type { HudInfo } from '../ui/hud';
import { STRINGS } from '../ui/strings';

export function createHudInfo(): (world: World) => HudInfo {
  const horn = { cooldown: 0, full: 0 };
  const info: HudInfo = {
    spawned: 0,
    total: 0,
    saved: 0,
    allowance: 0,
    wrecked: 0,
    caught: 0,
    foghorn: null,
    flares: null,
    lamp: null,
  };
  return (world) => {
    const { state, setup } = world;
    const owned = setup.upgrades;
    info.spawned = state.spawnIndex;
    info.total = setup.endless ? 0 : setup.spawns.length;
    info.saved = state.saved;
    info.allowance = setup.difficulty.wreckAllowance;
    info.wrecked = state.wrecked;
    info.caught = state.caught;
    if (owned.foghorn > 0) {
      horn.cooldown = state.abilities.foghornCooldown;
      horn.full = foghornCooldown(ABILITIES.foghorn, owned.foghorn);
      info.foghorn = horn;
    } else {
      info.foghorn = null;
    }
    info.flares = owned.flares > 0 ? state.abilities.flares : null;
    info.lamp = state.lamp2 ? state.activeLamp : null;
    return info;
  };
}

/** A tutorial prompt's words; "swing the beam" depends on the control style. */
export function tutorialText(id: TutorialPromptId, settings: DebugSettings): string {
  if (id !== 'swingBeam') return STRINGS.tutorial[id];
  return settings.style === 'drag'
    ? STRINGS.tutorial.swingBeamDrag
    : STRINGS.tutorial.swingBeamFollow;
}
