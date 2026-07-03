'use client';
import { memo, type ReactNode } from 'react';

/** Lightweight stand-in shown in place of a heavy embed (iframe/PDF) while it's far offscreen.
 *  Fills the exact embed dimensions so measurement/layout stay stable when the real embed swaps in. */
function EmbedPlaceholder({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2 select-none"
      style={{ background: 'var(--color-surface-embed)', color: 'var(--color-text-muted)' }}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

export default memo(EmbedPlaceholder);
