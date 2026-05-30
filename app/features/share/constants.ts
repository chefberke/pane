export const TOKEN_LENGTH = 22;

/** Human-readable labels for member/share roles. Shared by RoleBadge and RoleDropdown. */
export const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  editor: 'Can edit',
  viewer: 'View only',
};

/** Validates an email address (no whitespace, single @, dotted domain). */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FOLLOW_BORDER_WIDTH = 4;

export const GUEST_NAME_PREFIX = 'Guest';

/** Throttle interval for cursor presence updates (ms) — ~30 Hz. */
export const PRESENCE_THROTTLE_MS = 33;

/** Ordered palette for cursor/avatar colors. Deterministic: colorForId picks by hash index. */
export const CURSOR_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
];
