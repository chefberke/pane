import type { Block } from '@/app/features/types';

export interface DetailPanelProps {
  block: Block;
  onClose: () => void;
  onAddComment: (blockId: string, text: string) => void;
  onDeleteComment: (blockId: string, commentId: string) => void;
}
