'use client';
import { memo, useEffect, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import SettingsAccount from './SettingsAccount';
import SettingsAppearance from './SettingsAppearance';
import SettingsCanvases from './SettingsCanvases';
import { SETTINGS_MODAL_WIDTH, SETTINGS_MODAL_HEIGHT, SETTINGS_SIDEBAR_WIDTH, SETTINGS_TABS, Z_MODAL } from './constants';
import type { SettingsTab, ThemeChoice } from './types';

interface Props {
  theme: { choice: ThemeChoice; onSet: (choice: ThemeChoice) => void };
  dotGrid: { enabled: boolean; onToggle: () => void };
  account: {
    email: string | null;
    isAuthed: boolean;
    onSignIn: () => void;
    onSignUp: () => void;
    onSignOut: () => void;
  };
  canvases: { count: number; trashCount: number; isSynced: boolean; onOpenTrash: () => void };
  onClose: () => void;
}

/** Portaled two-pane settings dialog: sidebar tabs (account / appearance / canvases) + content. */
function SettingsModal({ theme, dotGrid, account, canvases, onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>('account');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The canvas viewport has a native wheel listener that pans/zooms; keep scroll inside the modal.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stop);
    return () => el.removeEventListener('wheel', stop);
  }, []);

  return (
    <div
      data-menu-portal
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_MODAL, background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={containerRef}
        className="flex flex-col overflow-hidden"
        style={{
          width: `min(${SETTINGS_MODAL_WIDTH}px, 92vw)`,
          height: `min(${SETTINGS_MODAL_HEIGHT}px, 86vh)`,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <Settings size={17} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <p className="flex-1 text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</p>
          <button
            type="button"
            aria-label="Close"
            className="flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex-1 flex min-h-0">
          <nav
            className="flex flex-col gap-0.5 py-3 px-2.5 flex-shrink-0"
            style={{ width: SETTINGS_SIDEBAR_WIDTH, borderRight: '1px solid var(--color-border-subtle)' }}
          >
            {SETTINGS_TABS.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  className="flex items-center gap-2.5 px-2.5 text-left cursor-pointer"
                  style={{
                    height: 34,
                    borderRadius: 'var(--radius-lg)',
                    background: active ? 'var(--color-bg-active)' : 'transparent',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    transition: 'background var(--duration-fast)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  onClick={() => setTab(key)}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {tab === 'account' && <SettingsAccount {...account} />}
            {tab === 'appearance' && <SettingsAppearance theme={theme} dotGrid={dotGrid} />}
            {tab === 'canvases' && <SettingsCanvases {...canvases} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SettingsModal);
