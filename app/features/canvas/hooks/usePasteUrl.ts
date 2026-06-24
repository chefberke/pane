import { useEffect, useRef, type RefObject } from 'react';

/** Listens for paste events and drops pasted URLs onto the canvas at the viewport center; raw pasted images are not stored, only hinted. */
export function usePasteUrl({
  viewportRef,
  addBlockFromUrl,
  onPasteImageBlocked,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  addBlockFromUrl: (url: string, screenX: number, screenY: number) => void;
  onPasteImageBlocked?: (screenX: number, screenY: number) => void;
}) {
  const addBlockFromUrlRef = useRef(addBlockFromUrl);
  useEffect(() => { addBlockFromUrlRef.current = addBlockFromUrl; }, [addBlockFromUrl]);
  const onPasteImageBlockedRef = useRef(onPasteImageBlocked);
  useEffect(() => { onPasteImageBlockedRef.current = onPasteImageBlocked; }, [onPasteImageBlocked]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = viewportRef.current;
      const cx = el ? el.clientWidth / 2 : 400;
      const cy = el ? el.clientHeight / 2 : 300;

      // Raw pasted images (e.g. screenshots) aren't stored — hint the user to paste a link instead.
      const imageFile = Array.from(e.clipboardData?.items ?? [])
        .find(item => item.kind === 'file' && item.type.startsWith('image/'))
        ?.getAsFile();
      if (imageFile) {
        e.preventDefault();
        onPasteImageBlockedRef.current?.(cx, cy);
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
