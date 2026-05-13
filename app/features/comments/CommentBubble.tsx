'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Comment } from '@/app/features/types';

interface Props {
  comment: Comment;
  visible: boolean;
}

/** Last-comment bubble — shown above a block on hover, iPhone notification style. */
export default function CommentBubble({ comment, visible }: Props) {
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
          style={{ bottom: 'calc(100% + 10px)', left: 0, maxWidth: 180 }}
        >
          <div className="relative bg-gray-800/90 dark:bg-[#1c1c1e]/95 backdrop-blur-md text-white rounded-2xl px-3 py-2 shadow-xl">
            <p className="text-[11px] leading-snug line-clamp-2 text-white/90">{comment.text}</p>
            <span
              className="absolute left-4 -bottom-[5px] w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(40,40,42,0.92)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
