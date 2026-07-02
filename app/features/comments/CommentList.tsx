'use client';
import type { Comment } from '@/app/features/types';
import CommentItem from './CommentItem';

interface Props {
  comments: Comment[];
  onDelete: (commentId: string) => void;
  onStartReply: (comment: Comment) => void;
}

/** Renders comments oldest-first (chat order); the parent owns scrolling. */
export default function CommentList({ comments, onDelete, onStartReply }: Props) {
  if (!comments.length) return null;
  return (
    <div>
      {comments.map(c => (
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
