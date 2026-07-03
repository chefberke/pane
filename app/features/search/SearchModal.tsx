'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { getBlockLabel, TYPE_LABELS } from '@/app/features/blocks/utils';
import FilterChips from './FilterChips';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useSearchKeyboard } from './hooks/useSearchKeyboard';
import { EMPTY_HEIGHT, FOOTER_HEIGHT, INPUT_HEIGHT, LIST_MAX_HEIGHT, MODAL_WIDTH, ROW_HEIGHT } from './constants';
import type { GroupFilter, SearchModalProps, TypeFilter } from './types';

/** The ⌘K search modal: text search plus group and type filters over all blocks. */
export default function SearchModal({ blocks, frames, onClose, onNavigate }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    query, setQuery,
    groupFilter, setGroupFilter,
    typeFilter, setTypeFilter,
    results, groupOptions, showUngrouped, typeOptions,
  } = useSearchFilters(blocks, frames);

  const { activeIdx, setActiveIdx } = useSearchKeyboard(results, listRef, onClose, onNavigate);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // The canvas viewport has a native wheel listener that preventDefaults to pan/zoom.
  // Since the modal renders inside the viewport, stop wheel events here so the list
  // (and not the canvas behind it) scrolls under the mouse.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stop);
    return () => el.removeEventListener('wheel', stop);
  }, []);

  // Changing the query or a filter moves the highlight back to the first result.
  const changeQuery = useCallback((v: string) => { setQuery(v); setActiveIdx(0); }, [setQuery, setActiveIdx]);
  const selectGroup = useCallback((v: GroupFilter) => { setGroupFilter(v); setActiveIdx(0); }, [setGroupFilter, setActiveIdx]);
  const selectType = useCallback((v: TypeFilter) => { setTypeFilter(v); setActiveIdx(0); }, [setTypeFilter, setActiveIdx]);

  // Grouped, memoized prop bags for the memoized FilterChips child.
  const groups = useMemo(() => ({ options: groupOptions, showUngrouped }), [groupOptions, showUngrouped]);
  const selected = useMemo(() => ({ group: groupFilter, type: typeFilter }), [groupFilter, typeFilter]);
  const onSelect = useMemo(() => ({ group: selectGroup, type: selectType }), [selectGroup, selectType]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-start justify-center"
      style={{
        paddingTop: '16vh',
        background: 'var(--color-overlay-search)',
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl"
        style={{
          width: MODAL_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-modal)',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-5"
          style={{ height: INPUT_HEIGHT, borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => changeQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {query && (
            <button
              onClick={() => changeQuery('')}
              style={{ color: 'var(--color-text-muted)', fontSize: 13 }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <FilterChips groups={groups} types={typeOptions} selected={selected} onSelect={onSelect} />

        {/* List */}
        <div ref={listRef} className="ui-scrollbar" style={{ overflowY: 'auto', maxHeight: LIST_MAX_HEIGHT }}>
          {results.length === 0 ? (
            <div
              className="flex items-center justify-center text-[14px]"
              style={{ height: EMPTY_HEIGHT, color: 'var(--color-text-muted)' }}
            >
              No results
            </div>
          ) : (
            results.map((block, i) => (
              <button
                key={block.id}
                className="w-full flex items-center gap-3 px-5 text-left"
                style={{
                  height: ROW_HEIGHT,
                  background: i === activeIdx ? 'var(--color-bg-hover)' : 'transparent',
                }}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => onNavigate(block)}
              >
                <span
                  className="flex-1 truncate text-[15px]"
                  style={{ color: 'var(--color-text-primary)', fontWeight: i === activeIdx ? 500 : 400 }}
                >
                  {getBlockLabel(block)}
                </span>
                <span className="text-[12px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {TYPE_LABELS[block.type]}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div
            className="flex items-center px-5 text-[12px]"
            style={{
              height: FOOTER_HEIGHT,
              borderTop: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>↑↓ navigate · ↵ jump</span>
            <span className="ml-auto">{results.length} block{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
