// Shared constants that cross a feature or client/server boundary and therefore
// can't live in any one feature's constants.ts (which must not be imported across
// features). Keep this file pure `export const` — no client- or server-only imports,
// so it's safe to import from both browser code and API route handlers.

/** Window event (menu panel → canvas) that opens the keyboard-shortcuts cheat-sheet. */
export const OPEN_SHORTCUTS_EVENT = 'pane:open-shortcuts';

/** Max feedback message length — shared by the UI textarea cap and the API validation. */
export const FEEDBACK_MAX_LENGTH = 1000;
