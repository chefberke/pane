'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { Block } from '@/types';

/** Props for the ⌘K search modal. */
interface Props {
  blocks: Block[];
  isDark: boolean;
  onClose: () => void;
  onNavigate: (block: Block) => void;
}

/** Returns a human-readable label for a block, used for search and display. */
function getBlockLabel(block: Block): string {
  if (block.type === 'link') return block.title || block.url;
  if (block.type === 'youtube') return block.title || 'YouTube video';
  if (block.type === 'twitter') return `Tweet · ${block.url}`;
  if (block.type === 'image') return block.alt || block.url;
  if (block.type === 'text') return block.content || 'Empty note';
  return '';
}

const TYPE_LABELS: Record<Block['type'], string> = {
  link: 'Link',
  youtube: 'YouTube',
  twitter: 'Tweet',
  image: 'Image',
  text: 'Note',
};

export default function SearchModal({ blocks, isDark, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() =>
    query.trim()
      ? blocks.filter(b => getBlockLabel(b).toLowerCase().includes(query.toLowerCase()))
      : blocks,
  [blocks, query]);

  useEffect(() => { setActiveIdx(0); }, [query]);
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
      style={{ paddingTop: '16vh', background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[480px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl"
        style={{
          background: isDark ? '#161616' : '#fff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.1)',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4" style={{ height: 48, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          <Search size={14} style={{ color: isDark ? '#444' : '#bbb', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: isDark ? '#e0e0e0' : '#111' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: isDark ? '#444' : '#ccc', fontSize: 11 }}>
              Clear
            </button>
          )}
        </div>

        {/* List */}
        <div ref={listRef} style={{ overflowY: 'auto', maxHeight: 300 }}>
          {results.length === 0 ? (
            <div className="flex items-center justify-center text-[12px]" style={{ height: 80, color: isDark ? '#3a3a3a' : '#ccc' }}>
              No results
            </div>
          ) : (
            results.map((block, i) => (
              <button
                key={block.id}
                className="w-full flex items-center gap-3 px-4 text-left"
                style={{
                  height: 40,
                  background: i === activeIdx ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') : 'transparent',
                }}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => onNavigate(block)}
              >
                <span className="flex-1 truncate text-[13px]" style={{ color: isDark ? '#d0d0d0' : '#111', fontWeight: i === activeIdx ? 500 : 400 }}>
                  {getBlockLabel(block)}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: isDark ? '#333' : '#ccc' }}>
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
            style={{ height: 32, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, color: isDark ? '#2e2e2e' : '#d0d0d0' }}
          >
            <span>↑↓ navigate · ↵ jump</span>
            <span className="ml-auto">{results.length} block{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
