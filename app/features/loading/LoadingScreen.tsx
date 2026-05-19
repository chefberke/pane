'use client';
import { Fragment, useSyncExternalStore } from 'react';
import {
  LOGO_SIZE,
  PULSE_DURATION_MS,
  TIP_FADE_MS,
  TIPS,
  TIPS_LABEL,
  WORDMARK,
} from './constants';
import type { TipSegment } from './types';

/** Renders a single tip segment — plain text or a styled keyboard-key pill. */
function TipPart({ segment }: { segment: TipSegment }) {
  if (typeof segment === 'string') return <>{segment}</>;
  return (
    <kbd
      className="font-mono"
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        margin: '0 1px',
        fontSize: '11px',
        lineHeight: 1.4,
        color: 'var(--color-text-secondary)',
        background: 'var(--color-surface-input)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-sm)',
        verticalAlign: 'baseline',
      }}
    >
      {segment.kbd}
    </kbd>
  );
}

// Picked once per session on the client and reused across mounts so the tip is stable
// after hydration. Kept outside the component so React's useSyncExternalStore snapshot
// stays referentially identical between calls.
let clientTipIndex: number | null = null;
function getClientTipIndex(): number {
  if (clientTipIndex === null) {
    clientTipIndex = Math.floor(Math.random() * TIPS.length);
  }
  return clientTipIndex;
}
const subscribeNoop = () => () => {};

/** Full-area branded loading screen — pulsing logo, wordmark, and a randomly-picked tip with key hints. */
export default function LoadingScreen() {
  // SSR and the first client paint render index 0 (matching markup → no hydration error).
  // After hydration, React swaps in the client snapshot (a random tip) automatically.
  const tipIndex = useSyncExternalStore(subscribeNoop, getClientTipIndex, () => 0);

  const tip = TIPS[tipIndex];

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full"
      style={{ background: 'var(--color-canvas)', gap: 14 }}
    >
      <div
        aria-hidden
        style={{
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--brand-gradient)',
          boxShadow: 'var(--shadow-brand-logo)',
          animation: `pulse-soft ${PULSE_DURATION_MS}ms var(--ease-out-soft) infinite`,
          willChange: 'opacity, transform',
        }}
      />
      <span
        className="font-semibold text-[15px]"
        style={{ color: 'var(--color-text-secondary)', letterSpacing: '-0.01em' }}
      >
        {WORDMARK}
      </span>

      <div
        role="status"
        aria-live="polite"
        className="flex items-center text-[12.5px]"
        style={{ color: 'var(--color-text-tertiary)', letterSpacing: '-0.005em', gap: 6 }}
      >
        <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {TIPS_LABEL}
        </span>
        <span
          key={tipIndex}
          style={{
            animation: `fade-in-soft ${TIP_FADE_MS}ms var(--ease-out-soft)`,
            willChange: 'opacity, transform',
          }}
        >
          {tip.map((segment, i) => (
            <Fragment key={i}>
              <TipPart segment={segment} />
            </Fragment>
          ))}
        </span>
      </div>
    </div>
  );
}
