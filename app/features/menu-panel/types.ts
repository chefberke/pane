import type { THEME_CHOICES, FEEDBACK_CATEGORIES } from './constants';

export type ThemeChoice = typeof THEME_CHOICES[number];

/** A feedback category the user picks in the feedback modal. */
export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number]['value'];

/** A feedback submission drafted in the feedback modal, POSTed to /api/feedback. */
export interface FeedbackDraft {
  mood: string;               // mood label, e.g. 'Okay' (not the 1–5 value)
  category: FeedbackCategory;
  message: string;
  path?: string;
}

/** A workspace/canvas row as stored in InstantDB. */
export interface WorkspaceItem {
  id: string;
  name: string;
  createdAt: number;
  deletedAt?: number;
  /** Serialized canvas state; present on loaded rows, used for export. */
  stateJson?: string;
}
