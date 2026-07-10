'use client';
import { memo } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { SettingRow, Toggle } from './primitives';
import type { ThemeChoice } from './types';

interface Props {
  theme: { choice: ThemeChoice; onSet: (choice: ThemeChoice) => void };
  dotGrid: { enabled: boolean; onToggle: () => void };
}

/** Appearance section of the settings modal: theme selection and the canvas dot-grid toggle. */
function SettingsAppearance({ theme, dotGrid }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12px] font-semibold mb-2.5" style={{ color: 'var(--color-text-secondary)' }}>Theme</p>
        {/* Distinct layoutId — the menu switcher (theme-pill-menu) is mounted at the same time. */}
        <ThemeSwitcher themeChoice={theme.choice} onSetTheme={theme.onSet} layoutId="theme-pill-settings" />
      </div>
      <SettingRow label="Dot grid" description="Show a dotted background behind your canvas">
        <Toggle enabled={dotGrid.enabled} onToggle={dotGrid.onToggle} />
      </SettingRow>
    </div>
  );
}

export default memo(SettingsAppearance);
