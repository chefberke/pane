export const SIDEBAR_WIDTH = 220;

/** Max characters for a canvas name. Keep in sync with the size() check in instant.perms.ts. */
export const MAX_WORKSPACE_NAME_LENGTH = 50;

/** Identifies a pane workspace export file (stored in the envelope's `format` field). */
export const EXPORT_FORMAT = 'pane-workspace';

/** Current export schema version. Bump when the envelope shape changes. */
export const EXPORT_VERSION = 1;
