'use client';
import type { Comment } from '@/app/features/types';
import CommentItem from './CommentItem';

interface Props {
  comments: Comment[];
  onDelete: (commentId: string) => void;
  onStartReply: (comment: Comment) => void;
}

/** Renders comments newest-first. */
export default function CommentList({ comments, onDelete, onStartReply }: Props) {
  if (!comments.length) return null;
  // Newest first.
  const sorted = [...comments].reverse();
  return (
    <div
      className="max-h-72 overflow-y-auto"
      style={{ borderBottom: '1px solid var(--color-border-default)' }}
    >
      {sorted.map(c => (
        <CommentItem
          key={c.id}
          comment={c}
          onDelete={onDelete}
          onStartReply={onStartReply}
        />
      ))}
    </div>
  );
}
