'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Search } from 'lucide-react';
import type { Block } from '@/app/features/types';
import { getBlockLabel, TYPE_LABELS, groupBlocksByType, searchBlocks } from '@/app/features/blocks/utils';

interface Props {
  blocks: Block[];
  isDark: boolean;
  onClose: () => void;
  onNavigate: (block: Block) => void;
  onDelete: (id: string) => void;
}

/** Right-side sheet listing all canvas blocks grouped by type, with inline search. */
export default function ItemsSheet({ blocks, isDark, onClose, onNavigate, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = searchBlocks(blocks, query);
  const groups = groupBlocksByType(filtered);

  const bg = isDark ? '#161616' : '#fff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#d8d8d8' : '#111';
  const textMuted = isDark ? '#444' : '#ccc';
  const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

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

  // Auto-focus search input when sheet opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[250] flex justify-end"
        style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)', backdropFilter: 'blur(2px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="flex flex-col h-full"
          style={{
            width: 320,
            maxWidth: '90vw',
            background: bg,
            borderLeft: `1px solid ${border}`,
            boxShadow: isDark ? '-20px 0 40px rgba(0,0,0,0.6)' : '-20px 0 40px rgba(0,0,0,0.06)',
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
            style={{ height: 52, borderBottom: `1px solid ${border}` }}
          >
            <span className="flex-1 text-[13px] font-semibold" style={{ color: textPrimary }}>
              Items
              {blocks.length > 0 && (
                <span className="ml-2 text-[11px] font-normal" style={{ color: textMuted }}>
                  {blocks.length}
                </span>
              )}
            </span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ color: textMuted }}
              onClick={onClose}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = textPrimary; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = textMuted; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Search bar */}
          {blocks.length > 0 && (
            <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
              <div
                className="flex items-center gap-2 px-3 rounded-lg"
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  height: 32,
                }}
              >
                <Search size={12} style={{ color: textMuted, flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search items…"
                  className="items-search-input flex-1 bg-transparent outline-none text-[12px]"
                  style={{ color: textPrimary, caretColor: textPrimary, '--placeholder-color': textMuted } as React.CSSProperties}
                  onFocus={e => { e.currentTarget.style.opacity = '1'; }}
                />
                {query && (
                  <button
                    className="flex-shrink-0 cursor-pointer"
                    style={{ color: textMuted }}
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
                <span className="text-[13px]" style={{ color: isDark ? '#383838' : '#d0d0d0' }}>No items yet</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-[13px]" style={{ color: isDark ? '#383838' : '#d0d0d0' }}>No results</span>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.type} className="mt-4 first:mt-3">
                  <div
                    className="px-4 pb-1 text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: textMuted }}
                  >
                    {TYPE_LABELS[group.type]}
                  </div>
                  {group.items.map(block => (
                    <ItemRow
                      key={block.id}
                      block={block}
                      isDark={isDark}
                      textPrimary={textPrimary}
                      textMuted={textMuted}
                      hoverBg={hoverBg}
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
  isDark: boolean;
  textPrimary: string;
  textMuted: string;
  hoverBg: string;
  onNavigate: () => void;
  onDelete: () => void;
}

function ItemRow({ block, isDark, textPrimary, textMuted, hoverBg, onNavigate, onDelete }: ItemRowProps) {
  return (
    <button
      className="group w-full flex items-center gap-2 px-4 text-left cursor-pointer"
      style={{ height: 36 }}
      onClick={onNavigate}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span className="flex-1 truncate text-[13px]" style={{ color: textPrimary }}>
        {getBlockLabel(block)}
      </span>
      <span
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded"
        style={{ color: textMuted }}
        onClick={e => { e.stopPropagation(); onDelete(); }}
        onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = '#ef4444'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = textMuted; }}
      >
        <Trash2 size={12} />
      </span>
    </button>
  );
}
