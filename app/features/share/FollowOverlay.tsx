'use client';
import { motion } from 'framer-motion';
import { FOLLOW_BORDER_WIDTH } from './constants';

interface Props {
  name: string;
  color: string;
  onExit: () => void;
}

/** Fixed overlay shown when following a peer — colored border + minimal bottom chip. */
export default function FollowOverlay({ name, color, onExit }: Props) {
  return (
    <>
      {/* Transparent click-to-exit layer */}
      <div className="fixed inset-0 z-[99]" onClick={onExit} />

      {/* Colored border around the entire viewport */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{ boxShadow: `inset 0 0 0 ${FOLLOW_BORDER_WIDTH}px ${color}` }}
      />

      {/* Bottom-center minimal chip */}
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.15 }}
        onClick={onExit}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[101] flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] cursor-pointer select-none"
        style={{
          background: 'var(--color-surface-raised)',
          color:      'var(--color-text-secondary)',
          border:     '1px solid var(--color-border-default)',
        }}
      >
        Following <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{name}</span>
        <span style={{ color: 'var(--color-text-muted)', marginLeft: 2 }}>· Stop</span>
      </motion.button>
    </>
  );
}
