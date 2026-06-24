'use client';
import { memo } from 'react';
import { AVATAR_SIZES, AVATAR_ONLINE_COLOR, AVATAR_TEXT_ON_COLOR } from './constants';
import { initials, colorForId } from './utils';
import type { AvatarProps } from './types';

/** Standard circular user avatar — initials on a deterministic color, with optional online dot and ring. */
function AvatarImpl({ name, color, seed, size = 'md', isOnline = false, ring, title }: AvatarProps) {
  const { box, font, dot } = AVATAR_SIZES[size];
  const hasColor = Boolean(color) || Boolean(seed);
  const background = color ?? (seed ? colorForId(seed) : 'var(--color-surface-sunken)');

  return (
    <div className="relative flex-shrink-0" style={{ width: box, height: box }} title={title}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-bold select-none"
        style={{
          background,
          color:     hasColor ? AVATAR_TEXT_ON_COLOR : 'var(--color-text-secondary)',
          fontSize:  font,
          boxShadow: ring ? `0 0 0 ${ring.width ?? 2}px ${ring.color}` : undefined,
        }}
      >
        {initials(name ?? '')}
      </div>
      {isOnline && (
        <div
          className="absolute -bottom-0.5 -right-0.5 rounded-full"
          style={{
            width:       dot,
            height:      dot,
            background:  AVATAR_ONLINE_COLOR,
            border:      '2px solid var(--color-surface)',
          }}
        />
      )}
    </div>
  );
}

export default memo(AvatarImpl);
