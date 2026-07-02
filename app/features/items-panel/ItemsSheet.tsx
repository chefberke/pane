'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Search, ChevronDown, ChevronRight, Pin, PinOff,
  Link as LinkIcon, Image as ImageIcon, Play, MessageCircle, FileText, Music, Map as MapIcon, Code2, StickyNote,
} from 'lucide-react';
import type { Block, Frame } from '@/app/features/types';
import { getBlockLabel, groupBlocksByType, searchBlocks } from '@/app/features/blocks/utils';
import { buildBlockFrameMap } from '@/app/features/frames/utils';
import { FRAME_COLORS } from '@/app/features/frames/constants';

interface Props {
  blocks: Block[];
  frames: Frame[];
  onClose: () => void;
  onNavigate: (block: Block) => void;
  onNavigateFrame: (frame: Frame) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

/** Right-side sheet listing canvas blocks: pinned items, then frame sections, then ungrouped by type. */
export default function ItemsSheet({ blocks, frames, onClose, onNavigate, onNavigateFrame, onDelete, onTogglePin }: Props) {
  const [query, setQuery] = useState('');
  const [collapsedFrames, setCollapsedFrames] = useState<Set<string>>(new Set());
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => searchBlocks(blocks, query), [blocks, query]);
  const blockFrameMap = useMemo(() => buildBlockFrameMap(blocks, frames), [blocks, frames]);

  const pinnedBlocks = useMemo(() => filtered.filter(b => b.pinned), [filtered]);

  const { byFrame, ungrouped } = useMemo(() => {
    const byFrame = new Map<string, Block[]>();
    const ungrouped: Block[] = [];
    for (const b of filtered) {
      const fid = blockFrameMap.get(b.id);
      if (fid && frames.some(f => f.id === fid)) {
        const arr = byFrame.get(fid) ?? [];
        arr.push(b);
        byFrame.set(fid, arr);
      } else {
        ungrouped.push(b);
      }
    }
    return { byFrame, ungrouped };
  }, [filtered, blockFrameMap, frames]);

  const q = query.toLowerCase().trim();
  const visibleFrames = useMemo(() => frames.filter(f => {
    if (!q) return true;
    if (f.title.toLowerCase().includes(q)) return true;
    return (byFrame.get(f.id)?.length ?? 0) > 0;
  }), [frames, byFrame, q]);

  const ungroupedTypeGroups = useMemo(() => groupBlocksByType(ungrouped), [ungrouped]);

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

  // The canvas viewport has a native wheel listener that preventDefaults to pan/zoom.
  // Since the sheet renders inside the viewport, stop wheel events here so the sheet
  // (and not the canvas behind it) scrolls under the mouse.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stop);
    return () => el.removeEventListener('wheel', stop);
  }, []);

  const toggleFrame = (id: string) => {
    setCollapsedFrames(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hasResults = pinnedBlocks.length > 0 || visibleFrames.length > 0 || ungrouped.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
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
              {(blocks.length > 0 || frames.length > 0) && (
                <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>
                  {blocks.length}{frames.length > 0 ? ` · ${frames.length} ${frames.length === 1 ? 'group' : 'groups'}` : ''}
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
          <div className="ui-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-1">
            {blocks.length === 0 && frames.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>No items yet</span>
              </div>
            ) : !hasResults ? (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>No results</span>
              </div>
            ) : (
              <>
                {pinnedBlocks.length > 0 && (
                  <Section
                    label="Pinned"
                    leading={<Pin size={11} strokeWidth={2.4} style={{ color: 'var(--color-text-secondary)' }} />}
                    count={pinnedBlocks.length}
                    collapsed={pinnedCollapsed}
                    onToggle={() => setPinnedCollapsed(p => !p)}
                  >
                    {pinnedBlocks.map(block => (
                      <ItemRow
                        key={block.id}
                        block={block}
                        hidePinnedIndicator
                        onNavigate={() => onNavigate(block)}
                        onDelete={() => onDelete(block.id)}
                        onTogglePin={() => onTogglePin(block.id)}
                      />
                    ))}
                  </Section>
                )}

                {visibleFrames.map(frame => (
                  <Section
                    key={frame.id}
                    label={frame.title}
                    leading={
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: FRAME_COLORS[frame.color].swatch }}
                      />
                    }
                    count={byFrame.get(frame.id)?.length ?? 0}
                    collapsed={collapsedFrames.has(frame.id)}
                    onToggle={() => toggleFrame(frame.id)}
                    onLabelClick={() => onNavigateFrame(frame)}
                  >
                    {(byFrame.get(frame.id) ?? []).length === 0 ? (
                      <div
                        className="flex items-center pl-9 pr-4 text-[11px] italic"
                        style={{ height: 'var(--row-height)', color: 'var(--color-text-tertiary)' }}
                      >
                        Empty
                      </div>
                    ) : (
                      (byFrame.get(frame.id) ?? []).map(block => (
                        <ItemRow
                          key={block.id}
                          block={block}
                          onNavigate={() => onNavigate(block)}
                          onDelete={() => onDelete(block.id)}
                          onTogglePin={() => onTogglePin(block.id)}
                        />
                      ))
                    )}
                  </Section>
                ))}

                {ungroupedTypeGroups.length > 0 && (
                  <div className={visibleFrames.length > 0 || pinnedBlocks.length > 0 ? 'mt-2' : ''}>
                    {(visibleFrames.length > 0 || pinnedBlocks.length > 0) && (
                      <SectionDivider label="Other" />
                    )}
                    {ungroupedTypeGroups.flatMap(group => group.items).map(block => (
                      <ItemRow
                        key={block.id}
                        block={block}
                        onNavigate={() => onNavigate(block)}
                        onDelete={() => onDelete(block.id)}
                        onTogglePin={() => onTogglePin(block.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface SectionProps {
  label: string;
  leading: React.ReactNode;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onLabelClick?: () => void;
  children: React.ReactNode;
}

/** Lightweight collapsible group header with chevron + leading badge + label + count. */
function Section({ label, leading, count, collapsed, onToggle, onLabelClick, children }: SectionProps) {
  return (
    <div className="mt-2 first:mt-0">
      <div
        className="group flex items-center gap-1.5 px-3 cursor-pointer transition-colors"
        style={{ height: 28 }}
        onClick={onToggle}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span
          className="flex items-center justify-center w-4 h-4 flex-shrink-0"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </span>
        {leading}
        {onLabelClick ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onLabelClick(); }}
            className="flex-1 min-w-0 text-left truncate text-[12px] font-semibold cursor-pointer"
            style={{ color: 'var(--color-text-primary)' }}
            title="Center on canvas"
          >
            {label}
          </button>
        ) : (
          <span
            className="flex-1 min-w-0 text-left truncate text-[12px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {label}
          </span>
        )}
        <span
          className="text-[10px] tabular-nums flex-shrink-0"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {count}
        </span>
      </div>
      {!collapsed && children}
    </div>
  );
}

/** Subtle divider with a label, used between frame sections and ungrouped items. */
function SectionDivider({ label }: { label: string }) {
  return (
    <div
      className="px-3 pt-3 pb-1 text-[10px] font-medium uppercase tracking-widest"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {label}
    </div>
  );
}

interface ItemRowProps {
  block: Block;
  hidePinnedIndicator?: boolean;
  onNavigate: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

function ItemRow({ block, hidePinnedIndicator, onNavigate, onDelete, onTogglePin }: ItemRowProps) {
  const pinned = block.pinned === true;
  const showPinIndicator = pinned && !hidePinnedIndicator;
  return (
    <button
      className="group w-full flex items-center gap-2.5 text-left cursor-pointer overflow-hidden"
      style={{
        height: 32,
        paddingLeft: 28,
        paddingRight: 8,
      }}
      onClick={onNavigate}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span
        className="flex items-center justify-center flex-shrink-0"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {renderTypeIcon(block, 12)}
      </span>
      <span className="flex-1 min-w-0 truncate text-[12.5px]" style={{ color: 'var(--color-text-primary)' }}>
        {getBlockLabel(block)}
      </span>

      {/* Always-visible pin indicator slot (fixed width so hover doesn't shift layout) */}
      <span className="w-3 flex-shrink-0 flex items-center justify-center">
        {showPinIndicator && (
          <Pin size={10} style={{ color: 'var(--color-text-muted)' }} />
        )}
      </span>

      {/* Hover actions */}
      <span
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded"
        style={{ color: pinned ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}
        onClick={e => { e.stopPropagation(); onTogglePin(); }}
        title={pinned ? 'Unpin' : 'Pin'}
        onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--color-text-primary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = pinned ? 'var(--color-text-secondary)' : 'var(--color-text-muted)'; }}
      >
        {pinned ? <PinOff size={12} /> : <Pin size={12} />}
      </span>
      <span
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 rounded"
        style={{ color: 'var(--color-text-muted)' }}
        onClick={e => { e.stopPropagation(); onDelete(); }}
        title="Delete"
        onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--danger)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--color-text-muted)'; }}
      >
        <Trash2 size={12} />
      </span>
    </button>
  );
}

function renderTypeIcon(block: Block, size: number) {
  const stroke = 2;
  switch (block.type) {
    case 'link':    return <LinkIcon size={size} strokeWidth={stroke} />;
    case 'image':   return <ImageIcon size={size} strokeWidth={stroke} />;
    case 'youtube': return <Play size={size} strokeWidth={stroke} />;
    case 'twitter': return <MessageCircle size={size} strokeWidth={stroke} />;
    case 'pdf':     return <FileText size={size} strokeWidth={stroke} />;
    case 'spotify': return <Music size={size} strokeWidth={stroke} />;
    case 'map':     return <MapIcon size={size} strokeWidth={stroke} />;
    case 'github':  return <Code2 size={size} strokeWidth={stroke} />;
    case 'text':    return <StickyNote size={size} strokeWidth={stroke} />;
  }
}
