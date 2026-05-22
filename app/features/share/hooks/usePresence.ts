/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useCallback, useRef } from 'react';
import { db } from '@/app/lib/db';
import type { RemotePresencePeer } from '@/app/features/types';
import type { ShareIdentity } from '../types';
import { PRESENCE_THROTTLE_MS } from '../constants';

/**
 * Joins a workspace presence room, publishes own state, and returns remote peers.
 * Cursor updates are throttled to ~30 Hz via a RAF-based cooldown.
 */
export function usePresence(workspaceId: string, identity: ShareIdentity) {
  const room = db.room('workspace', workspaceId);

  const { peers: rawPeers, publishPresence } = db.rooms.usePresence(room as any, {
    keys: ['name', 'color', 'cursor', 'selection', 'typing'],
  } as any);

  db.rooms.useSyncPresence(room as any, {
    name: identity.name,
    color: identity.color,
    cursor: null,
    selection: { blockIds: [], frameId: null },
    typing: false,
  } as any);

  const lastCursorSend = useRef(0);
  const pendingCursor = useRef<{ x: number; y: number } | null>(null);
  const rafPending = useRef(false);

  const publishCursor = useCallback((canvasX: number, canvasY: number) => {
    pendingCursor.current = { x: canvasX, y: canvasY };
    const now = performance.now();
    if (now - lastCursorSend.current < PRESENCE_THROTTLE_MS) {
      if (!rafPending.current) {
        rafPending.current = true;
        requestAnimationFrame(() => {
          rafPending.current = false;
          if (!pendingCursor.current) return;
          const elapsed = performance.now() - lastCursorSend.current;
          if (elapsed >= PRESENCE_THROTTLE_MS) {
            lastCursorSend.current = performance.now();
            publishPresence({ cursor: pendingCursor.current } as any);
            pendingCursor.current = null;
          }
        });
      }
      return;
    }
    lastCursorSend.current = now;
    publishPresence({ cursor: { x: canvasX, y: canvasY } } as any);
    pendingCursor.current = null;
  }, [publishPresence]);

  const publishSelection = useCallback((blockIds: string[], frameId: string | null) => {
    publishPresence({ selection: { blockIds, frameId } } as any);
  }, [publishPresence]);

  const publishTyping = useCallback((typing: boolean) => {
    publishPresence({ typing } as any);
  }, [publishPresence]);

  const peers: RemotePresencePeer[] = Object.entries(rawPeers ?? {}).map(([id, p]: [string, any]) => ({
    id,
    name:      p.name      ?? 'Guest',
    color:     p.color     ?? '#888888',
    cursor:    p.cursor    ?? null,
    selection: p.selection ?? { blockIds: [], frameId: null },
    typing:    p.typing    ?? false,
  }));

  return { peers, publishCursor, publishSelection, publishTyping };
}
