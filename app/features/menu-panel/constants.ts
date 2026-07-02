import { Sun, Moon, Monitor } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeChoice } from './types';

export const APP_NAME = 'pane';
export const PANEL_WIDTH = 240;
export const THEME_CHOICES = ['light', 'dark', 'system'] as const;

/** Theme switcher options: choice value, icon component, and label. */
export const THEME_OPTIONS: { choice: ThemeChoice; Icon: LucideIcon; label: string }[] = [
  { choice: 'light', Icon: Sun, label: 'Light' },
  { choice: 'dark', Icon: Moon, label: 'Dark' },
  { choice: 'system', Icon: Monitor, label: 'System' },
];

/** Action dropdown geometry (px). */
export const ACTION_MENU_WIDTH = 140;
export const ACTION_MENU_OFFSET_Y = 4;
export const ACTION_MENU_OFFSET_X = 100;

/** Modal widths (px). */
export const RENAME_MODAL_WIDTH = 340;
export const TRASH_MODAL_WIDTH = 380;
export const DELETE_MODAL_WIDTH = 360;
export const EXPORT_MODAL_WIDTH = 360;
export const IMPORT_MODAL_WIDTH = 380;

/** Stacking layers. */
export const Z_PANEL = 200;
export const Z_ACTION_DROPDOWN = 500;
export const Z_MODAL = 600;

/** Timeouts (ms). */
export const COPY_FEEDBACK_MS = 2000;
export const DELETE_FOCUS_DELAY_MS = 50;
