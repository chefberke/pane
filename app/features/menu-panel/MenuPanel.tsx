'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import {
  User, ChevronRight, Sun, Moon, Monitor,
  Plus, Settings, Command, HelpCircle, LogOut, Layers,
  MoreHorizontal, Pencil, Trash2, Copy, Check,
} from 'lucide-react';
import { APP_NAME, PANEL_WIDTH } from './constants';
import type { ThemeChoice } from '../canvas/hooks/useTheme';
import { db } from '@/app/lib/db';
import { useAuth } from '../auth/hooks/useAuth';

interface Props {
  themeChoice: ThemeChoice;
  onSetTheme: (choice: ThemeChoice) => void;
  onClose: () => void;
}

interface WorkspaceItem {
  id: string;
  name: string;
  createdAt: number;
}

/** Anchored dropdown menu panel that opens below the MenuButton. */
export default function MenuPanel({ themeChoice, onSetTheme, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, user } = useAuth();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState({ top: 0, left: 0 });
  const [renameTarget, setRenameTarget] = useState<WorkspaceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const dotBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const userId = user?.id ?? '__unauthenticated__';
  const { data: wsData } = db.useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspaces: { $: { where: { userId } as any } },
  });
  const workspaces: WorkspaceItem[] = ((wsData as { workspaces?: WorkspaceItem[] } | undefined)
    ?.workspaces ?? [])
    .slice()
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (actionMenuId) { setActionMenuId(null); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, actionMenuId]);

  useEffect(() => {
    // Don't close while a modal is open — the modal handles its own dismissal
    if (renameTarget || deleteTarget) return;
    const onDown = (e: MouseEvent) => {
      const inPanel = ref.current?.contains(e.target as Node);
      const inPortal = (e.target as Element)?.closest?.('[data-menu-portal]');
      if (!inPanel && !inPortal) {
        setActionMenuId(null);
        onClose();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose, renameTarget, deleteTarget]);

  const openActionMenu = useCallback((ws: WorkspaceItem) => {
    const btn = dotBtnRefs.current[ws.id];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setActionMenuPos({ top: rect.bottom + 4, left: rect.left - 100 });
    setActionMenuId(ws.id);
  }, []);

  const handleNewCanvas = async () => {
    if (!user) return;
    const wid = crypto.randomUUID();
    await db.transact(
      db.tx.workspaces[wid].update({
        userId: user.id,
        name: 'New canvas',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    onClose();
    router.push(`/w/${wid}`);
  };

  const handleRename = async (id: string, name: string) => {
    await db.transact(db.tx.workspaces[id].update({ name, updatedAt: Date.now() }));
    setRenameTarget(null);
  };

  const handleDelete = async (id: string) => {
    await db.transact(db.tx.workspaces[id].delete());
    setDeleteTarget(null);
    if (pathname === `/w/${id}`) router.replace('/w');
  };

  const activeWs = actionMenuId ? workspaces.find(w => w.id === actionMenuId) ?? null : null;

  return (
    <>
      <motion.div
        ref={ref}
        className="absolute top-full left-0 mt-2 z-[200] overflow-hidden"
        style={{
          width: PANEL_WIDTH,
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
        {/* Brand row */}
        <div
          className="flex items-center gap-2.5 px-3"
          style={{ height: 44, borderBottom: '1px solid var(--color-border-default)' }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 'var(--radius-md)', background: 'var(--brand-gradient)', flexShrink: 0 }} />
          <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            {APP_NAME}
          </span>
        </div>

        {/* Account row */}
        <AccountRow
          isLoading={isLoading}
          email={user?.email ?? null}
          onSignIn={() => { onClose(); router.push('/sign-in?next=/w'); }}
          onSignOut={() => { db.auth.signOut().catch(() => {}); router.replace('/'); }}
        />

        {/* Canvases section */}
        <div className="py-2">
          <div
            className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Canvases
          </div>

          {user && workspaces.map(ws => {
            const isActive = pathname === `/w/${ws.id}`;
            const isHovered = hoveredId === ws.id;
            const dotOpen = actionMenuId === ws.id;
            return (
              <div
                key={ws.id}
                className="relative flex items-center"
                style={{
                  height: 'var(--row-height)',
                  background: isActive ? 'var(--color-bg-active)' : isHovered ? 'var(--color-bg-hover)' : 'transparent',
                }}
                onMouseEnter={() => setHoveredId(ws.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Navigate button */}
                <button
                  type="button"
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pl-3"
                  style={{ height: '100%', paddingRight: isHovered || dotOpen ? 28 : 12, background: 'transparent', border: 'none' }}
                  onClick={() => { onClose(); router.push(`/w/${ws.id}`); }}
                >
                  <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex' }}>
                    <Layers size={14} />
                  </span>
                  <span className="flex-1 text-left text-[13px] font-mono truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {ws.name}
                  </span>
                </button>

                {/* 3-dot button */}
                {(isHovered || dotOpen) && (
                  <button
                    ref={el => { dotBtnRefs.current[ws.id] = el; }}
                    type="button"
                    className="absolute right-2 flex items-center justify-center cursor-pointer"
                    style={{
                      width: 20, height: 20,
                      borderRadius: 'var(--radius-md)',
                      background: dotOpen ? 'var(--color-bg-active)' : 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-active)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = dotOpen ? 'var(--color-bg-active)' : 'transparent'; }}
                    onClick={e => { e.stopPropagation(); openActionMenu(ws); }}
                  >
                    <MoreHorizontal size={13} />
                  </button>
                )}
              </div>
            );
          })}

          <Row icon={<Plus size={14} />} label="New canvas" onClick={user ? handleNewCanvas : undefined} />
        </div>

        {/* Theme section */}
        <div className="pt-2 pb-2" style={{ borderTop: '1px solid var(--color-border-default)' }}>
          <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            Theme
          </div>
          <LayoutGroup>
            <div
              className="mx-3 flex items-center p-0.5 gap-0.5"
              style={{ background: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-2xl)' }}
            >
              {([
                { choice: 'light' as ThemeChoice, Icon: Sun, label: 'Light' },
                { choice: 'dark' as ThemeChoice, Icon: Moon, label: 'Dark' },
                { choice: 'system' as ThemeChoice, Icon: Monitor, label: 'System' },
              ]).map(({ choice, Icon, label }) => {
                const isActive = themeChoice === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    className="relative flex-1 flex items-center justify-center gap-1 cursor-pointer"
                    style={{
                      height: 28, borderRadius: 'var(--radius-xl)', fontSize: 11, fontWeight: 500,
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                      transition: 'color var(--duration-fast)',
                    }}
                    onClick={() => onSetTheme(choice)}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="theme-pill"
                        className="absolute inset-0"
                        style={{ borderRadius: 'var(--radius-xl)', background: 'var(--color-surface-control-active)', boxShadow: 'var(--shadow-float-sm)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1">
                      <Icon size={11} />
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        {/* Settings group */}
        <div style={{ borderTop: '1px solid var(--color-border-default)' }} className="py-2">
          <Row icon={<Settings size={14} />} label="Settings" />
          <Row icon={<Command size={14} />} label="Keyboard shortcuts" shortcut="?" />
          <Row icon={<HelpCircle size={14} />} label="Help & feedback" />
        </div>
      </motion.div>

      {/* 3-dot action dropdown — portal to escape overflow:hidden */}
      {actionMenuId && activeWs && createPortal(
        <ActionDropdown
          pos={actionMenuPos}
          onRename={() => { setRenameTarget(activeWs); setActionMenuId(null); }}
          onDelete={() => { setDeleteTarget(activeWs); setActionMenuId(null); }}
          onClose={() => setActionMenuId(null)}
        />,
        document.body
      )}

      {/* Rename modal */}
      {renameTarget && createPortal(
        <RenameModal
          workspace={renameTarget}
          onSave={name => handleRename(renameTarget.id, name)}
          onClose={() => setRenameTarget(null)}
        />,
        document.body
      )}

      {/* Delete modal */}
      {deleteTarget && createPortal(
        <DeleteModal
          workspace={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />,
        document.body
      )}
    </>
  );
}

/* ─── Action dropdown ────────────────────────────────────────────────── */

function ActionDropdown({ pos, onRename, onDelete, onClose }: {
  pos: { top: number; left: number };
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-menu-portal
      className="fixed z-[500] overflow-hidden"
      style={{
        top: pos.top, left: pos.left,
        width: 140,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-modal)',
      }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
        style={{ height: 34, background: 'transparent', border: 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        onClick={onRename}
      >
        <Pencil size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <span className="text-[13px]" style={{ color: 'var(--color-text-primary)' }}>Rename</span>
      </button>
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
        style={{ height: 34, background: 'transparent', border: 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-danger-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        onClick={onDelete}
      >
        <Trash2 size={13} style={{ color: 'var(--color-text-danger)', flexShrink: 0 }} />
        <span className="text-[13px]" style={{ color: 'var(--color-text-danger)' }}>Delete</span>
      </button>
    </div>
  );
}

/* ─── Rename modal ───────────────────────────────────────────────────── */

function RenameModal({ workspace, onSave, onClose }: {
  workspace: WorkspaceItem;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(workspace.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <div
      data-menu-portal
      className="fixed inset-0 z-[600] flex items-center justify-center"
      style={{ background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col gap-4 p-5"
        style={{
          width: 340,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rename canvas</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Enter a new name for this canvas.</p>
        </div>
        <input
          ref={inputRef}
          className="w-full px-3 text-[13px] outline-none"
          style={{
            height: 36,
            background: 'var(--color-surface-input)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-primary)',
          }}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          placeholder="Canvas name"
        />
        <div className="flex justify-end gap-2">
          <ModalButton label="Cancel" onClick={onClose} />
          <ModalButton label="Save" primary onClick={handleSave} disabled={!value.trim()} />
        </div>
      </div>
    </div>
  );
}

/* ─── Delete modal ───────────────────────────────────────────────────── */

function DeleteModal({ workspace, onConfirm, onClose }: {
  workspace: WorkspaceItem;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmed = value === workspace.name;

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(workspace.name).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      data-menu-portal
      className="fixed inset-0 z-[600] flex items-center justify-center"
      style={{ background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col gap-4 p-5"
        style={{
          width: 360,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Delete canvas?</p>
          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            This will permanently delete <strong style={{ color: 'var(--color-text-primary)' }}>{workspace.name}</strong> and all its content. This action cannot be undone.
          </p>
        </div>

        {/* Name confirmation */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Type the canvas name to confirm
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold font-mono truncate" style={{ color: 'var(--color-text-primary)' }}>
              {workspace.name}
            </span>
            <button
              type="button"
              className="flex items-center justify-center flex-shrink-0 cursor-pointer"
              style={{
                width: 20, height: 20, borderRadius: 'var(--radius-md)',
                background: 'transparent', border: 'none',
                color: copied ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
              }}
              onClick={handleCopy}
              title="Copy name"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <input
            ref={inputRef}
            className="w-full px-3 text-[13px] outline-none"
            style={{
              height: 36,
              background: 'var(--color-surface-input)',
              border: `1px solid ${value && !confirmed ? 'var(--danger)' : 'var(--color-border-default)'}`,
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-primary)',
            }}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && confirmed) onConfirm(); }}
            placeholder={workspace.name}
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-2">
          <ModalButton label="Cancel" onClick={onClose} />
          <ModalButton label="Delete" danger onClick={onConfirm} disabled={!confirmed} />
        </div>
      </div>
    </div>
  );
}

/* ─── Shared modal button ────────────────────────────────────────────── */

function ModalButton({ label, onClick, primary, danger, disabled }: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const bg = danger
    ? 'var(--danger)'
    : primary
    ? 'var(--color-surface-action)'
    : 'var(--color-surface-sunken)';
  const color = danger || primary ? 'var(--color-text-on-action)' : 'var(--color-text-primary)';

  return (
    <button
      type="button"
      className="px-4 text-[13px] font-medium cursor-pointer"
      style={{
        height: 32,
        borderRadius: 'var(--radius-lg)',
        background: bg,
        color,
        border: 'none',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
    >
      {label}
    </button>
  );
}

/* ─── AccountRow ─────────────────────────────────────────────────────── */

function AccountRow({ isLoading, email, onSignIn, onSignOut }: {
  isLoading: boolean;
  email: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  if (isLoading) {
    return (
      <div
        className="w-full flex items-center gap-2.5 px-3"
        style={{ height: 56, borderBottom: '1px solid var(--color-border-default)', opacity: 0.5 }}
      >
        <div className="flex-shrink-0" style={{ width: 28, height: 28, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-sunken)' }} />
        <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
      </div>
    );
  }

  if (email) {
    const initial = email[0]?.toUpperCase() ?? '?';
    return (
      <div style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <div className="w-full flex items-center gap-2.5 px-3" style={{ height: 56 }}>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-lg)', background: 'var(--brand-gradient)', color: 'var(--color-text-on-action)', fontSize: 12, fontWeight: 600 }}
          >
            {initial}
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-[13px] font-medium leading-tight truncate w-full text-left" style={{ color: 'var(--color-text-primary)' }}>{email}</span>
            <span className="text-[11px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>Signed in</span>
          </div>
        </div>
        <button
          type="button"
          className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
          style={{ height: 'var(--row-height)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          onClick={onSignOut}
        >
          <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex' }}><LogOut size={14} /></span>
          <span className="flex-1 text-left text-[13px]" style={{ color: 'var(--color-text-primary)' }}>Sign out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
      style={{ height: 56, borderBottom: '1px solid var(--color-border-default)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      onClick={onSignIn}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 28, height: 28, borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border-default)', color: 'var(--color-text-muted)' }}
      >
        <User size={12} />
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-[13px] font-medium leading-tight" style={{ color: 'var(--color-text-primary)' }}>Sign in</span>
        <span className="text-[11px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>Save your canvas</span>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
    </button>
  );
}

/* ─── Row ────────────────────────────────────────────────────────────── */

function Row({ icon, label, shortcut, onClick }: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
      style={{ height: 'var(--row-height)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      onClick={onClick}
    >
      <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span className="flex-1 text-left text-[13px]" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      {shortcut && (
        <span className="text-[10px] font-mono rounded px-1.5 py-0.5 leading-none flex-shrink-0" style={{ background: 'var(--color-bg-active)', color: 'var(--color-text-muted)' }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}
