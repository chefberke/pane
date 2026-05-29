import { useEffect, useRef, type RefObject } from 'react';

/** Listens for paste events and drops pasted URLs (or images) onto the canvas at the viewport center. */
export function usePasteUrl({
  viewportRef,
  addBlockFromUrl,
  onPasteImage,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  addBlockFromUrl: (url: string, screenX: number, screenY: number) => void;
  onPasteImage?: (file: File, screenX: number, screenY: number) => void;
}) {
  const addBlockFromUrlRef = useRef(addBlockFromUrl);
  useEffect(() => { addBlockFromUrlRef.current = addBlockFromUrl; }, [addBlockFromUrl]);
  const onPasteImageRef = useRef(onPasteImage);
  useEffect(() => { onPasteImageRef.current = onPasteImage; }, [onPasteImage]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = viewportRef.current;
      const cx = el ? el.clientWidth / 2 : 400;
      const cy = el ? el.clientHeight / 2 : 300;

      // Pasted image (e.g. screenshot) takes priority over text.
      const imageFile = Array.from(e.clipboardData?.items ?? [])
        .find(item => item.kind === 'file' && item.type.startsWith('image/'))
        ?.getAsFile();
      if (imageFile && onPasteImageRef.current) {
        e.preventDefault();
        onPasteImageRef.current(imageFile, cx, cy);
        return;
      }

      const text = e.clipboardData?.getData('text')?.trim();
      if (!text || (!/^https?:\/\//i.test(text) && !text.startsWith('<iframe'))) return;
      e.preventDefault();
      addBlockFromUrlRef.current(text, cx, cy);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [viewportRef]);
}
