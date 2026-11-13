/**
 * Harbor shop: the lighthouse by day, upgrade cards (level pips, effect, cost) and bell buoy
 * placement on a mini chart of the next night's reefs (docs/SCREENS.md "Harbor").
 */
import { emitUi } from '../app/uiEvents';
import { levelDef, placeOf } from '../app/campaign';
import {
  buoyCost,
  buoysInRegion,
  buyUpgrade,
  isUpgradeForSale,
  placeBuoy,
  upgradeCost,
  type Progress,
} from '../app/progress';
import type { Scene } from '../app/sceneManager';
import { SHOP } from '../data';
import type { ShopUpgradeDef } from '../data/uiTypes';
import { screenHeader } from '../ui/header';
import { button } from '../ui/kit/controls';
import { card, coinCounter } from '../ui/kit/display';
import { h, svg } from '../ui/kit/dom';
import { ICONS } from '../ui/kit/icons';
import { lighthouseArt, miniChart, reefSpots } from '../ui/shopArt';
import { STRINGS } from '../ui/strings';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';

const pips = (level: number, max: number): HTMLElement =>
  h(
    'span',
    { className: 'pips', attrs: { role: 'img', 'aria-label': STRINGS.shopLevel(level, max) } },
    ...Array.from({ length: max }, (_, i) =>
      h('span', { className: i < level ? 'pip is-on' : 'pip' }),
    ),
  );

export function createShopScene(ctx: GameContext): Scene {
  return menuScene(ctx, (params) => {
    const levelId = typeof params.levelId === 'string' ? params.levelId : '1-1';
    const level = levelDef(levelId);
    const region = placeOf(levelId)?.region.id ?? level.region;
    const coins = coinCounter(ctx.progress.get().coins);
    const art = lighthouseArt();
    const list = h('ul', { className: 'shop-list' });
    const buoyBox = h('div', { className: 'mini-chart' });
    const buoyInfo = h('p', { className: 'shop-buoys__info', attrs: { 'aria-live': 'polite' } });
    const buoyControls = h('div', { className: 'shop-buoys__controls' });
    let placing = false;

    const upgradeCard = (def: ShopUpgradeDef, p: Progress): HTMLElement => {
      const lvl = p.upgrades[def.id];
      const forSale = isUpgradeForSale(p, def);
      const maxed = lvl >= def.max;
      const cost = upgradeCost(def, lvl);
      const buy = button(
        maxed ? STRINGS.shopMaxed : forSale ? STRINGS.shopBuy(cost) : STRINGS.locked,
        () => {
          const next = buyUpgrade(ctx.progress.get(), def);
          if (!next) return;
          ctx.progress.set(next);
          emitUi({ type: 'buy' });
          refresh(true);
          ctx.toast(STRINGS.shopBought(STRINGS.upgradeName[def.id]));
        },
        {
          variant: 'secondary',
          disabled: maxed || !forSale || p.coins < cost,
          icon: maxed ? 'check' : 'coin',
        },
      );
      buy.setAttribute('aria-label', `${STRINGS.upgradeName[def.id]}: ${buy.textContent}`);
      return h(
        'li',
        {},
        card(
          `shop-card${forSale ? '' : ' is-locked'}`,
          h('h2', { className: 'shop-card__name', textContent: STRINGS.upgradeName[def.id] }),
          pips(lvl, def.max),
          h('p', {
            className: 'shop-card__effect',
            textContent: forSale
              ? STRINGS.upgradeEffect[def.id]
              : STRINGS.shopOpensAfter(def.unlocksAfter ?? ''),
          }),
          buy,
        ),
      );
    };

    const drawBuoys = (p: Progress): void => {
      const placed = p.buoys[levelId] ?? [];
      const inRegion = buoysInRegion(p, region);
      const cost = buoyCost(p, region);
      const full = inRegion >= SHOP.buoy.maxPerRegion;
      buoyInfo.textContent = placing
        ? STRINGS.shopBuoyPick
        : STRINGS.shopBuoyCount(inRegion, SHOP.buoy.maxPerRegion, STRINGS.regionName[region]);
      const spots = reefSpots(level).map((spot) => {
        const has = placed.includes(spot.index);
        const b = h(
          'button',
          {
            type: 'button',
            className: `mini-chart__reef${has ? ' has-buoy' : ''}`,
            disabled: !placing || has,
            attrs: {
              'aria-label': has
                ? STRINGS.shopReefWithBuoy(spot.index + 1)
                : STRINGS.shopReef(spot.index + 1),
            },
          },
          svg(has ? ICONS.buoy : ICONS.close),
        );
        b.style.left = `${spot.x}%`;
        b.style.top = `${spot.y}%`;
        b.addEventListener('click', () => {
          const next = placeBuoy(ctx.progress.get(), levelId, spot.index);
          placing = false;
          if (next) {
            ctx.progress.set(next);
            emitUi({ type: 'buy' });
          }
          refresh(next !== null);
        });
        return b;
      });
      const place = button(
        placing
          ? STRINGS.shopBuoyCancel
          : full
            ? STRINGS.shopBuoyFull
            : STRINGS.shopBuoyPlace(cost),
        () => {
          placing = !placing;
          drawBuoys(ctx.progress.get());
          buoyBox.querySelector<HTMLButtonElement>('.mini-chart__reef:not(:disabled)')?.focus();
        },
        {
          disabled: !placing && (full || p.coins < cost),
          icon: 'buoy',
          className: 'shop-buoys__place',
        },
      );
      buoyBox.replaceChildren(miniChart(), ...spots);
      buoyBox.classList.toggle('is-placing', placing);
      buoyControls.replaceChildren(buoyInfo, place);
    };

    const refresh = (celebrate: boolean): void => {
      const p = ctx.progress.get();
      coins.set(p.coins, celebrate);
      art.show(p.upgrades, celebrate);
      list.replaceChildren(...SHOP.upgrades.map((def) => upgradeCard(def, p)));
      drawBuoys(p);
    };

    const buoys = card(
      'shop-buoys',
      h('h2', { textContent: STRINGS.shopBuoysTitle }),
      h('p', { className: 'shop-card__effect', textContent: STRINGS.shopBuoysLine(level.name) }),
      buoyBox,
      buoyControls,
    );
    refresh(false);

    const toMap = (): void => {
      void ctx.nav.reset(SCENE.map, {}, [{ name: SCENE.title, params: {} }]);
    };
    const root = h(
      'main',
      { className: 'menu-screen menu-screen--top shop' },
      screenHeader(STRINGS.shopTitle, toMap, coins.element),
      h(
        'div',
        { className: 'menu-column menu-column--scroll' },
        h('div', { className: 'shop-hero' }, art.element),
        list,
        buoys,
        button(STRINGS.shopToMap, toMap, { variant: 'primary', icon: 'anchor' }),
      ),
    );
    return {
      root,
      back() {
        if (placing) {
          placing = false;
          drawBuoys(ctx.progress.get());
          return true;
        }
        toMap();
        return true;
      },
    };
  });
}
