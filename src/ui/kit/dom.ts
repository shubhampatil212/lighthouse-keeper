/** Small helpers for building DOM screens in plain TypeScript. */

type Props<K extends keyof HTMLElementTagNameMap> = Partial<
  Omit<HTMLElementTagNameMap[K], 'className' | 'style'>
> & {
  className?: string;
  /** Attributes set with setAttribute (aria-*, data-*, role…). */
  attrs?: Readonly<Record<string, string>>;
};

export type Child = Node | string | null | undefined | false;

/** Creates an element with properties, attributes and children. Falsy children are skipped. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<K> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const { attrs, className, ...rest } = props;
  const el = Object.assign(document.createElement(tag), rest);
  if (className) el.className = className;
  if (attrs) for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  for (const child of children) if (child) el.append(child);
  return el;
}

/** Parses a trusted inline SVG string (from icons.ts) into an element. */
export function svg(markup: string): SVGSVGElement {
  const holder = document.createElement('template');
  holder.innerHTML = markup.trim();
  const el = holder.content.firstElementChild;
  if (!(el instanceof SVGSVGElement)) throw new Error('svg(): not an <svg> string');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Creates an SVG element with attributes. */
export function s<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Readonly<Record<string, string | number>> = {},
  ...children: (SVGElement | null | false)[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) if (child) el.append(child);
  return el;
}

/** The elements inside `root` that Tab can reach, in order. */
export function focusables(root: ParentNode): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return [...root.querySelectorAll<HTMLElement>(selector)].filter((el) => !el.closest('[hidden]'));
}

export function reducedMotion(): boolean {
  return document.documentElement.classList.contains('reduce-motion');
}
