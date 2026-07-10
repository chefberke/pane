'use client';
import { memo, useEffect, useState } from 'react';
import { Megaphone, Check, X } from 'lucide-react';
import { ModalButton } from './primitives';
import { useFeedback } from './hooks/useFeedback';
import { FEEDBACK_CATEGORIES, FEEDBACK_MODAL_WIDTH, FEEDBACK_MOODS, Z_MODAL } from './constants';
import { FEEDBACK_MAX_LENGTH } from '@/app/lib/constants';
import type { FeedbackCategory } from './types';

interface Props {
  onClose: () => void;
  /** Route the feedback is sent from, attached to the submission for context. */
  path?: string;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Portaled feedback dialog: pick a mood + category, write a message, and send it to /api/feedback. */
function FeedbackModal({ onClose, path }: Props) {
  const submit = useFeedback();
  const [mood, setMood] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = message.trim();
  const canSend = mood !== null && trimmed.length > 0 && status !== 'sending';

  const handleSend = async () => {
    if (mood === null || !trimmed) return;
    // Store the human-readable label ('Okay') in the DB, not the raw 1–5 value.
    const moodLabel = FEEDBACK_MOODS.find(m => m.value === mood)?.label;
    if (!moodLabel) return;
    setStatus('sending');
    const ok = await submit({ mood: moodLabel, category, message: trimmed, path });
    setStatus(ok ? 'sent' : 'error');
  };

  return (
    <div
      data-menu-portal
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_MODAL, background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: FEEDBACK_MODAL_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        {status === 'sent' ? (
          <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
            <span
              className="flex items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--color-surface-action)', color: 'var(--color-text-on-action)' }}
            >
              <Check size={24} />
            </span>
            <div>
              <p className="text-[16px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Thanks for the feedback!</p>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                We read every message — it genuinely helps shape what comes next.
              </p>
            </div>
            <ModalButton label="Done" primary onClick={onClose} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4">
              <Megaphone size={17} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>Send feedback</p>
                <p className="text-[12px] leading-tight mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Tell us what&apos;s working and what&apos;s not</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="flex items-center justify-center flex-shrink-0 cursor-pointer"
                style={{ width: 28, height: 28, borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 pb-5">
              {/* Mood */}
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  How&apos;s your experience?
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {FEEDBACK_MOODS.map(m => {
                    const active = mood === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        aria-label={m.label}
                        aria-pressed={active}
                        className="flex flex-col items-center gap-1 py-2.5 cursor-pointer"
                        style={{
                          borderRadius: 'var(--radius-xl)',
                          background: active ? 'var(--color-surface-control-active)' : 'var(--color-surface-sunken)',
                          border: `1px solid ${active ? 'var(--color-border-strong)' : 'transparent'}`,
                          transition: 'background var(--duration-fast), border-color var(--duration-fast)',
                        }}
                        onClick={() => setMood(m.value)}
                      >
                        <span
                          style={{
                            fontSize: 22,
                            lineHeight: 1,
                            filter: active ? 'none' : 'grayscale(1)',
                            opacity: active ? 1 : 0.65,
                            transition: 'filter var(--duration-fast), opacity var(--duration-fast)',
                          }}
                        >
                          {m.emoji}
                        </span>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                        >
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Category
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_CATEGORIES.map(c => {
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={active}
                        className="px-3.5 py-1.5 text-[12px] font-medium cursor-pointer"
                        style={{
                          borderRadius: 'var(--radius-full)',
                          // Selected chip uses the segmented-control-active surface (like the mood buttons
                          // above) so it reads as raised/brighter in dark mode too — the brand-black
                          // action surface would sit darker than the dark modal and vanish.
                          background: active ? 'var(--color-surface-control-active)' : 'var(--color-surface-sunken)',
                          color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                          border: `1px solid ${active ? 'var(--color-border-strong)' : 'var(--color-border-default)'}`,
                          boxShadow: active ? 'var(--shadow-float-sm)' : 'none',
                          transition: 'background var(--duration-fast), color var(--duration-fast), box-shadow var(--duration-fast)',
                        }}
                        onClick={() => setCategory(c.value)}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <textarea
                  className="w-full px-3 py-2.5 text-[13px] outline-none resize-none leading-relaxed"
                  style={{
                    height: 104,
                    background: 'var(--color-surface-input)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--color-text-primary)',
                  }}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="What happened, or what would make pane better?"
                  maxLength={FEEDBACK_MAX_LENGTH}
                />
                <div className="flex items-center justify-between mt-1.5" style={{ minHeight: 14 }}>
                  <span className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-danger)' }}>
                    {status === 'error' ? 'Could not send — please try again.' : ''}
                  </span>
                  <span
                    className="text-[11px] tabular-nums flex-shrink-0"
                    style={{ color: message.length >= FEEDBACK_MAX_LENGTH ? 'var(--color-text-danger)' : 'var(--color-text-muted)' }}
                  >
                    {message.length}/{FEEDBACK_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2">
                <ModalButton label="Cancel" onClick={onClose} />
                <ModalButton
                  label={status === 'sending' ? 'Sending…' : 'Send feedback'}
                  primary
                  disabled={!canSend}
                  onClick={handleSend}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(FeedbackModal);
