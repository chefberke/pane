'use client';
import { motion } from 'framer-motion';

interface Props {
  isDark: boolean;
}

/** Full-canvas welcome screen shown when no blocks exist. */
export default function EmptyState({ isDark }: Props) {
  const textPrimary = isDark ? '#d8d8d8' : '#111';
  const textMuted = isDark ? '#444' : '#bbb';
  const hintBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const hintBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const divider = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const kbdBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

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
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #ff7a59, #ff3d68)',
            boxShadow: isDark
              ? '0 4px 14px rgba(255,61,104,0.25)'
              : '0 4px 14px rgba(255,61,104,0.2)',
            flexShrink: 0,
          }}
        />
        <span
          className="text-[22px] font-bold tracking-tight"
          style={{ color: textPrimary }}
        >
          pane
        </span>
      </div>

      {/* Tagline */}
      <p
        className="text-[13px] mb-8"
        style={{ color: textMuted }}
      >
        your infinite canvas
      </p>

      {/* Hint card */}
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: hintBg,
          border: `1px solid ${hintBorder}`,
          minWidth: 252,
        }}
      >
        <HintRow
          action="Double-click"
          description="to add content"
          kbd={null}
          kbdBg={kbdBg}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
        <div style={{ height: 1, background: divider, marginLeft: 14, marginRight: 14 }} />
        <HintRow
          action="Paste a URL"
          description="to embed anything"
          kbd="⌘V"
          kbdBg={kbdBg}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
        <div style={{ height: 1, background: divider, marginLeft: 14, marginRight: 14 }} />
        <HintRow
          action="Search"
          description="to find blocks"
          kbd="⌘K"
          kbdBg={kbdBg}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>
    </motion.div>
  );
}

interface HintRowProps {
  action: string;
  description: string;
  kbd: string | null;
  kbdBg: string;
  textPrimary: string;
  textMuted: string;
}

function HintRow({ action, description, kbd, kbdBg, textPrimary, textMuted }: HintRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 px-3.5 py-2.5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[12.5px] font-medium" style={{ color: textPrimary }}>{action}</span>
        <span className="text-[12px]" style={{ color: textMuted }}>{description}</span>
      </div>
      {kbd && (
        <span
          className="text-[11px] font-mono rounded-md px-1.5 py-0.5 leading-none flex-shrink-0"
          style={{ background: kbdBg, color: textMuted }}
        >
          {kbd}
        </span>
      )}
    </div>
  );
}
