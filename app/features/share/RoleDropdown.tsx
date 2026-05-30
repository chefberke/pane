'use client';
import { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ROLE_LABELS } from './constants';
import { DropdownItem } from './SharePrimitives';
import type { MemberRole } from './types';

interface Props {
  role: MemberRole;
  onChange: (r: MemberRole | 'remove') => void;
}

/** Role selector dropdown for an editable member, with a remove action. */
function RoleDropdown({ role, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1 text-[11px] cursor-pointer"
        style={{
          color:      'var(--color-text-muted)',
          background: 'transparent',
          border:     'none',
          padding:    '2px 4px',
          borderRadius: 6,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {ROLE_LABELS[role] ?? role}
        <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--color-surface)',
              border:     '1px solid var(--color-border-default)',
              boxShadow:  'var(--shadow-float)',
              minWidth:   130,
            }}
          >
            {(['viewer', 'editor'] as MemberRole[]).map(r => (
              <DropdownItem
                key={r}
                label={ROLE_LABELS[r]}
                active={role === r}
                onClick={() => { setOpen(false); onChange(r); }}
              />
            ))}
            <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '2px 0' }} />
            <DropdownItem
              label="Remove"
              danger
              onClick={() => { setOpen(false); onChange('remove'); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(RoleDropdown);
