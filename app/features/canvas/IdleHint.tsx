'use client';
import { motion } from 'framer-motion';
import { Pointer } from 'lucide-react';
import { IDLE_HINT_Z, IDLE_HINT_OFFSET_Y, IDLE_HINT_ICON_SIZE } from './constants';

interface Props {
  x: number;
  y: number;
}

/** Minimal idle nudge directly beneath the resting cursor: a pointer icon that "double-taps" next to a plain, semi-transparent "Double-click to add" label — no background, blended into the canvas. */
export default function IdleHint({ x, y }: Props) {
  return (
    <motion.div
      className="absolute pointer-events-none flex items-center gap-1.5 whitespace-nowrap"
      style={{ left: x - IDLE_HINT_ICON_SIZE / 2, top: y + IDLE_HINT_OFFSET_Y, zIndex: IDLE_HINT_Z }}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 0.7, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Pointer
        size={IDLE_HINT_ICON_SIZE}
        className="idle-pointer-tap"
        style={{ color: 'var(--color-text-secondary)' }}
      />
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
        Double-click to add
      </span>
    </motion.div>
  );
}
