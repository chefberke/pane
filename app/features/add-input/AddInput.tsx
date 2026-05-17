'use client';
import { useState, useEffect, useRef } from 'react';
import { Paperclip } from 'lucide-react';

/** Props for the double-click popover that lets users type a URL or note. */
interface Props {
  /** Viewport-relative X position of the popover center. */
  x: number;
  /** Viewport-relative Y position of the popover center. */
  y: number;
  onSubmit: (value: string) => void;
  /** Called when the user selects a PDF file to upload. */
  onUploadPdf?: (file: File) => void;
  onClose: () => void;
}

export default function AddInput({ x, y, onSubmit, onUploadPdf, onClose }: Props) {
  const [value, setValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') onSubmit(value);
    else if (e.key === 'Escape') onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPdf) return;
    setUploading(true);
    try {
      await onUploadPdf(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="absolute z-50 backdrop-blur-md rounded-2xl overflow-hidden w-80"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-modal)',
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
    >
      <div className="flex items-center">
        <input
          ref={ref}
          type="text"
          className="flex-1 text-sm px-4 py-3.5 outline-none bg-transparent"
          style={{ color: 'var(--color-text-primary)' }}
          placeholder="Paste a URL or type a note..."
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {onUploadPdf && (
          <>
            <button
              className="px-3 py-3.5 transition-colors hover:opacity-70 shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
              title={uploading ? 'Uploading…' : 'Upload PDF'}
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              onPointerDown={e => e.stopPropagation()}
            >
              <Paperclip size={14} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {uploading ? 'Uploading PDF…' : 'Enter to add · Esc to cancel'}
        </span>
        <button
          className="text-xs font-medium transition-colors text-blue-500 hover:text-blue-400"
          onClick={() => onSubmit(value)}
        >
          Add
        </button>
      </div>
    </div>
  );
}
