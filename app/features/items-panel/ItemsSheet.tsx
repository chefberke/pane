'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Search } from 'lucide-react';
import type { Block } from '@/app/features/types';
import { getBlockLabel, TYPE_LABELS, groupBlocksByType, searchBlocks } from '@/app/features/blocks/utils';

interface Props {
  blocks: Block[];
  onClose: () => void;
  onNavigate: (block: Block) => void;
  onDelete: (id: string) => void;
}

/** Right-side sheet listing all canvas blocks grouped by type, with inline search. */
export default function ItemsSheet({ blocks, onClose, onNavigate, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = searchBlocks(blocks, query);
  const groups = groupBlocksByType(filtered);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query) { setQuery(''); return; }
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, query]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[250] flex justify-end"
        style={{ background: 'var(--color-overlay-sheet)', backdropFilter: 'blur(2px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="flex flex-col h-full"
          style={{
            width: 'var(--panel-width-sheet)',
            maxWidth: '90vw',
            background: 'var(--color-surface)',
            borderLeft: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-sheet)',
          }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center px-4 flex-shrink-0"
            style={{ height: 52, borderBottom: '1px solid var(--color-border-default)' }}
          >
            <span className="flex-1 text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Items
              {blocks.length > 0 && (
                <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>
                  {blocks.length}
                </span>
              )}
            </span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={onClose}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Search bar */}
          {blocks.length > 0 && (
            <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
              <div
                className="flex items-center gap-2 px-3 rounded-lg"
                style={{
                  background: 'var(--color-surface-input)',
                  border: '1px solid var(--color-border-strong)',
                  height: 'var(--input-height)',
                }}
              >
                <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search items…"
                  className="items-search-input flex-1 bg-transparent outline-none text-[12px]"
                  style={{
                    color: 'var(--color-text-primary)',
                    caretColor: 'var(--color-text-primary)',
                    '--placeholder-color': 'var(--color-text-muted)',
                  } as React.CSSProperties}
                />
                {query && (
                  <button
                    className="flex-shrink-0 cursor-pointer"
                    style={{ color: 'var(--color-text-muted)' }}
                    onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>No items yet</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>No results</span>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.type} className="mt-4 first:mt-3">
                  <div
                    className="px-4 pb-1 text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {TYPE_LABELS[group.type]}
                  </div>
                  {group.items.map(block => (
                    <ItemRow
                      key={block.id}
                      block={block}
                      onNavigate={() => onNavigate(block)}
                      onDelete={() => onDelete(block.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ItemRowProps {
  block: Block;
  onNavigate: () => void;
  onDelete: () => void;
}

function ItemRow({ block, onNavigate, onDelete }: ItemRowProps) {
  return (
    <button
      className="group w-full flex items-center gap-2 px-4 text-left cursor-pointer"
      style={{ height: 'var(--row-height)' }}
      onClick={onNavigate}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span className="flex-1 truncate text-[13px]" style={{ color: 'var(--color-text-primary)' }}>
        {getBlockLabel(block)}
      </span>
      <span
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded"
        style={{ color: 'var(--color-text-muted)' }}
        onClick={e => { e.stopPropagation(); onDelete(); }}
        onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--danger)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--color-text-muted)'; }}
      >
        <Trash2 size={12} />
      </span>
    </button>
  );
}
