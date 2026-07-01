import { RefObject, useLayoutEffect, useRef } from 'react';

/** Ref for an editable textarea that focuses on edit and grows to fit its content (no scrollbar). */
export function useAutoGrowTextarea(
  isEditing: boolean,
  content: string,
): RefObject<HTMLTextAreaElement | null> {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow to content height on edit-start and on every content change (pre-paint = no flicker).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !isEditing) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditing, content]);

  // Focus when entering edit mode.
  useLayoutEffect(() => {
    if (isEditing) ref.current?.focus();
  }, [isEditing]);

  return ref;
}
