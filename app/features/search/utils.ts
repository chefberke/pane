import type { Block, Frame } from '@/app/features/types';
import { searchBlocks } from '@/app/features/blocks/utils';
import { GROUP_ALL, GROUP_UNGROUPED, TYPE_ALL } from './constants';
import type { GroupFilter, GroupOption, TypeFilter } from './types';

/** Returns blocks matching the text query, the selected group, and the selected type (all AND-combined). */
export function applySearchFilters(
  blocks: Block[],
  query: string,
  groupFilter: GroupFilter,
  typeFilter: TypeFilter,
  groupMap: Map<string, string>,
): Block[] {
  let out = searchBlocks(blocks, query);
  if (groupFilter === GROUP_UNGROUPED) {
    out = out.filter(b => !groupMap.has(b.id));
  } else if (groupFilter !== GROUP_ALL) {
    out = out.filter(b => groupMap.get(b.id) === groupFilter);
  }
  if (typeFilter !== TYPE_ALL) {
    out = out.filter(b => b.type === typeFilter);
  }
  return out;
}

/** Lists frames that contain at least one block, as selectable group options (in frame order). */
export function listGroupOptions(frames: Frame[], groupMap: Map<string, string>): GroupOption[] {
  const withMembers = new Set(groupMap.values());
  return frames
    .filter(f => withMembers.has(f.id))
    .map(f => ({ id: f.id, title: f.title, color: f.color }));
}

/** Returns true when at least one block belongs to no group (frame). */
export function hasUngrouped(blocks: Block[], groupMap: Map<string, string>): boolean {
  return blocks.some(b => !groupMap.has(b.id));
}

/** Lists the block types present in the given blocks, in a stable display order. */
export function listAvailableTypes(blocks: Block[]): Block['type'][] {
  const order: Block['type'][] = ['link', 'youtube', 'twitter', 'image', 'text', 'pdf', 'spotify', 'map', 'github'];
  const present = new Set(blocks.map(b => b.type));
  return order.filter(t => present.has(t));
}
