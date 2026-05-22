'use client';
import { useState, useRef } from 'react';
import type { RemotePresencePeer } from '@/app/features/types';
import { initials } from './utils';

interface Props {
  peers: RemotePresencePeer[];
}

const MAX_VISIBLE = 4;

/** Compact avatar row showing who's currently in the workspace. */
export default function AvatarStack({ peers }: Props) {
  if (peers.length === 0) return null;

  const visible = peers.slice(0, MAX_VISIBLE);
  const overflow = peers.length - MAX_VISIBLE;

  return (
    <div className="flex items-center" style={{ gap: -6 }}>
      {visible.map((peer, i) => (
        <Avatar key={peer.id} peer={peer} zIndex={MAX_VISIBLE - i} />
      ))}
      {overflow > 0 && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 -ml-2"
          style={{
            background:  'var(--color-surface-raised)',
            borderColor: 'var(--color-border-default)',
            color:       'var(--color-text-secondary)',
            zIndex:      0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

function Avatar({ peer, zIndex }: { peer: RemotePresencePeer; zIndex: number }) {
  const [tip, setTip] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div
      className="relative -ml-2 first:ml-0"
      style={{ zIndex }}
      onMouseEnter={() => { timer.current = setTimeout(() => setTip(true), 400); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setTip(false); }}
    >
      {tip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] rounded-lg whitespace-nowrap pointer-events-none z-50"
          style={{
            background:  'var(--color-surface-raised)',
            color:       'var(--color-text-primary)',
            border:      '1px solid var(--color-border-default)',
            boxShadow:   'var(--shadow-float)',
          }}
        >
          {peer.name}
          {peer.typing && (
            <span style={{ color: 'var(--color-text-muted)' }}> · typing…</span>
          )}
        </div>
      )}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 select-none"
        style={{
          background:  peer.color,
          borderColor: 'var(--color-canvas)',
          color:       '#ffffff',
        }}
      >
        {initials(peer.name)}
      </div>
    </div>
  );
}
