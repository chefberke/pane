'use client';
import { Plus, FileUp } from 'lucide-react';
import WorkspaceRow from './WorkspaceRow';
import { Row } from './primitives';
import type { WorkspaceItem } from './types';

interface ActionMenuBag {
  hoveredId: string | null;
  actionMenuId: string | null;
  onHoverChange: (id: string | null) => void;
  onOpenActionMenu: (ws: WorkspaceItem) => void;
  registerDotRef: (id: string, el: HTMLButtonElement | null) => void;
}

interface Props {
  workspaces: WorkspaceItem[];
  currentPath: string;
  hasUser: boolean;
  onNavigate: (id: string) => void;
  onCreateCanvas?: () => void;
  onImport?: () => void;
  actionMenu: ActionMenuBag;
}

/** The "Canvases" section: workspace rows plus the New canvas and Import actions. */
export default function WorkspaceList({
  workspaces, currentPath, hasUser, onNavigate, onCreateCanvas, onImport, actionMenu,
}: Props) {
  return (
    <div className="py-2">
      <div
        className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Canvases
      </div>

      {hasUser && workspaces.map(ws => (
        <WorkspaceRow
          key={ws.id}
          ws={ws}
          isActive={currentPath === `/w/${ws.id}`}
          isHovered={actionMenu.hoveredId === ws.id}
          dotOpen={actionMenu.actionMenuId === ws.id}
          onHoverChange={actionMenu.onHoverChange}
          onNavigate={onNavigate}
          onOpenActionMenu={actionMenu.onOpenActionMenu}
          registerDotRef={actionMenu.registerDotRef}
        />
      ))}

      <Row icon={<Plus size={14} />} label="New canvas" onClick={onCreateCanvas} />
      {hasUser && <Row icon={<FileUp size={14} />} label="Import canvas…" onClick={onImport} />}
    </div>
  );
}
