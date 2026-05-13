'use client';
import { useEffect } from 'react';
import { SHORTCUTS } from './constants';

interface Props {
  isDark: boolean;
  onClose: () => void;
}

const CATEGORIES = ['Navigation', 'Blocks', 'Edit', 'View'] as const;

/** Keyboard shortcuts cheat-sheet modal, triggered by `?`. */
export default function ShortcutsHelp({ isDark, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === '?') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const bg = isDark ? '#1a1a1a' : '#fff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const headingColor = isDark ? '#555' : '#bbb';
  const labelColor = isDark ? '#c0c0c0' : '#333';
  const keyBg = isDark ? '#2a2a2a' : '#f0f0f0';
  const keyColor = isDark ? '#aaa' : '#555';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
      onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: bg,
          border: `1px solid ${border}`,
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.8)' : '0 24px 64px rgba(0,0,0,0.12)',
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <span className="text-sm font-semibold" style={{ color: labelColor }}>Keyboard shortcuts</span>
          <button
            className="text-xs px-2 py-1 rounded"
            style={{ color: headingColor, background: keyBg }}
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
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: headingColor }}>{cat}</p>
                <div className="space-y-1.5">
                  {items.map(s => (
                    <div key={s.label} className="flex items-center justify-between gap-3">
                      <span className="text-[12px]" style={{ color: labelColor }}>{s.label}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {s.keys.map(k => (
                          <kbd
                            key={k}
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: keyBg, color: keyColor, fontFamily: 'inherit', border: `1px solid ${border}` }}
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
