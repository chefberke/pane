'use client';
import { useState, useRef } from 'react';
import type { RemotePresencePeer } from '@/app/features/types';
import Avatar from '../ui/Avatar';

interface Props {
  peers: RemotePresencePeer[];
  followedPeerId?: string | null;
  onSelectPeer?: (peerId: string) => void;
}

const MAX_VISIBLE = 4;

/** Compact avatar row showing who's currently in the workspace. */
export default function AvatarStack({ peers, followedPeerId, onSelectPeer }: Props) {
  if (peers.length === 0) return null;

  const visible = peers.slice(0, MAX_VISIBLE);
  const overflow = peers.length - MAX_VISIBLE;

  return (
    <div className="flex items-center" style={{ gap: -6 }}>
      {visible.map((peer, i) => (
        <PeerAvatar
          key={peer.id}
          peer={peer}
          zIndex={MAX_VISIBLE - i}
          isFollowing={followedPeerId === peer.id}
          onSelect={onSelectPeer}
        />
      ))}
      {overflow > 0 && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 -ml-2"
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

/** A single stacked presence avatar with hover tooltip and click-to-follow. */
function PeerAvatar({
  peer,
  zIndex,
  isFollowing,
  onSelect,
}: {
  peer: RemotePresencePeer;
  zIndex: number;
  isFollowing: boolean;
  onSelect?: (peerId: string) => void;
}) {
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
          {onSelect && (
            <span style={{ color: 'var(--color-text-muted)' }}>
              {isFollowing ? ' · Following' : ' · Click to follow'}
            </span>
          )}
        </div>
      )}
      <div
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={() => onSelect?.(peer.id)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(peer.id); }}
        className="rounded-full"
        style={{
          cursor:        onSelect ? 'pointer' : 'default',
          outline:       isFollowing ? `2px solid ${peer.color}` : 'none',
          outlineOffset: '2px',
        }}
      >
        <Avatar
          size="md"
          name={peer.name}
          color={peer.color}
          ring={{ color: isFollowing ? peer.color : 'var(--color-canvas)', width: 2 }}
        />
      </div>
    </div>
  );
}
