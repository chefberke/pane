'use client';
import { Plus } from 'lucide-react';
import WorkspaceRow from './WorkspaceRow';
import { Row } from './primitives';
import { MAX_VISIBLE_WORKSPACES } from './constants';
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
  actionMenu: ActionMenuBag;
}

/** The "Canvases" section: workspace rows plus the New canvas action. */
export default function WorkspaceList({
  workspaces, currentPath, hasUser, onNavigate, onCreateCanvas, actionMenu,
}: Props) {
  return (
    <div className="py-2">
      <div
        className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Canvases
      </div>

      {hasUser && (
        <div
          className="ui-scrollbar overflow-y-auto"
          style={{ maxHeight: `calc(var(--row-height) * ${MAX_VISIBLE_WORKSPACES})` }}
        >
          {workspaces.map(ws => (
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
        </div>
      )}

      <Row icon={<Plus size={14} />} label="New canvas" onClick={onCreateCanvas} />
    </div>
  );
}
