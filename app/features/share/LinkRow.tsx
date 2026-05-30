'use client';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { IconBtn, DropdownItem } from './SharePrimitives';
import { shareUrl, copyToClipboard } from './utils';
import type { ShareLink } from './types';

interface Props {
  label: string;
  share: ShareLink | undefined;
  isOwner: boolean;
  isLoading: boolean;
  onCreate: () => Promise<ShareLink>;
  onRevoke: (id: string) => void;
  onRegenerate: (id: string) => Promise<ShareLink>;
}

/** One share-link row (view-only or editor) with copy + regenerate/revoke menu. */
function LinkRow({ label, share, isOwner, isLoading, onCreate, onRevoke, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    let target = share;
    if (!target && isOwner) {
      setCreating(true);
      target = await onCreate();
      setCreating(false);
    }
    if (!target) return;
    const ok = await copyToClipboard(shareUrl(target.token));
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1200); }
  }, [share, isOwner, onCreate]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const url = share ? shareUrl(share.token) : '';

  return (
    <div className="flex items-center gap-2.5" style={{ height: 36 }}>
      {/* Label */}
      <span
        className="text-[12px] flex-shrink-0"
        style={{ width: 70, color: 'var(--color-text-secondary)' }}
      >
        {label}
      </span>

      {/* URL — only shown once link exists */}
      {share && (
        <div className="flex-1 min-w-0">
          <span
            className="text-[11px] font-mono truncate block"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {url}
          </span>
        </div>
      )}
      {!share && (
        <span className="flex-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {creating ? 'Generating…' : 'No link yet'}
        </span>
      )}

      {/* Copy */}
      {(isOwner || share) && (
        <IconBtn onClick={handleCopy} disabled={creating || isLoading} title={copied ? 'Copied!' : 'Copy link'}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </IconBtn>
      )}

      {/* Revoke menu */}
      {isOwner && share && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <IconBtn onClick={() => setShowMenu(p => !p)} title="Options">
            <RotateCcw size={12} />
          </IconBtn>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 bottom-full mb-1 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'var(--color-surface)',
                  border:     '1px solid var(--color-border-default)',
                  boxShadow:  'var(--shadow-float)',
                  minWidth:   170,
                }}
              >
                <DropdownItem
                  label="Regenerate link"
                  onClick={async () => { setShowMenu(false); await onRegenerate(share.id); }}
                />
                <DropdownItem
                  label="Revoke link"
                  danger
                  onClick={() => { setShowMenu(false); onRevoke(share.id); }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default memo(LinkRow);
