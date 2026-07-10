import { Sun, Moon, Monitor, User, Palette, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeChoice, SettingsTab } from './types';

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
export const SETTINGS_MODAL_WIDTH = 720;
export const SETTINGS_MODAL_HEIGHT = 540;
export const SETTINGS_SIDEBAR_WIDTH = 180;
export const FEEDBACK_MODAL_WIDTH = 400;

/** Settings modal sidebar tabs: section key, label, and icon. */
export const SETTINGS_TABS: { key: SettingsTab; label: string; Icon: LucideIcon }[] = [
  { key: 'account', label: 'Account', Icon: User },
  { key: 'appearance', label: 'Appearance', Icon: Palette },
  { key: 'canvases', label: 'Canvases', Icon: Layers },
];

/** Feedback modal: the 1–5 mood scale and category options (max length lives in @/app/lib/constants). */
export const FEEDBACK_MOODS = [
  { value: 1, emoji: '😞', label: 'Awful' },
  { value: 2, emoji: '🙁', label: 'Poor' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
] as const;
export const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
  { value: 'praise', label: 'Praise' },
  { value: 'other', label: 'Other' },
] as const;

/** Stacking layers. */
export const Z_PANEL = 200;
export const Z_ACTION_DROPDOWN = 500;
export const Z_MODAL = 600;

/** Max canvas rows shown before the "Canvases" list scrolls within itself. */
export const MAX_VISIBLE_WORKSPACES = 5;

/** Timeouts (ms). */
export const COPY_FEEDBACK_MS = 2000;
export const DELETE_FOCUS_DELAY_MS = 50;
