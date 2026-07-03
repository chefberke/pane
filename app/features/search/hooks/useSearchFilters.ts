import { useMemo, useState } from 'react';
import type { Block, Frame } from '@/app/features/types';
import { buildBlockFrameMap } from '@/app/features/frames/utils';
import { GROUP_ALL, TYPE_ALL } from '../constants';
import type { GroupFilter, TypeFilter } from '../types';
import { applySearchFilters, hasUngrouped, listAvailableTypes, listGroupOptions } from '../utils';

/** Owns the search query + group/type filters and derives the filtered results and available filter options. */
export function useSearchFilters(blocks: Block[], frames: Frame[]) {
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(GROUP_ALL);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(TYPE_ALL);

  const groupMap = useMemo(() => buildBlockFrameMap(blocks, frames), [blocks, frames]);
  const groupOptions = useMemo(() => listGroupOptions(frames, groupMap), [frames, groupMap]);
  const showUngrouped = useMemo(() => hasUngrouped(blocks, groupMap), [blocks, groupMap]);
  const typeOptions = useMemo(() => listAvailableTypes(blocks), [blocks]);

  const results = useMemo(
    () => applySearchFilters(blocks, query, groupFilter, typeFilter, groupMap),
    [blocks, query, groupFilter, typeFilter, groupMap],
  );

  return {
    query, setQuery,
    groupFilter, setGroupFilter,
    typeFilter, setTypeFilter,
    results, groupOptions, showUngrouped, typeOptions,
  };
}
