'use client';
import { memo } from 'react';
import { APP_NAME } from './constants';

/** Brand header row at the top of the menu panel. */
function BrandRow() {
  return (
    <div
      className="flex items-center gap-2.5 px-3"
      style={{ height: 44, borderBottom: '1px solid var(--color-border-default)' }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 'var(--radius-md)', background: 'var(--brand-gradient)', flexShrink: 0 }} />
      <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
        {APP_NAME}
      </span>
    </div>
  );
}

export default memo(BrandRow);
