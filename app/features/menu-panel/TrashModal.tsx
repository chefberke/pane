'use client';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, RotateCcw } from 'lucide-react';
import { ModalButton } from './primitives';
import DeleteModal from './DeleteModal';
import { TRASH_MODAL_WIDTH, Z_MODAL } from './constants';
import type { WorkspaceItem } from './types';

interface Props {
  workspaces: WorkspaceItem[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
  onClose: () => void;
}

/** Portaled trash list with restore and permanent-delete (confirmation) actions. */
function TrashModal({ workspaces, onRestore, onDeleteForever, onClose }: Props) {
  const [confirmTarget, setConfirmTarget] = useState<WorkspaceItem | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (confirmTarget) { setConfirmTarget(null); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, confirmTarget]);

  return (
    <div
      data-menu-portal
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_MODAL, background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col p-5 gap-4"
        style={{
          width: TRASH_MODAL_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Trash</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Deleted canvases can be restored or removed permanently.
          </p>
        </div>

        {workspaces.length === 0 ? (
          <p className="text-[13px] py-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
            Trash is empty.
          </p>
        ) : (
          <div className="flex flex-col max-h-72 overflow-y-auto -mx-1">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                className="flex items-center gap-2 px-1 rounded-lg"
                style={{ height: 'var(--row-height)' }}
              >
                <span className="flex-1 min-w-0 text-[13px] font-mono truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {ws.name}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 h-7 rounded-md cursor-pointer text-[12px]"
                  style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-sunken)', border: 'none' }}
                  onClick={() => onRestore(ws.id)}
                  title="Restore"
                >
                  <RotateCcw size={12} /> Restore
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-7 h-7 rounded-md cursor-pointer"
                  style={{ color: 'var(--color-text-danger)', background: 'transparent', border: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-danger-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  onClick={() => setConfirmTarget(ws)}
                  title="Delete forever"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <ModalButton label="Close" onClick={onClose} />
        </div>
      </div>

      {/* Permanent delete confirmation reuses the name-confirm DeleteModal */}
      {confirmTarget && createPortal(
        <DeleteModal
          workspace={confirmTarget}
          onConfirm={() => { onDeleteForever(confirmTarget.id); setConfirmTarget(null); }}
          onClose={() => setConfirmTarget(null)}
        />,
        document.body
      )}
    </div>
  );
}

export default memo(TrashModal);
