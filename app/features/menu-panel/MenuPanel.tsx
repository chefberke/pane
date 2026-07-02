'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/app/lib/db';
import { useAuth } from '../auth/hooks/useAuth';
import { exportFilename } from '../workspace/utils';
import type { ImportPreview } from '../workspace/types';
import { PANEL_WIDTH, Z_PANEL } from './constants';
import { useWorkspaceCrud } from './hooks/useWorkspaceCrud';
import { useActionMenu } from './hooks/useActionMenu';
import { useWorkspaceTransfer } from './hooks/useWorkspaceTransfer';
import type { ExportSource } from './hooks/useWorkspaceTransfer';
import BrandRow from './BrandRow';
import AccountRow from './AccountRow';
import WorkspaceList from './WorkspaceList';
import ThemeSwitcher from './ThemeSwitcher';
import SettingsGroup from './SettingsGroup';
import ActionDropdown from './ActionDropdown';
import RenameModal from './RenameModal';
import TrashModal from './TrashModal';
import DeleteModal from './DeleteModal';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';
import type { ThemeChoice, WorkspaceItem } from './types';

/** A pending export: what to export, the file name, and the dialog title. */
interface ExportTarget {
  title: string;
  filename: string;
  rows: ExportSource[];
}

interface Props {
  themeChoice: ThemeChoice;
  onSetTheme: (choice: ThemeChoice) => void;
  onClose: () => void;
}

/** Anchored dropdown menu panel that opens below the MenuButton. */
export default function MenuPanel({ themeChoice, onSetTheme, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, user } = useAuth();

  const [renameTarget, setRenameTarget] = useState<WorkspaceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const modalOpen = !!(renameTarget || deleteTarget || trashOpen || exportTarget || importPreview);

  const { workspaces, deletedWorkspaces, createCanvas, rename, softDelete, restore, deleteForever } =
    useWorkspaceCrud(user?.id ?? null, onClose);
  const { readImportFile, importWorkspaces } = useWorkspaceTransfer();

  const {
    hoveredId, setHoveredId, actionMenuId, setActionMenuId, actionMenuPos, openActionMenu, registerDotRef,
  } = useActionMenu(panelRef, onClose, modalOpen);

  const onNavigate = useCallback((id: string) => { onClose(); router.push(`/w/${id}`); }, [onClose, router]);

  const onExportAll = useCallback(() => {
    setExportTarget({ title: 'Export all canvases', filename: exportFilename(null), rows: workspaces });
  }, [workspaces]);

  const onPickImportFile = useCallback(() => fileInputRef.current?.click(), []);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so re-selecting the same file re-triggers change
    if (!file) return;
    setImportPreview(await readImportFile(file));
  }, [readImportFile]);

  const onConfirmImport = useCallback(async () => {
    if (!importPreview || importPreview.workspaces.length === 0) return;
    setImportBusy(true);
    try {
      const ids = await importWorkspaces(importPreview.workspaces);
      setImportPreview(null);
      if (ids.length === 1) { onClose(); router.push(`/w/${ids[0]}`); }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed.';
      setImportPreview(p => (p ? { ...p, errors: [...p.errors, message] } : p));
    } finally {
      setImportBusy(false);
    }
  }, [importPreview, importWorkspaces, onClose, router]);

  const actionMenu = useMemo(() => ({
    hoveredId,
    actionMenuId,
    onHoverChange: setHoveredId,
    onOpenActionMenu: openActionMenu,
    registerDotRef,
  }), [hoveredId, actionMenuId, setHoveredId, openActionMenu, registerDotRef]);

  const activeWs = actionMenuId ? workspaces.find(w => w.id === actionMenuId) ?? null : null;

  return (
    <>
      <motion.div
        ref={panelRef}
        className="absolute top-full left-0 mt-2 overflow-hidden"
        style={{
          width: PANEL_WIDTH,
          zIndex: Z_PANEL,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal)',
        }}
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
      >
        <BrandRow />

        <AccountRow
          isLoading={isLoading}
          email={user?.email ?? null}
          onSignIn={() => { onClose(); router.push('/sign-in?next=/w'); }}
          onSignOut={() => { db.auth.signOut().catch(() => {}); router.replace('/'); }}
        />

        <WorkspaceList
          workspaces={workspaces}
          currentPath={pathname}
          hasUser={!!user}
          onNavigate={onNavigate}
          onCreateCanvas={user ? createCanvas : undefined}
          onImport={onPickImportFile}
          actionMenu={actionMenu}
        />

        <ThemeSwitcher themeChoice={themeChoice} onSetTheme={onSetTheme} />

        <SettingsGroup
          hasUser={!!user}
          trashCount={deletedWorkspaces.length}
          canExportAll={workspaces.length > 0}
          onOpenTrash={() => setTrashOpen(true)}
          onExportAll={onExportAll}
        />
      </motion.div>

      {/* Hidden file input backing the "Import canvas…" action */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Trash modal */}
      {trashOpen && createPortal(
        <TrashModal
          workspaces={deletedWorkspaces}
          onRestore={restore}
          onDeleteForever={deleteForever}
          onClose={() => setTrashOpen(false)}
        />,
        document.body
      )}

      {/* 3-dot action dropdown — portal to escape overflow:hidden */}
      {actionMenuId && activeWs && createPortal(
        <ActionDropdown
          pos={actionMenuPos}
          onRename={() => { setRenameTarget(activeWs); setActionMenuId(null); }}
          onExport={() => {
            setExportTarget({ title: 'Export canvas', filename: exportFilename(activeWs.name), rows: [activeWs] });
            setActionMenuId(null);
          }}
          onDelete={() => { setDeleteTarget(activeWs); setActionMenuId(null); }}
          onClose={() => setActionMenuId(null)}
        />,
        document.body
      )}

      {/* Export modal — download or copy the selected canvas(es) as JSON */}
      {exportTarget && createPortal(
        <ExportModal
          title={exportTarget.title}
          rows={exportTarget.rows}
          filename={exportTarget.filename}
          onClose={() => setExportTarget(null)}
        />,
        document.body
      )}

      {/* Import modal — preview an import file, then create new workspaces */}
      {importPreview && createPortal(
        <ImportModal
          preview={importPreview}
          busy={importBusy}
          onConfirm={onConfirmImport}
          onClose={() => setImportPreview(null)}
        />,
        document.body
      )}

      {/* Rename modal */}
      {renameTarget && createPortal(
        <RenameModal
          workspace={renameTarget}
          onSave={async name => { await rename(renameTarget.id, name); setRenameTarget(null); }}
          onClose={() => setRenameTarget(null)}
        />,
        document.body
      )}

      {/* Delete modal */}
      {deleteTarget && createPortal(
        <DeleteModal
          workspace={deleteTarget}
          onConfirm={async () => { await softDelete(deleteTarget.id); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />,
        document.body
      )}
    </>
  );
}
