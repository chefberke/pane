'use client';
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { Comment } from '@/app/features/types';

interface Props {
  comment: Comment;
  visible: boolean;
}

const WRAPPER_STYLE: CSSProperties = { bottom: 'calc(100% + 10px)', left: 0, maxWidth: 180 };
const BUBBLE_STYLE: CSSProperties = { background: 'var(--color-surface-action)' };
const TEXT_STYLE: CSSProperties = { color: 'var(--color-text-on-action)' };
const ARROW_STYLE: CSSProperties = {
  borderLeft: '5px solid transparent',
  borderRight: '5px solid transparent',
  borderTop: '5px solid var(--color-surface-action)',
};

/** Last-comment bubble — shown above a block on hover, iPhone notification style. */
function CommentBubble({ comment, visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="comment-bubble"
          initial={{ opacity: 0, y: 6, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.6 }}
          className="absolute z-30 pointer-events-none"
          style={WRAPPER_STYLE}
        >
          <div
            className="relative backdrop-blur-md rounded-2xl px-3 py-2 shadow-xl"
            style={BUBBLE_STYLE}
          >
            <p
              className="text-[11px] leading-snug line-clamp-2"
              style={TEXT_STYLE}
            >
              {comment.text}
            </p>
            <span
              className="absolute left-4 -bottom-[5px] w-0 h-0"
              style={ARROW_STYLE}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(CommentBubble);
