'use client';
import { memo } from 'react';
import type { ReactNode } from 'react';
import { FRAME_COLORS } from '@/app/features/frames/constants';
import { TYPE_LABELS } from '@/app/features/blocks/utils';
import { CHIP_HEIGHT, GROUP_ALL, GROUP_UNGROUPED, SWATCH_SIZE, TYPE_ALL } from './constants';
import type { FilterChipsProps } from './types';

/** A single selectable filter chip. */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-2.5 text-[11px] whitespace-nowrap"
      style={{
        height: CHIP_HEIGHT,
        background: active ? 'var(--color-bg-hover)' : 'transparent',
        border: `1px solid ${active ? 'var(--color-border-default)' : 'var(--color-border-subtle)'}`,
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        fontWeight: active ? 500 : 400,
      }}
    >
      {children}
    </button>
  );
}

/** Group + type filter chip rows shown between the search input and the results list. */
function FilterChips({ groups, types, selected, onSelect }: FilterChipsProps) {
  const showGroupRow = groups.options.length > 0;
  const showTypeRow = types.length > 1;
  if (!showGroupRow && !showTypeRow) return null;

  return (
    <div
      className="flex flex-col gap-1.5 px-4 py-2.5"
      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
    >
      {showGroupRow && (
        <div className="flex flex-wrap gap-1.5">
          <Chip active={selected.group === GROUP_ALL} onClick={() => onSelect.group(GROUP_ALL)}>
            All groups
          </Chip>
          {groups.options.map(g => (
            <Chip key={g.id} active={selected.group === g.id} onClick={() => onSelect.group(g.id)}>
              <span
                style={{
                  width: SWATCH_SIZE,
                  height: SWATCH_SIZE,
                  borderRadius: '50%',
                  background: FRAME_COLORS[g.color].swatch,
                  flexShrink: 0,
                }}
              />
              <span className="max-w-[120px] truncate">{g.title}</span>
            </Chip>
          ))}
          {groups.showUngrouped && (
            <Chip active={selected.group === GROUP_UNGROUPED} onClick={() => onSelect.group(GROUP_UNGROUPED)}>
              Ungrouped
            </Chip>
          )}
        </div>
      )}

      {showTypeRow && (
        <div className="flex flex-wrap gap-1.5">
          <Chip active={selected.type === TYPE_ALL} onClick={() => onSelect.type(TYPE_ALL)}>
            All types
          </Chip>
          {types.map(t => (
            <Chip key={t} active={selected.type === t} onClick={() => onSelect.type(t)}>
              {TYPE_LABELS[t]}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(FilterChips);
