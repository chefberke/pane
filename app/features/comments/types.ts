import type { Comment } from '@/app/features/types';

export interface CommentsPopoverProps {
  blockId: string;
  comments: Comment[];
  x: number;
  y: number;
  onAdd: (blockId: string, text: string) => void;
  onDelete: (blockId: string, commentId: string) => void;
  onClose: () => void;
}
