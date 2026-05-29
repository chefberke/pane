'use client';
import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { assertHttpsUrl } from '@/app/features/canvas/utils';
import { LIGHTBOX_MIN_ZOOM, LIGHTBOX_MAX_ZOOM, LIGHTBOX_ZOOM_STEP, LIGHTBOX_DEFAULT_ZOOM } from './constants';

/** Props for the full-screen image viewer. */
interface Props {
  url: string;
  alt?: string;
  onClose: () => void;
}

const clamp = (z: number) => Math.min(LIGHTBOX_MAX_ZOOM, Math.max(LIGHTBOX_MIN_ZOOM, z));

const btnBase: React.CSSProperties = { color: 'var(--color-text-tertiary)', background: 'transparent' };
function onEnter(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--color-text-secondary)';
  e.currentTarget.style.background = 'var(--color-surface-raised-hover)';
}
function onLeave(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--color-text-tertiary)';
  e.currentTarget.style.background = 'transparent';
}

/** Full-screen lightbox for viewing an image with zoom in / out / reset controls. */
export default function ImageLightbox({ url, alt, onClose }: Props) {
  const [zoom, setZoom] = useState(LIGHTBOX_DEFAULT_ZOOM);
  const safeSrc = assertHttpsUrl(url);

  const zoomIn = useCallback(() => setZoom(z => clamp(z * LIGHTBOX_ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom(z => clamp(z / LIGHTBOX_ZOOM_STEP)), []);
  const reset = useCallback(() => setZoom(LIGHTBOX_DEFAULT_ZOOM), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); reset(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, zoomIn, zoomOut, reset]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => clamp(z * (e.deltaY < 0 ? LIGHTBOX_ZOOM_STEP : 1 / LIGHTBOX_ZOOM_STEP)));
  }, []);

  if (!safeSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--color-overlay-modal)', backdropFilter: 'blur(6px)' }}
      onPointerDown={onClose}
      onWheel={onWheel}
    >
      {/* Close button */}
      <button
        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors duration-100 cursor-pointer"
        style={{
          background: 'var(--color-surface-raised)',
          borderColor: 'var(--color-border-default)',
          boxShadow: 'var(--shadow-float)',
          ...btnBase,
        }}
        onPointerDown={e => { e.stopPropagation(); onClose(); }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        aria-label="Close"
      >
        <X size={15} strokeWidth={1.8} />
      </button>

      {/* Image — clicking it does not close the lightbox */}
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted URLs */}
      <img
        src={safeSrc}
        alt={alt ?? ''}
        className="max-w-[90vw] max-h-[85vh] object-contain select-none"
        style={{ transform: `scale(${zoom})`, transition: 'transform 120ms ease-out', cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
        draggable={false}
        referrerPolicy="no-referrer"
        onPointerDown={e => { e.stopPropagation(); if (zoom > 1) reset(); else zoomIn(); }}
      />

      {/* Zoom controls */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center rounded-2xl backdrop-blur-md border"
        style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)', boxShadow: 'var(--shadow-float)' }}
        onPointerDown={e => e.stopPropagation()}
      >
        <button
          className="w-9 h-9 flex items-center justify-center rounded-l-2xl transition-colors duration-100 cursor-pointer"
          style={btnBase}
          onClick={zoomOut}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          aria-label="Zoom out"
        >
          <Minus size={12} strokeWidth={1.6} />
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--color-border-default)', flexShrink: 0 }} />

        <button
          className="h-9 px-2 flex items-center justify-center transition-colors duration-100 tabular-nums cursor-pointer"
          style={{ ...btnBase, fontSize: 11, fontWeight: 600, minWidth: 42 }}
          onClick={reset}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>

        <div style={{ width: 1, height: 16, background: 'var(--color-border-default)', flexShrink: 0 }} />

        <button
          className="w-9 h-9 flex items-center justify-center rounded-r-2xl transition-colors duration-100 cursor-pointer"
          style={btnBase}
          onClick={zoomIn}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          aria-label="Zoom in"
        >
          <Plus size={12} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}
