'use client';
import { motion } from 'framer-motion';

interface Props {
  x: number;
  y: number;
  message: string;
}

/** Transient red label shown on the canvas where an upload was rejected; fades out on its own. */
export default function UploadErrorFlash({ x, y, message }: Props) {
  return (
    <motion.div
      className="absolute z-[120] pointer-events-none px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        background: 'var(--color-surface-raised)',
        color: 'var(--color-text-danger)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-float)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {message}
    </motion.div>
  );
}
