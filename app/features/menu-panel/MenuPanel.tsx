'use client';
import { useEffect, useRef } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
  User, ChevronRight, Sun, Moon, Monitor,
  Plus, Upload, Download, Settings, Command, HelpCircle,
} from 'lucide-react';
import { APP_NAME, PANEL_WIDTH } from './constants';
import type { ThemeChoice } from '../canvas/hooks/useTheme';

interface Props {
  themeChoice: ThemeChoice;
  onSetTheme: (choice: ThemeChoice) => void;
  onClose: () => void;
}

/** Anchored dropdown menu panel that opens below the MenuButton. */
export default function MenuPanel({ themeChoice, onSetTheme, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  return (
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
        <div
          style={{
            width: 18, height: 18, borderRadius: 'var(--radius-md)',
            background: 'var(--brand-gradient)',
            flexShrink: 0,
          }}
        />
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {APP_NAME}
        </span>
      </div>

      {/* Account row */}
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
        style={{ height: 56, borderBottom: '1px solid var(--color-border-default)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1px dashed var(--color-border-default)',
            color: 'var(--color-text-muted)',
          }}
        >
          <User size={12} />
        </div>
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-[13px] font-medium leading-tight" style={{ color: 'var(--color-text-primary)' }}>Sign in</span>
          <span className="text-[11px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>Save your canvas</span>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </button>

      {/* Theme section */}
      <div className="pt-2 pb-2">
        <div
          className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
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
                    height: 28,
                    borderRadius: 'var(--radius-xl)',
                    fontSize: 11,
                    fontWeight: 500,
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    transition: 'color var(--duration-fast)',
                  }}
                  onClick={() => onSetTheme(choice)}
                >
                  {isActive && (
                    <motion.div
                      layoutId="theme-pill"
                      className="absolute inset-0"
                      style={{
                        borderRadius: 'var(--radius-xl)',
                        background: 'var(--color-surface-control-active)',
                        boxShadow: 'var(--shadow-float-sm)',
                      }}
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

      {/* Canvas section */}
      <div style={{ borderTop: '1px solid var(--color-border-default)' }} className="py-2">
        <div
          className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Canvas
        </div>
        <Row icon={<Plus size={14} />} label="New canvas" />
        <Row icon={<Upload size={14} />} label="Import" />
        <Row icon={<Download size={14} />} label="Export" />
      </div>

      {/* Settings group */}
      <div style={{ borderTop: '1px solid var(--color-border-default)' }} className="py-2">
        <Row icon={<Settings size={14} />} label="Settings" />
        <Row icon={<Command size={14} />} label="Keyboard shortcuts" shortcut="?" />
        <Row icon={<HelpCircle size={14} />} label="Help & feedback" />
      </div>
    </motion.div>
  );
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function Row({ icon, label, shortcut }: RowProps) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
      style={{ height: 'var(--row-height)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span className="flex-1 text-left text-[13px]" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      {shortcut && (
        <span
          className="text-[10px] font-mono rounded px-1.5 py-0.5 leading-none flex-shrink-0"
          style={{
            background: 'var(--color-bg-active)',
            color: 'var(--color-text-muted)',
          }}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}
