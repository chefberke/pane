'use client';
import { useCallback, useRef, useState } from 'react';
import type { Comment } from '@/app/features/types';

interface Params {
  targetId: string;
  onAdd: (targetId: string, text: string) => void;
  onReply: (targetId: string, parentId: string, text: string) => void;
  onClose: () => void;
}

/** Owns the comment composer: draft text, reply target, submit, and keydown (Enter sends, Shift+Enter newline, Esc closes/cancels). */
export function useCommentComposer({ targetId, onAdd, onReply, onClose }: Params) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startReply = useCallback((comment: Comment) => {
    setReplyTo(comment);
    textareaRef.current?.focus();
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTo(null);
    textareaRef.current?.focus();
  }, []);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (replyTo) {
      onReply(targetId, replyTo.id, trimmed);
      setReplyTo(null);
    } else {
      onAdd(targetId, trimmed);
    }
    setText('');
    textareaRef.current?.focus();
  }, [text, replyTo, targetId, onAdd, onReply]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      if (replyTo) { setReplyTo(null); return; }
      onClose();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }, [replyTo, onClose, submit]);

  return { text, setText, replyTo, startReply, cancelReply, submit, handleKeyDown, textareaRef };
}
