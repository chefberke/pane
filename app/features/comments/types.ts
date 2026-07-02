import type { Comment } from '@/app/features/types';

export interface CommentsSheetProps {
  targetId: string;
  targetLabel?: string;
  comments: Comment[];
  onAdd: (targetId: string, text: string) => void;
  onDelete: (targetId: string, commentId: string) => void;
  onReply: (targetId: string, parentId: string, text: string) => void;
  onClose: () => void;
}
