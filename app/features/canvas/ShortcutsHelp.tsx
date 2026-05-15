'use client';
import { useEffect } from 'react';
import { SHORTCUTS } from './constants';

interface Props {
  onClose: () => void;
}

const CATEGORIES = ['Navigation', 'Blocks', 'Edit', 'View'] as const;

/** Keyboard shortcuts cheat-sheet modal, triggered by `?`. */
export default function ShortcutsHelp({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === '?') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'var(--color-overlay-modal)', backdropFilter: 'blur(4px)' }}
      onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-modal-lg)',
          width: 'var(--panel-width-modal)',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Keyboard shortcuts
          </span>
          <button
            className="text-xs px-2 py-1 rounded cursor-pointer"
            style={{
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-surface-sunken)',
            }}
            onClick={onClose}
          >
            Esc
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
          {CATEGORIES.map(cat => {
            const items = SHORTCUTS.filter(s => s.category === cat);
            return (
              <div key={cat}>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {cat}
                </p>
                <div className="space-y-1.5">
                  {items.map(s => (
                    <div key={s.label} className="flex items-center justify-between gap-3">
                      <span className="text-[12px]" style={{ color: 'var(--color-text-primary)' }}>{s.label}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {s.keys.map(k => (
                          <kbd
                            key={k}
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{
                              background: 'var(--color-surface-sunken)',
                              color: 'var(--color-text-secondary)',
                              fontFamily: 'inherit',
                              border: '1px solid var(--color-border-default)',
                            }}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
