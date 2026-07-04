'use client';
import { memo } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { THEME_OPTIONS } from './constants';
import type { ThemeChoice } from './types';

interface Props {
  themeChoice: ThemeChoice;
  onSetTheme: (choice: ThemeChoice) => void;
  /** Distinct id per mounted instance — the menu and settings switchers are both mounted
   *  at once, so they must not share a `layoutId` or their pills fight over the animation. */
  layoutId?: string;
}

/** Segmented light/dark/system theme control with an animated selection pill. */
function ThemeSwitcher({ themeChoice, onSetTheme, layoutId = 'theme-pill' }: Props) {
  return (
    <LayoutGroup>
      <div
        className="flex items-center p-0.5 gap-0.5"
        style={{ background: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-2xl)' }}
      >
        {THEME_OPTIONS.map(({ choice, Icon, label }) => {
          const isActive = themeChoice === choice;
          return (
            <button
              key={choice}
              type="button"
              className="relative flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
              style={{
                height: 34, borderRadius: 'var(--radius-xl)', fontSize: 12, fontWeight: 500,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                transition: 'color var(--duration-fast)',
              }}
              onClick={() => onSetTheme(choice)}
            >
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0"
                  style={{ borderRadius: 'var(--radius-xl)', background: 'var(--color-surface-control-active)', boxShadow: 'var(--shadow-float-sm)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={13} />
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export default memo(ThemeSwitcher);
