'use client';
import { MessageCircle, Pencil, Trash2 } from 'lucide-react';
import type { Frame, FrameColor } from '@/app/features/types';
import ColorSwatch from './ColorSwatch';
import ActionTip from './ActionTip';

interface Props {
  frame: Frame;
  visible: boolean;
  onOpenComments: (anchor: { x: number; y: number }) => void;
  onStartRename: () => void;
  onColorChange: (color: FrameColor) => void;
  onDelete: () => void;
}

/** Floating action pill anchored above a frame's top-right edge — Comments + Rename + Color + Delete. */
export default function FrameActionPill({ frame, visible, onOpenComments, onStartRename, onColorChange, onDelete }: Props) {
  const commentCount = (frame.comments ?? []).length;
  return (
    <div
      className={[
        'absolute -top-8 right-0 flex items-center backdrop-blur-sm rounded-full px-0.5 py-0.5 gap-0 z-10 transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      style={{ background: 'var(--color-surface-action)', pointerEvents: visible ? 'auto' : 'none' }}
      onPointerDown={e => e.stopPropagation()}
    >
      <ActionTip label="Comments">
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-full transition-colors hover:bg-blue-500/80"
          style={{ color: 'var(--color-text-on-action)', cursor: 'default' }}
          onClick={e => { e.stopPropagation(); onOpenComments({ x: e.clientX, y: e.clientY }); }}
          onPointerDown={e => e.stopPropagation()}
        >
          <MessageCircle size={11} />
          {commentCount > 0 && (
            <span className="text-[10px] font-medium leading-none">{commentCount}</span>
          )}
        </button>
      </ActionTip>
      <div className="w-px h-3 mx-0.5" style={{ background: 'var(--color-border-subtle)' }} />
      <ActionTip label="Rename">
        <button
          className="flex items-center px-2 py-1 rounded-full transition-colors hover:bg-white/15"
          style={{ color: 'var(--color-text-on-action)', cursor: 'default' }}
          onClick={e => { e.stopPropagation(); onStartRename(); }}
          onPointerDown={e => e.stopPropagation()}
        >
          <Pencil size={11} />
        </button>
      </ActionTip>
      <div className="w-px h-3 mx-0.5" style={{ background: 'var(--color-border-subtle)' }} />
      <ActionTip label="Color">
        <div className="flex items-center px-2 py-1">
          <ColorSwatch color={frame.color} onChange={onColorChange} />
        </div>
      </ActionTip>
      <div className="w-px h-3 mx-0.5" style={{ background: 'var(--color-border-subtle)' }} />
      <ActionTip label="Delete">
        <button
          className="flex items-center px-2 py-1 rounded-full transition-colors hover:bg-red-500/80"
          style={{ color: 'var(--color-text-on-action)', cursor: 'default' }}
          onClick={e => { e.stopPropagation(); onDelete(); }}
          onPointerDown={e => e.stopPropagation()}
        >
          <Trash2 size={11} />
        </button>
      </ActionTip>
    </div>
  );
}
