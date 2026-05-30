'use client';
import { memo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { THEME_OPTIONS } from './constants';
import type { ThemeChoice } from './types';

interface Props {
  themeChoice: ThemeChoice;
  onSetTheme: (choice: ThemeChoice) => void;
}

/** Segmented light/dark/system theme control with an animated selection pill. */
function ThemeSwitcher({ themeChoice, onSetTheme }: Props) {
  return (
    <div className="pt-2 pb-2" style={{ borderTop: '1px solid var(--color-border-default)' }}>
      <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
        Theme
      </div>
      <LayoutGroup>
        <div
          className="mx-3 flex items-center p-0.5 gap-0.5"
          style={{ background: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-2xl)' }}
        >
          {THEME_OPTIONS.map(({ choice, Icon, label }) => {
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
  );
}

export default memo(ThemeSwitcher);
