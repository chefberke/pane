import type { Block, Frame, FrameColor } from '@/app/features/types';

/** Props for the ⌘K search modal. */
export interface SearchModalProps {
  blocks: Block[];
  frames: Frame[];
  onClose: () => void;
  onNavigate: (block: Block) => void;
}

/** Selected group filter: `GROUP_ALL`, `GROUP_UNGROUPED`, or a specific frame id. */
export type GroupFilter = string;

/** Selected type filter: `TYPE_ALL` or a specific block type. */
export type TypeFilter = 'all' | Block['type'];

/** A selectable group (frame) shown in the filter row. */
export interface GroupOption {
  id: string;
  title: string;
  color: FrameColor;
}

/** Props for the FilterChips sub-component. */
export interface FilterChipsProps {
  groups: { options: GroupOption[]; showUngrouped: boolean };
  types: Block['type'][];
  selected: { group: GroupFilter; type: TypeFilter };
  onSelect: { group: (v: GroupFilter) => void; type: (v: TypeFilter) => void };
}
