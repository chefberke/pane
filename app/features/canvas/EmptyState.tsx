'use client';
import { motion } from 'framer-motion';

/** Full-canvas welcome screen shown when no blocks exist. */
export default function EmptyState() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logo + name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          style={{
            width: 34, height: 34, borderRadius: 'var(--radius-lg)',
            background: 'var(--brand-gradient)',
            boxShadow: 'var(--shadow-brand-logo)',
            flexShrink: 0,
          }}
        />
        <span
          className="text-[22px] font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          pane
        </span>
      </div>

      {/* Tagline */}
      <p className="text-[13px] mb-8" style={{ color: 'var(--color-text-muted)' }}>
        your infinite canvas
      </p>

      {/* Hint card */}
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-bg-hint)',
          border: '1px solid var(--color-border-default)',
          minWidth: 252,
        }}
      >
        <HintRow action="Double-click" description="to add content" kbd={null} />
        <div style={{ height: 1, background: 'var(--color-border-subtle)', marginLeft: 14, marginRight: 14 }} />
        <HintRow action="Paste a URL" description="to embed anything" kbd="⌘V" />
        <div style={{ height: 1, background: 'var(--color-border-subtle)', marginLeft: 14, marginRight: 14 }} />
        <HintRow action="Search" description="to find blocks" kbd="⌘K" />
      </div>
    </motion.div>
  );
}

function HintRow({ action, description, kbd }: { action: string; description: string; kbd: string | null }) {
  return (
    <div className="flex items-center justify-between gap-6 px-3.5 py-2.5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[12.5px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{action}</span>
        <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>{description}</span>
      </div>
      {kbd && (
        <span
          className="text-[11px] font-mono rounded-md px-1.5 py-0.5 leading-none flex-shrink-0"
          style={{ background: 'var(--color-bg-active)', color: 'var(--color-text-muted)' }}
        >
          {kbd}
        </span>
      )}
    </div>
  );
}
