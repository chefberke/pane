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

/** Ordered palette for cursor/avatar colors. Re-exported from the shared ui primitives. */
export { AVATAR_COLORS as CURSOR_COLORS } from '../ui/constants';
