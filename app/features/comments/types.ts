import type { Comment } from '@/app/features/types';

export interface CommentsPopoverProps {
  targetId: string;
  comments: Comment[];
  x: number;
  y: number;
  onAdd: (targetId: string, text: string) => void;
  onDelete: (targetId: string, commentId: string) => void;
  onClose: () => void;
}
