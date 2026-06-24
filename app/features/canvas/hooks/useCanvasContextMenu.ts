'use client';
import { useCallback } from 'react';
import { Plus, Type, BoxSelect, Maximize2, ExternalLink, Link2, MessageCircle, Copy, FolderPlus, FolderMinus, Trash2, Pencil } from 'lucide-react';
import type { Block, Frame, Connector, FrameColor } from '@/app/features/types';
import { useContextMenu } from '../../context-menu/hooks/useContextMenu';
import { blockShareUrl } from '../../context-menu/utils';
import type { ContextMenuRow, ContextMenuTarget } from '../../context-menu/types';
import type { FrameRenameRequest } from '../../frames/types';

interface ContextMenuActions {
  setAddPos: (pos: { x: number; y: number } | null) => void;
  addTextNoteAt: (sx: number, sy: number) => void;
  selectAll: () => void;
  resetView: () => void;
  handleOpenBlock: (block: Block) => void;
  handleOpenComments: (block: Block, anchor: { x: number; y: number }) => void;
  duplicateSelected: () => void;
  groupSelected: () => void;
  deleteSelectedAny: () => void;
  handleFrameColor: (id: string, color: FrameColor) => void;
  handleOpenFrameComments: (frame: Frame, anchor: { x: number; y: number }) => void;
  ungroupSelected: () => void;
  handleFrameDelete: (id: string) => void;
  setRenameFrameReq: (req: FrameRenameRequest | null) => void;
  deleteConnector: (id: string) => void;
}

interface Refs {
  blocksRef: React.RefObject<Block[]>;
  framesRef: React.RefObject<Frame[]>;
  connectorsRef: React.RefObject<Connector[]>;
}

/** Wraps the context-menu primitive and builds target-specific menu rows from a stable action bag. */
export function useCanvasContextMenu(actions: ContextMenuActions, refs: Refs) {
  const { menu, openMenu, closeMenu } = useContextMenu();
  const { blocksRef, framesRef, connectorsRef } = refs;

  /**
   * Builds context-menu rows for a target. Called from event handlers (not render), so reading the
   * latest blocks/frames/selection via refs here is safe and keeps the rows current.
   */
  const buildMenuRows = useCallback((target: ContextMenuTarget, sx: number, sy: number): ContextMenuRow[] => {
    if (target.kind === 'canvas') {
      return [
        { kind: 'action', label: 'Add content here', icon: Plus, onClick: () => actions.setAddPos({ x: sx, y: sy }) },
        { kind: 'action', label: 'Add text note here', icon: Type, shortcut: ['T'], onClick: () => actions.addTextNoteAt(sx, sy) },
        { kind: 'separator' },
        { kind: 'action', label: 'Select all', icon: BoxSelect, shortcut: ['⌘', 'A'], onClick: actions.selectAll, disabled: blocksRef.current.length === 0 },
        { kind: 'action', label: 'Reset view', icon: Maximize2, shortcut: ['0'], onClick: actions.resetView },
      ];
    }
    if (target.kind === 'block') {
      const block = blocksRef.current.find(b => b.id === target.id);
      if (!block) return [];
      const url = blockShareUrl(block);
      const rows: ContextMenuRow[] = [
        { kind: 'action', label: 'Open', icon: ExternalLink, onClick: () => actions.handleOpenBlock(block) },
      ];
      if (url) rows.push({ kind: 'action', label: 'Copy link', icon: Link2, onClick: () => { void navigator.clipboard?.writeText(url); } });
      rows.push(
        { kind: 'action', label: 'Comments', icon: MessageCircle, onClick: () => actions.handleOpenComments(block, { x: sx, y: sy }) },
        { kind: 'separator' },
        { kind: 'action', label: 'Duplicate', icon: Copy, shortcut: ['⌘', 'D'], onClick: actions.duplicateSelected },
        { kind: 'action', label: 'Group selected', icon: FolderPlus, shortcut: ['⌘', 'G'], onClick: actions.groupSelected },
        { kind: 'separator' },
        { kind: 'action', label: 'Delete', icon: Trash2, shortcut: ['⌫'], onClick: actions.deleteSelectedAny, danger: true },
      );
      return rows;
    }
    if (target.kind === 'connector') {
      const connector = connectorsRef.current.find(c => c.id === target.id);
      if (!connector) return [];
      return [
        { kind: 'action', label: 'Delete connector', icon: Trash2, shortcut: ['⌫'], onClick: () => actions.deleteConnector(connector.id), danger: true },
      ];
    }
    const frame = framesRef.current.find(f => f.id === target.id);
    if (!frame) return [];
    return [
      { kind: 'action', label: 'Rename', icon: Pencil, onClick: () => actions.setRenameFrameReq({ id: frame.id, n: Date.now() }) },
      { kind: 'color', current: frame.color, onSelect: c => actions.handleFrameColor(frame.id, c) },
      { kind: 'action', label: 'Comments', icon: MessageCircle, onClick: () => actions.handleOpenFrameComments(frame, { x: sx, y: sy }) },
      { kind: 'separator' },
      { kind: 'action', label: 'Ungroup', icon: FolderMinus, shortcut: ['⌘', '⇧', 'G'], onClick: actions.ungroupSelected },
      { kind: 'action', label: 'Delete', icon: Trash2, shortcut: ['⌫'], onClick: () => actions.handleFrameDelete(frame.id), danger: true },
    ];
  }, [actions, blocksRef, framesRef, connectorsRef]);

  return { menu, openMenu, closeMenu, buildMenuRows };
}
