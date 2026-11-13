import type { HarborStyleConfig } from './types';

/**
 * Harbor destination colors (docs/CONTENT.md §3 "Second harbor", docs/ART_AUDIO.md colorblind mode).
 * Index 0 is the island's harbor. Ships show their harbor's color; colorblind mode switches to
 * blue/orange and adds a circle or triangle marker.
 */
export const HARBOR_STYLE: HarborStyleConfig = {
  colors: [0xd9573f, 0x4f8fe0],
  // Okabe–Ito orange and sky blue: told apart with any color vision, and bright on night water.
  colorblindColors: [0xe69f00, 0x56b4e9],
  shapes: ['circle', 'triangle'],
};
