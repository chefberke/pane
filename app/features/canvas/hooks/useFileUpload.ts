'use client';
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Block } from '@/app/features/types';
import { db } from '@/app/lib/db';
import { BLOCK_SIZES, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE, IMAGE_OUTPUT_QUALITY, MAX_PDF_BYTES, UPLOAD_ERROR_MS } from '../constants';
import { uid, sanitizeFileName, downscaleImage } from '../utils';

interface Params {
  screenToCanvas: (sx: number, sy: number) => { x: number; y: number };
  setBlocks: Dispatch<SetStateAction<Block[]>>;
  pushSnapshot: () => void;
  setAddPos: (pos: { x: number; y: number } | null) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

/** Manages drag-drop / paste file uploads (image + PDF) and the transient upload-error flash. */
export function useFileUpload({ screenToCanvas, setBlocks, pushSnapshot, setAddPos, viewportRef }: Params) {
  const [uploadError, setUploadError] = useState<{ x: number; y: number; message: string } | null>(null);
  const uploadErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Shows a short-lived red error label at the given screen point. */
  const flashUploadError = useCallback((sx: number, sy: number, message: string) => {
    if (uploadErrorTimer.current) clearTimeout(uploadErrorTimer.current);
    setUploadError({ x: sx, y: sy, message });
    uploadErrorTimer.current = setTimeout(() => setUploadError(null), UPLOAD_ERROR_MS);
  }, []);
  useEffect(() => () => { if (uploadErrorTimer.current) clearTimeout(uploadErrorTimer.current); }, []);

  const handleUploadPdf = useCallback(async (file: File, sx: number, sy: number) => {
    setAddPos(null);
    if (file.size > MAX_PDF_BYTES) { flashUploadError(sx, sy, 'PDF too large (max 25MB)'); return; }
    const path = `pdfs/${uid()}-${sanitizeFileName(file.name)}`;
    const pos = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.pdf;
    const blockId = uid();
    // Show a loading placeholder immediately so large uploads don't feel stuck.
    pushSnapshot();
    setBlocks(prev => [...prev, {
      id: blockId, type: 'pdf', url: '', source: 'upload', filePath: path,
      title: file.name, x: pos.x - w / 2, y: pos.y - h / 2, uploading: true,
    }]);
    try {
      await db.storage.uploadFile(path, file);
      const downloadData = await db.storage.getDownloadUrl(path);
      const url: string = typeof downloadData === 'string' ? downloadData : downloadData?.data?.url ?? path;
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, url, uploading: false } : b));
    } catch (err) {
      console.error('PDF upload failed', err);
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    }
  }, [screenToCanvas, setBlocks, pushSnapshot, flashUploadError, setAddPos]);

  const handleUploadImage = useCallback(async (file: File, sx: number, sy: number) => {
    setAddPos(null);
    if (!file.type.startsWith('image/')) { console.warn('Not an image file', file.type); return; }
    if (file.size > MAX_IMAGE_BYTES) { flashUploadError(sx, sy, 'Image too large (max 30MB)'); return; }
    const pos = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.image;
    const blockId = uid();
    // Show a loading placeholder immediately so the downscale + upload don't feel stuck.
    pushSnapshot();
    setBlocks(prev => [...prev, {
      id: blockId, type: 'image', url: '', alt: file.name,
      x: pos.x - w / 2, y: pos.y - h / 2, uploading: true,
    }]);
    try {
      // Downscale + re-encode client-side to keep stored images small.
      const upload = await downscaleImage(file, MAX_IMAGE_EDGE, IMAGE_OUTPUT_QUALITY);
      const path = `images/${uid()}-${sanitizeFileName(upload.name)}`;
      await db.storage.uploadFile(path, upload);
      const downloadData = await db.storage.getDownloadUrl(path);
      const url: string = typeof downloadData === 'string' ? downloadData : downloadData?.data?.url ?? path;
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, url, uploading: false } : b));
    } catch (err) {
      console.error('Image upload failed', err);
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    }
  }, [screenToCanvas, setBlocks, pushSnapshot, flashUploadError, setAddPos]);

  /** Drop handler — adds dropped image / PDF files at the drop point. */
  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    e.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    const sx = rect ? e.clientX - rect.left : 400;
    const sy = rect ? e.clientY - rect.top : 300;
    for (const file of files) {
      if (file.type.startsWith('image/')) handleUploadImage(file, sx, sy);
      else if (file.type === 'application/pdf') handleUploadPdf(file, sx, sy);
    }
  }, [handleUploadImage, handleUploadPdf, viewportRef]);

  return { uploadError, flashUploadError, handleUploadPdf, handleUploadImage, handleDrop };
}
