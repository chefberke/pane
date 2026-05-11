'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Block, LinkBlock } from '@/types';
import BlockContainer from '../blocks/Block';
import AddInput from '../add-input/AddInput';
import Toolbar from '../toolbar/Toolbar';
import SearchModal from '../search/SearchModal';
import { MIN_SCALE, MAX_SCALE, ZOOM_STEP, DRAG_THRESHOLD, MARQUEE_THRESHOLD, DOT_GRID_SIZE, BLOCK_SIZES } from './constants';
import { uid, detectType, extractYouTubeId, extractTweetId } from './utils';
import type { Marquee } from './types';

/** Infinite pan/zoom canvas — manages blocks, viewport transforms, and all keyboard shortcuts. */
export default function Canvas() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addPos, setAddPos] = useState<{ x: number; y: number } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const isMarqueeing = useRef(false);
  const marqueeStart = useRef({ x: 0, y: 0 });
  const marqueeRef = useRef<Marquee | null>(null);
  const didDrag = useRef(false);
  const spaceHeld = useRef(false);

  // Stable refs so event handlers can read latest values without stale closures
  const offsetRef = useRef(offset);
  const scaleRef = useRef(scale);
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);

  // Theme — respects saved preference, falls back to system preference
  useEffect(() => {
    const saved = localStorage.getItem('termal-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('termal-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  // Persist blocks to localStorage
  useEffect(() => {
    try { const saved = localStorage.getItem('termal-blocks'); if (saved) setBlocks(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('termal-blocks', JSON.stringify(blocks)); } catch { /* ignore */ }
  }, [blocks]);

  // Center canvas on mount
  useEffect(() => {
    const el = viewportRef.current;
    if (el) setOffset({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
  }, []);

  // Pinch/wheel zoom anchored to cursor position
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      const prev = scaleRef.current;
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
      const ratio = next / prev;
      const nextOffset = {
        x: cx - (cx - offsetRef.current.x) * ratio,
        y: cy - (cy - offsetRef.current.y) * ratio,
      };
      scaleRef.current = next;
      offsetRef.current = nextOffset;
      setScale(next);
      setOffset(nextOffset);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Space bar activates temporary pan mode
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const active = document.activeElement;
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      spaceHeld.current = true;
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      spaceHeld.current = false;
      isPanning.current = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  const screenToCanvas = useCallback((sx: number, sy: number) => ({
    x: (sx - offsetRef.current.x) / scaleRef.current,
    y: (sy - offsetRef.current.y) / scaleRef.current,
  }), []);

  /** Scales around the viewport center by `factor`. */
  const zoomBy = useCallback((factor: number) => {
    setScale(s => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor));
      const el = viewportRef.current;
      if (el) {
        const cx = el.clientWidth / 2;
        const cy = el.clientHeight / 2;
        setOffset(o => ({ x: cx - (cx - o.x) * (next / s), y: cy - (cy - o.y) * (next / s) }));
      }
      return next;
    });
  }, []);

  /** Resets scale to 1 and re-centers the viewport. */
  const resetView = useCallback(() => {
    setScale(1);
    const el = viewportRef.current;
    if (el) setOffset({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
  }, []);

  /** Adds a blank text note at the viewport center. */
  const addTextNote = useCallback(() => {
    const el = viewportRef.current;
    const sx = el ? el.clientWidth / 2 : 400;
    const sy = el ? el.clientHeight / 2 : 300;
    const pos = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.text;
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '', x: pos.x - w / 2, y: pos.y - h / 2 }]);
  }, [screenToCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const inInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') { setSelectedIds(new Set()); setAddPos(null); setIsSearchOpen(false); }

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0 && !inInput) {
        setBlocks(prev => prev.filter(b => !selectedIdsRef.current.has(b.id)));
        setSelectedIds(new Set());
      }

      if (inInput) return;

      if (e.key === 'v' || e.key === 'V') setIsPanMode(false);
      if (e.key === 'h' || e.key === 'H') setIsPanMode(true);
      if (e.key === 't' || e.key === 'T') addTextNote();
      if (e.key === 'd' || e.key === 'D') toggleTheme();
      if (e.key === '0') resetView();
      if ((e.key === '=' || e.key === '+') && !e.metaKey && !e.ctrlKey) zoomBy(ZOOM_STEP);
      if (e.key === '-' && !e.metaKey && !e.ctrlKey) zoomBy(1 / ZOOM_STEP);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addTextNote, toggleTheme, resetView, zoomBy]);

  const addBlockFromUrl = useCallback(async (url: string, screenX: number, screenY: number) => {
    const pos = screenToCanvas(screenX, screenY);
    const type = detectType(url);

    if (type === 'youtube') {
      const videoId = extractYouTubeId(url);
      if (!videoId) return;
      const { w, h } = BLOCK_SIZES.youtube;
      setBlocks(prev => [...prev, { id: uid(), type: 'youtube', videoId, x: pos.x - w / 2, y: pos.y - h / 2 }]);
      return;
    }
    if (type === 'twitter') {
      const tweetId = extractTweetId(url);
      if (!tweetId) return;
      const { w, h } = BLOCK_SIZES.twitter;
      setBlocks(prev => [...prev, { id: uid(), type: 'twitter', tweetId, url, x: pos.x - w / 2, y: pos.y - h / 2 }]);
      return;
    }
    if (type === 'image') {
      const { w, h } = BLOCK_SIZES.image;
      setBlocks(prev => [...prev, { id: uid(), type: 'image', url, x: pos.x - w / 2, y: pos.y - h / 2 }]);
      return;
    }

    const id = uid();
    const { w, h } = BLOCK_SIZES.link;
    setBlocks(prev => [...prev, { id, type: 'link', url, loading: true, x: pos.x - w / 2, y: pos.y - h / 2 }]);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setBlocks(prev => prev.map(b => b.id === id
        ? { ...b, loading: false, title: data.title, description: data.description, image: data.image, favicon: data.favicon }
        : b
      ));
    } catch {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, loading: false } : b));
    }
  }, [screenToCanvas]);

  const addBlockFromUrlRef = useRef(addBlockFromUrl);
  useEffect(() => { addBlockFromUrlRef.current = addBlockFromUrl; }, [addBlockFromUrl]);

  // Paste a URL anywhere on the canvas to drop it at the viewport center
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text')?.trim();
      if (!text || !/^https?:\/\//i.test(text)) return;
      e.preventDefault();
      const el = viewportRef.current;
      addBlockFromUrlRef.current(text, el ? el.clientWidth / 2 : 400, el ? el.clientHeight / 2 : 300);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const handleMultiDragMove = useCallback((dx: number, dy: number) => {
    selectedIdsRef.current.forEach(id => {
      const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
      if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  }, []);

  const handleMultiDragEnd = useCallback((dx: number, dy: number) => {
    selectedIdsRef.current.forEach(id => {
      const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
      if (el) el.style.transform = '';
    });
    setBlocks(prev => prev.map(b =>
      selectedIdsRef.current.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } as Block : b
    ));
  }, []);

  const handleBlockSelect = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds(prev => {
      if (shiftKey) {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }
      // Keep group selected when clicking into a multi-selection (allows group drag)
      if (prev.size > 1 && prev.has(id)) return prev;
      return new Set([id]);
    });
  }, []);

  const handleBlockClickEnd = useCallback((id: string, wasDragged: boolean) => {
    // Plain click inside a multi-selection → collapse to single
    if (!wasDragged && selectedIdsRef.current.size > 1 && selectedIdsRef.current.has(id)) {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (spaceHeld.current || isPanMode))) {
      isPanning.current = true;
      panOrigin.current = { mx: e.clientX, my: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
      return;
    }
    if (e.button !== 0) return;

    const rect = viewportRef.current!.getBoundingClientRect();
    isMarqueeing.current = true;
    didDrag.current = false;
    marqueeStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!e.shiftKey) setSelectedIds(new Set());
  }, [isPanMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panOrigin.current.mx;
      const dy = e.clientY - panOrigin.current.my;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) didDrag.current = true;
      setOffset({ x: panOrigin.current.ox + dx, y: panOrigin.current.oy + dy });
      return;
    }
    if (isMarqueeing.current) {
      const rect = viewportRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (Math.abs(mx - marqueeStart.current.x) > MARQUEE_THRESHOLD || Math.abs(my - marqueeStart.current.y) > MARQUEE_THRESHOLD) {
        didDrag.current = true;
        const m: Marquee = {
          x1: Math.min(marqueeStart.current.x, mx),
          y1: Math.min(marqueeStart.current.y, my),
          x2: Math.max(marqueeStart.current.x, mx),
          y2: Math.max(marqueeStart.current.y, my),
        };
        marqueeRef.current = m;
        setMarquee(m);
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (!isMarqueeing.current) return;

    isMarqueeing.current = false;
    const m = marqueeRef.current;
    if (!m) return;

    const viewport = viewportRef.current;
    if (viewport) {
      const vRect = viewport.getBoundingClientRect();
      const newSelected = new Set<string>();
      document.querySelectorAll('[data-block-id]').forEach(el => {
        const bRect = (el as HTMLElement).getBoundingClientRect();
        const bx1 = bRect.left - vRect.left;
        const by1 = bRect.top - vRect.top;
        const bx2 = bRect.right - vRect.left;
        const by2 = bRect.bottom - vRect.top;
        if (bx1 < m.x2 && bx2 > m.x1 && by1 < m.y2 && by2 > m.y1) {
          newSelected.add((el as HTMLElement).dataset.blockId!);
        }
      });
      if (newSelected.size > 0) setSelectedIds(newSelected);
    }
    marqueeRef.current = null;
    setMarquee(null);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (didDrag.current) return;
    const rect = viewportRef.current!.getBoundingClientRect();
    setAddPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleAddSubmit = useCallback((value: string, sx: number, sy: number) => {
    setAddPos(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    if (/^https?:\/\//i.test(trimmed)) {
      addBlockFromUrl(trimmed, sx, sy);
    } else {
      const pos = screenToCanvas(sx, sy);
      const { w, h } = BLOCK_SIZES.text;
      setBlocks(prev => [...prev, { id: uid(), type: 'text', content: trimmed, x: pos.x - w / 2, y: pos.y - h / 2 }]);
    }
  }, [addBlockFromUrl, screenToCanvas]);

  const refreshEmbeds = useCallback(async () => {
    const linkBlocks = blocks.filter(b => b.type === 'link') as LinkBlock[];
    if (!linkBlocks.length) return;
    setIsRefreshing(true);
    setBlocks(prev => prev.map(b => b.type === 'link' ? { ...b, loading: true } : b));
    await Promise.all(linkBlocks.map(async b => {
      try {
        const res = await fetch(`/api/preview?url=${encodeURIComponent(b.url)}`);
        const data = await res.json();
        setBlocks(prev => prev.map(p => p.id === b.id
          ? { ...p, loading: false, title: data.title, description: data.description, image: data.image, favicon: data.favicon }
          : p
        ));
      } catch {
        setBlocks(prev => prev.map(p => p.id === b.id ? { ...p, loading: false } : p));
      }
    }));
    setIsRefreshing(false);
  }, [blocks]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } as Block : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const navigateToBlock = useCallback((block: Block) => {
    setIsSearchOpen(false);
    setSelectedIds(new Set([block.id]));
    const el = viewportRef.current;
    if (!el) return;
    const { w, h } = BLOCK_SIZES[block.type];
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    setScale(1);
    setOffset({ x: cx - (block.x + w / 2), y: cy - (block.y + h / 2) });
  }, []);

  const inPanMode = isPanMode || spaceHeld.current;
  const gridSize = DOT_GRID_SIZE * scale;

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: isDark ? '#161616' : '#f1f0ee',
        cursor: isPanning.current ? 'grabbing' : inPanMode ? 'grab' : 'default',
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDark ? '#2e2e2e' : '#c8c5bf'} 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${offset.x % gridSize}px ${offset.y % gridSize}px`,
        }}
      />

      {/* Canvas world */}
      <div
        className="absolute"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', willChange: 'transform' }}
      >
        {blocks.map(block => (
          <BlockContainer
            key={block.id}
            block={block}
            scale={scale}
            selected={selectedIds.has(block.id)}
            isInMultiSelection={selectedIds.size > 1 && selectedIds.has(block.id)}
            onSelect={handleBlockSelect}
            onClickEnd={handleBlockClickEnd}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
            onMultiDragMove={handleMultiDragMove}
            onMultiDragEnd={handleMultiDragEnd}
          />
        ))}
      </div>

      {/* Marquee selection box */}
      {marquee && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: marquee.x1,
            top: marquee.y1,
            width: marquee.x2 - marquee.x1,
            height: marquee.y2 - marquee.y1,
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            borderRadius: 3,
          }}
        />
      )}

      {addPos && (
        <AddInput
          x={addPos.x}
          y={addPos.y}
          onSubmit={val => handleAddSubmit(val, addPos.x, addPos.y)}
          onClose={() => setAddPos(null)}
        />
      )}

      {isSearchOpen && (
        <SearchModal
          blocks={blocks}
          isDark={isDark}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={navigateToBlock}
        />
      )}

      <Toolbar
        scale={scale}
        blockCount={blocks.length}
        isDark={isDark}
        isPanMode={isPanMode}
        hasRefreshable={blocks.some(b => b.type === 'link')}
        isRefreshing={isRefreshing}
        onToggleTheme={toggleTheme}
        onTogglePanMode={() => setIsPanMode(p => !p)}
        onSearch={() => setIsSearchOpen(true)}
        onRefresh={refreshEmbeds}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
        onReset={resetView}
        onAddText={addTextNote}
        onClear={() => {
          if (window.confirm('Remove all blocks from the canvas?')) { setBlocks([]); setSelectedIds(new Set()); }
        }}
      />

      {blocks.length === 0 && !addPos && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <p className="text-gray-400 dark:text-[#4a4a4a] text-base font-medium">Double-click anywhere to add content</p>
          <p className="text-gray-300 dark:text-[#363636] text-sm mt-1">Or paste a URL to place it on the canvas</p>
        </div>
      )}
    </div>
  );
}
