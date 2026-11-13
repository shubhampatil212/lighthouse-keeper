/** Win and lose rules and stars (docs/GDD.md §3.5). Pure functions, so they're easy to test. */
import type { StarRules } from '../data/types';
import type { FailReason, LevelOutcome } from './events';

/** The night fails when wrecks go past the allowance, or a precious ship is lost. */
export function failReason(
  wrecked: number,
  allowance: number,
  preciousLost: boolean,
): FailReason | null {
  if (preciousLost) return 'preciousLost';
  if (wrecked > allowance) return 'tooManyWrecks';
  return null;
}

/**
 * The night is over when every scheduled ship is resolved: home, wrecked, or (smugglers) caught or
 * escaped.
 */
export function allShipsResolved(total: number, resolved: number): boolean {
  return resolved >= total;
}

/** ★ finish; ★★ few wrecks; ★★★ fewer still, plus the bonus objective. A failed night earns none. */
export function starsFor(
  outcome: LevelOutcome,
  wrecked: number,
  bonusMet: boolean,
  rules: StarRules,
): number {
  if (outcome === 'failed') return 0;
  if (wrecked <= rules.threeStarMaxWrecks && bonusMet) return 3;
  if (wrecked <= rules.twoStarMaxWrecks) return 2;
  return 1;
}
