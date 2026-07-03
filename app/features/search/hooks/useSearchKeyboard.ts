import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { Block } from '@/app/features/types';

/** Owns the highlighted result index plus arrow/enter/escape navigation and scroll-into-view for the results list. */
export function useSearchKeyboard(
  results: Block[],
  listRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  onNavigate: (block: Block) => void,
) {
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollActiveIntoView = useCallback((idx: number) => {
    const item = listRef.current?.children[idx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [listRef]);

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

  return { activeIdx, setActiveIdx };
}
