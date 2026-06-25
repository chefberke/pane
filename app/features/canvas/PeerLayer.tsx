'use client';
import { memo } from 'react';
import type { Frame, RemotePresencePeer } from '@/app/features/types';
import { AVATAR_TEXT_ON_COLOR } from '../ui/constants';
import { PEER_CURSOR_Z } from './constants';

interface SelectionsProps {
  peers: RemotePresencePeer[];
  frameById: Map<string, Frame>;
}

/** Remote peer frame-selection outlines, rendered in canvas space (inside the world transform).
 *  Block selections are drawn on the block card itself (see Block.tsx) so they hug the real size. */
function PeerSelectionsImpl({ peers, frameById }: SelectionsProps) {
  return (
    <>
      {peers.map(peer => {
        if (!peer.selection.frameId) return null;
        const frame = frameById.get(peer.selection.frameId);
        if (!frame) return null;
        return (
          <div
            key={`${peer.id}-frame-${frame.id}`}
            className="absolute pointer-events-none rounded-xl"
            style={{
              left:    frame.x - 3,
              top:     frame.y - 3,
              width:   frame.width + 6,
              height:  frame.height + 6,
              outline: `2px solid ${peer.color}`,
              outlineOffset: 0,
            }}
          />
        );
      })}
    </>
  );
}
export const PeerSelections = memo(PeerSelectionsImpl);

interface CursorsProps {
  peers: RemotePresencePeer[];
  scale: number;
  offset: { x: number; y: number };
}

/** Remote peer cursors, rendered in screen space (fixed pixel size, outside the world transform). */
function PeerCursorsImpl({ peers, scale, offset }: CursorsProps) {
  return (
    <>
      {peers.map(peer => {
        if (!peer.cursor) return null;
        const sx = peer.cursor.x * scale + offset.x;
        const sy = peer.cursor.y * scale + offset.y;
        return (
          <div
            key={`cursor-${peer.id}`}
            className="absolute pointer-events-none"
            style={{ left: sx, top: sy, zIndex: PEER_CURSOR_Z }}
          >
            {/* Figma-style cursor arrow */}
            <svg
              width="14" height="17" viewBox="0 0 18 22" fill="none"
              style={{ display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
            >
              <path
                d="M1 1L1 17L5.5 13L8.5 20L10.5 19L7.5 12L13 12L1 1Z"
                fill={peer.color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-3 top-2.5 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
              style={{ background: peer.color, color: AVATAR_TEXT_ON_COLOR }}
            >
              {peer.name}
              {peer.typing && <span style={{ opacity: 0.8 }}> · typing…</span>}
            </div>
          </div>
        );
      })}
    </>
  );
}
export const PeerCursors = memo(PeerCursorsImpl);
