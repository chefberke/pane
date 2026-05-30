'use client';
import { useCallback, useMemo, useState } from 'react';
import type { Block, Frame } from '@/app/features/types';
import { makeComment } from '../../comments/utils';
import type { CommentTarget } from '../types';

interface Params {
  pushSnapshot: () => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  blocksRef: React.RefObject<Block[]>;
  framesRef: React.RefObject<Frame[]>;
  identity?: { id: string; name: string; color: string };
}

/** Owns the comments-popover target and the block/frame comment CRUD callbacks. */
export function useComments({ pushSnapshot, updateBlock, updateFrame, blocksRef, framesRef, identity }: Params) {
  const [commentTarget, setCommentTarget] = useState<CommentTarget>(null);

  const handleOpenComments = useCallback((block: Block, anchor: { x: number; y: number }) => {
    setCommentTarget(prev => (prev?.kind === 'block' && prev.id === block.id) ? null : { kind: 'block', id: block.id, x: anchor.x, y: anchor.y });
  }, []);

  const handleAddComment = useCallback((blockId: string, text: string) => {
    pushSnapshot();
    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, { comments: [...(block.comments ?? []), makeComment(text, identity)] });
  }, [pushSnapshot, updateBlock, blocksRef, identity]);

  const handleDeleteComment = useCallback((blockId: string, commentId: string) => {
    pushSnapshot();
    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, { comments: (block.comments ?? []).filter(c => c.id !== commentId) });
  }, [pushSnapshot, updateBlock, blocksRef]);

  const handleReplyComment = useCallback((blockId: string, parentId: string, text: string) => {
    pushSnapshot();
    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, { comments: (block.comments ?? []).map(c => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), makeComment(text, identity)] } : c) });
  }, [pushSnapshot, updateBlock, blocksRef, identity]);

  const handleOpenFrameComments = useCallback((frame: Frame, anchor: { x: number; y: number }) => {
    setCommentTarget(prev => (prev?.kind === 'frame' && prev.id === frame.id) ? null : { kind: 'frame', id: frame.id, x: anchor.x, y: anchor.y });
  }, []);

  const handleAddFrameComment = useCallback((frameId: string, text: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: [...(frame.comments ?? []), makeComment(text, identity)] });
  }, [pushSnapshot, updateFrame, framesRef, identity]);

  const handleDeleteFrameComment = useCallback((frameId: string, commentId: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: (frame.comments ?? []).filter(c => c.id !== commentId) });
  }, [pushSnapshot, updateFrame, framesRef]);

  const handleReplyFrameComment = useCallback((frameId: string, parentId: string, text: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: (frame.comments ?? []).map(c => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), makeComment(text, identity)] } : c) });
  }, [pushSnapshot, updateFrame, framesRef, identity]);

  const commentHandlers = useMemo(() => ({
    handleOpenComments,
    handleAddComment,
    handleDeleteComment,
    handleReplyComment,
    handleOpenFrameComments,
    handleAddFrameComment,
    handleDeleteFrameComment,
    handleReplyFrameComment,
  }), [
    handleOpenComments, handleAddComment, handleDeleteComment, handleReplyComment,
    handleOpenFrameComments, handleAddFrameComment, handleDeleteFrameComment, handleReplyFrameComment,
  ]);

  return { commentTarget, setCommentTarget, commentHandlers };
}
