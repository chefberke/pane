/** Avatar size preset key. */
export type AvatarSize = 'xs' | 'md' | 'lg' | 'xl';

/** Decorative ring drawn around an avatar (used for stacking separators / follow highlight). */
export interface AvatarRing {
  color: string;
  width?: number;
}

/** Props for the standard circular user avatar. */
export interface AvatarProps {
  /** Display name or email — initials are derived from this. */
  name?: string;
  /** Explicit background (CSS color or gradient). Overrides the seed-derived color. */
  color?: string;
  /** Stable id/email used to derive a deterministic color when `color` is absent. */
  seed?: string;
  /** Size preset (default 'md'). */
  size?: AvatarSize;
  /** Shows a green online indicator dot. */
  isOnline?: boolean;
  /** Decorative ring (rendered as a box-shadow, no layout impact). */
  ring?: AvatarRing;
  /** Native tooltip text. */
  title?: string;
}
