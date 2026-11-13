/**
 * Listens to a night's events and remembers what went wrong, so the results screen can give a
 * gentle tip based on what really happened (docs/SCREENS.md "Results"). It only reads events.
 */
import { SHIP_BEHAVIOR, UI_FEEL } from '../data';
import type { ShipTypeId } from '../data/types';
import type { FailReason, SimEvent, WreckCause } from '../sim/events';

export interface WreckNote {
  shipType: ShipTypeId;
  cause: WreckCause;
  /** How long the ship had been in the dark when it sank (0 if it was lit or only briefly dark). */
  darkSeconds: number;
  /** It was first lit only shortly before it sank, or never. */
  litLate: boolean;
}

export interface NightReport {
  wrecks: readonly WreckNote[];
}

export type TipId = 'precious' | 'pirate' | 'whirlpool' | 'iceberg' | 'dark' | 'late' | 'sweep';

export interface NightLog {
  onEvent(event: SimEvent): void;
  report(): NightReport;
}

export function createNightLog(stepSeconds: number): NightLog {
  const firstLit = new Map<number, number>();
  const lastLit = new Map<number, number>();
  const lost = new Map<number, number>();
  const wrecks: WreckNote[] = [];
  return {
    onEvent(event) {
      switch (event.type) {
        case 'shipLit':
          if (!firstLit.has(event.shipId)) firstLit.set(event.shipId, event.tick);
          lastLit.set(event.shipId, event.tick);
          break;
        case 'shipLost':
          lost.set(event.shipId, event.tick);
          break;
        case 'shipWrecked': {
          const lostAt = lost.get(event.shipId);
          const darkSeconds =
            lostAt !== undefined && lostAt > (lastLit.get(event.shipId) ?? -1)
              ? (event.tick - lostAt) * stepSeconds + SHIP_BEHAVIOR.lostAfter
              : 0;
          const first = firstLit.get(event.shipId);
          const litLate =
            first === undefined || (event.tick - first) * stepSeconds < UI_FEEL.lateLightSeconds;
          wrecks.push({ shipType: event.shipType, cause: event.cause, darkSeconds, litLate });
          break;
        }
        default:
          break;
      }
    },
    report: () => ({ wrecks: [...wrecks] }),
  };
}

/** The most helpful tip for a failed night. */
export function pickTip(report: NightReport, failReason: FailReason | null): TipId {
  if (failReason === 'preciousLost') return 'precious';
  const n = report.wrecks.length;
  if (n === 0) return 'sweep';
  const share = (test: (w: WreckNote) => boolean): number => report.wrecks.filter(test).length / n;
  const enough = UI_FEEL.tipShare;
  for (const cause of ['pirate', 'whirlpool', 'iceberg'] as const) {
    if (share((w) => w.cause === cause) >= enough) return cause;
  }
  if (share((w) => w.darkSeconds >= UI_FEEL.darkTipSeconds) >= enough) return 'dark';
  if (share((w) => w.litLate) >= enough) return 'late';
  return 'sweep';
}
