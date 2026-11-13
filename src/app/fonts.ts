/**
 * Waits for the two fonts the first screens use (Karla for the interface, IM Fell English for the
 * title), so the title never flashes in a fallback font. Index.html preloads both; the bold and
 * italic weights load later, when they're first used. Never waits longer than FONT_WAIT_MS.
 */
const FIRST_FONTS = ['400 1em Karla', '400 1em "IM Fell English"'];
const FONT_WAIT_MS = 2500;

export async function loadFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  const loads = Promise.all(FIRST_FONTS.map((font) => document.fonts.load(font))).then(
    () => undefined,
    () => undefined,
  );
  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, FONT_WAIT_MS);
  });
  await Promise.race([loads, timeout]);
}
