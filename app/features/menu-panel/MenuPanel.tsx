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
  isDark: boolean;
  themeChoice: ThemeChoice;
  onSetTheme: (choice: ThemeChoice) => void;
  onClose: () => void;
}

/** Anchored dropdown menu panel that opens below the MenuButton. */
export default function MenuPanel({ isDark, themeChoice, onSetTheme, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const bg = isDark ? '#161616' : '#fff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#d8d8d8' : '#111';
  const textMuted = isDark ? '#444' : '#ccc';
  const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const segBg = isDark ? '#2a2a2a' : '#f0f0f0';

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
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        boxShadow: isDark
          ? '0 20px 40px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)'
          : '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
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
        style={{ height: 44, borderBottom: `1px solid ${border}` }}
      >
        <div
          style={{
            width: 18, height: 18, borderRadius: 5,
            background: 'linear-gradient(135deg, #ff7a59, #ff3d68)',
            flexShrink: 0,
          }}
        />
        <span className="text-[13px] font-semibold tracking-tight" style={{ color: textPrimary }}>
          {APP_NAME}
        </span>
      </div>

      {/* Account row */}
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
        style={{ height: 56, borderBottom: `1px solid ${border}` }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `1px dashed ${border}`,
            color: textMuted,
          }}
        >
          <User size={12} />
        </div>
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-[13px] font-medium leading-tight" style={{ color: textPrimary }}>Sign in</span>
          <span className="text-[11px] leading-tight" style={{ color: textMuted }}>Save your canvas</span>
        </div>
        <ChevronRight size={14} style={{ color: textMuted, flexShrink: 0 }} />
      </button>

      {/* Theme section */}
      <div className="pt-2 pb-2">
        <div
          className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: textMuted }}
        >
          Theme
        </div>
        <LayoutGroup>
          <div
            className="mx-3 flex items-center p-0.5 gap-0.5"
            style={{ background: segBg, borderRadius: 11 }}
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
                    borderRadius: 9,
                    fontSize: 11,
                    fontWeight: 500,
                    color: isActive
                      ? (isDark ? '#eee' : '#1a1a1a')
                      : (isDark ? '#555' : '#aaa'),
                    transition: 'color 0.1s',
                  }}
                  onClick={() => onSetTheme(choice)}
                >
                  {isActive && (
                    <motion.div
                      layoutId="theme-pill"
                      className="absolute inset-0"
                      style={{
                        borderRadius: 9,
                        background: isDark ? '#444' : '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
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
      <div style={{ borderTop: `1px solid ${border}` }} className="py-2">
        <div
          className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: textMuted }}
        >
          Canvas
        </div>
        <Row icon={<Plus size={14} />} label="New canvas" hoverBg={hoverBg} textPrimary={textPrimary} textMuted={textMuted} isDark={isDark} />
        <Row icon={<Upload size={14} />} label="Import" hoverBg={hoverBg} textPrimary={textPrimary} textMuted={textMuted} isDark={isDark} />
        <Row icon={<Download size={14} />} label="Export" hoverBg={hoverBg} textPrimary={textPrimary} textMuted={textMuted} isDark={isDark} />
      </div>

      {/* Settings group */}
      <div style={{ borderTop: `1px solid ${border}` }} className="py-2">
        <Row icon={<Settings size={14} />} label="Settings" hoverBg={hoverBg} textPrimary={textPrimary} textMuted={textMuted} isDark={isDark} />
        <Row
          icon={<Command size={14} />}
          label="Keyboard shortcuts"
          hoverBg={hoverBg}
          textPrimary={textPrimary}
          textMuted={textMuted}
          isDark={isDark}
          shortcut="?"
        />
        <Row icon={<HelpCircle size={14} />} label="Help & feedback" hoverBg={hoverBg} textPrimary={textPrimary} textMuted={textMuted} isDark={isDark} />
      </div>
    </motion.div>
  );
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  hoverBg: string;
  textPrimary: string;
  textMuted: string;
  isDark: boolean;
  shortcut?: string;
}

function Row({ icon, label, hoverBg, textPrimary, textMuted, isDark, shortcut }: RowProps) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
      style={{ height: 36 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span style={{ color: textMuted, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span className="flex-1 text-left text-[13px]" style={{ color: textPrimary }}>{label}</span>
      {shortcut && (
        <span
          className="text-[10px] font-mono rounded px-1.5 py-0.5 leading-none flex-shrink-0"
          style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: textMuted,
          }}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}
