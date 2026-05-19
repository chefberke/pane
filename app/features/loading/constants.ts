import type { Tip } from './types';

/** Brand wordmark shown beneath the logo on the loading screen. */
export const WORDMARK = 'Pane';

/** Pixel size of the brand-gradient logo square. */
export const LOGO_SIZE = 36;

/** Duration of one full logo pulse cycle in milliseconds. Slightly brisk to read as "loading". */
export const PULSE_DURATION_MS = 1200;

/** Fade-in duration for the tip when it first appears in milliseconds. */
export const TIP_FADE_MS = 400;

/** Static label rendered before the rotating tip text. */
export const TIPS_LABEL = 'Tips:';

/** Short, friendly hints rotated beneath the wordmark during loading. */
export const TIPS: readonly Tip[] = [
  ['Press ', { kbd: '⌘K' }, ' to search anything, anywhere.'],
  ['Double-click the canvas to drop a thought.'],
  ['Hold ', { kbd: 'Space' }, ' to pan around your ideas.'],
  ['Drag any link in — Pane figures out the rest.'],
  ['Paste an image, link, or note. It just works.'],
  ['Press ', { kbd: '⌘Z' }, ' to take it back. We all change our minds.'],
  ['Pinch to zoom out — sometimes the wide view tells the story.'],
  ['Your canvas is infinite. Take the long way.'],
  ['Good ideas like a little room to breathe.'],
  ['Made with care, one pixel at a time.'],
];
