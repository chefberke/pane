'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { Block } from '@/app/features/types';
import { getBlockLabel, TYPE_LABELS } from '@/app/features/blocks/utils';

/** Props for the ⌘K search modal. */
interface Props {
  blocks: Block[];
  onClose: () => void;
  onNavigate: (block: Block) => void;
}

export default function SearchModal({ blocks, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() =>
    query.trim()
      ? blocks.filter(b => getBlockLabel(b).toLowerCase().includes(query.toLowerCase()))
      : blocks,
  [blocks, query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const scrollActiveIntoView = useCallback((idx: number) => {
    const item = listRef.current?.children[idx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => { const n = Math.min(i + 1, results.length - 1); scrollActiveIntoView(n); return n; });
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => { const n = Math.max(i - 1, 0); scrollActiveIntoView(n); return n; });
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (results[activeIdx]) onNavigate(results[activeIdx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [results, activeIdx, onClose, onNavigate, scrollActiveIntoView]);

  return (
    <div
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
          width: 'var(--panel-width-modal)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-modal)',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Input */}
        <div
          className="flex items-center gap-2.5 px-4"
          style={{ height: 48, borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: 'var(--color-text-muted)', fontSize: 11 }}
            >
              Clear
            </button>
          )}
        </div>

        {/* List */}
        <div ref={listRef} style={{ overflowY: 'auto', maxHeight: 300 }}>
          {results.length === 0 ? (
            <div
              className="flex items-center justify-center text-[12px]"
              style={{ height: 80, color: 'var(--color-text-muted)' }}
            >
              No results
            </div>
          ) : (
            results.map((block, i) => (
              <button
                key={block.id}
                className="w-full flex items-center gap-3 px-4 text-left"
                style={{
                  height: 40,
                  background: i === activeIdx ? 'var(--color-bg-hover)' : 'transparent',
                }}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => onNavigate(block)}
              >
                <span
                  className="flex-1 truncate text-[13px]"
                  style={{ color: 'var(--color-text-primary)', fontWeight: i === activeIdx ? 500 : 400 }}
                >
                  {getBlockLabel(block)}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {TYPE_LABELS[block.type]}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div
            className="flex items-center px-4 text-[10px]"
            style={{
              height: 32,
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
