'use client';
import { motion, type Variants } from 'framer-motion';

/** Stagger container — reveals children in sequence. */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Single fade-and-rise item used for every staggered child. */
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/** Full-canvas welcome screen shown when no blocks exist. */
export default function EmptyState() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
    >
      {/* Logo + name */}
      <motion.div className="flex items-center gap-3 mb-3" variants={item}>
        <motion.div
          style={{
            width: 36, height: 36, borderRadius: 'var(--radius-lg)',
            background: 'var(--brand-gradient)',
            boxShadow: 'var(--shadow-brand-logo)',
            flexShrink: 0,
          }}
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.05 }}
        />
        <span
          className="text-[22px] font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          pane
        </span>
      </motion.div>

      {/* Tagline */}
      <motion.p className="text-[13px] mb-7" style={{ color: 'var(--color-text-muted)' }} variants={item}>
        your infinite canvas
      </motion.p>

      {/* Hint card */}
      <motion.div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-bg-hint)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-card)',
          minWidth: 288,
        }}
        variants={item}
      >
        <HintRow icon={<PlusIcon />} action="Double-click" description="to add content" kbd={null} />
        <Divider />
        <HintRow icon={<LinkIcon />} action="Paste a URL" description="to embed anything" kbd="⌘V" />
        <Divider />
        <HintRow icon={<SearchIcon />} action="Search" description="to find blocks" kbd="⌘K" />
      </motion.div>
    </motion.div>
  );
}

/** Hairline separator between hint rows. */
function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border-subtle)', marginLeft: 14, marginRight: 14 }} />;
}

function HintRow({ icon, action, description, kbd }: { icon: React.ReactNode; action: string; description: string; kbd: string | null }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 28, height: 28, borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {icon}
      </span>
      <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
        <span className="text-[12.5px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{action}</span>
        <span className="text-[12px] truncate" style={{ color: 'var(--color-text-muted)' }}>{description}</span>
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

/** Shared SVG wrapper — 14px, currentColor stroke. */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
const SearchIcon = () => <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>;
const LinkIcon = () => (
  <Icon>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);
