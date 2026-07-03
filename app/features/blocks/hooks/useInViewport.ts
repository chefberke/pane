'use client';
import { useEffect, useState, type RefObject } from 'react';

/**
 * Reports whether `ref`'s element is within `rootMargin` of the browser viewport (via
 * IntersectionObserver). Canvas blocks are CSS-transformed into place, so the observer sees their
 * true on-screen position — this drives lazy mounting of heavy embeds (iframes/PDF) that are far
 * offscreen. Returns `true` immediately (and never observes) when `enabled` is false, so lightweight
 * blocks pay nothing; when enabled it defaults to `false` so an offscreen embed never mounts, even
 * briefly, on load.
 */
export function useInViewport(ref: RefObject<Element | null>, rootMargin: string, enabled: boolean): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, enabled]);

  return enabled ? inView : true;
}
