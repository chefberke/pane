import { useEffect, useRef, type RefObject } from 'react';

/** Listens for paste events and drops pasted URLs onto the canvas at the viewport center. */
export function usePasteUrl({
  viewportRef,
  addBlockFromUrl,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  addBlockFromUrl: (url: string, screenX: number, screenY: number) => void;
}) {
  const addBlockFromUrlRef = useRef(addBlockFromUrl);
  useEffect(() => { addBlockFromUrlRef.current = addBlockFromUrl; }, [addBlockFromUrl]);

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
  }, [viewportRef]);
}
