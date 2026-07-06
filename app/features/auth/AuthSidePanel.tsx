'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SIDE_PANEL_COPY } from './constants';

// WebGL background can't server-render — load client-side only.
const CanvasRevealEffect = dynamic(
  () => import('./CanvasRevealEffect').then((m) => m.CanvasRevealEffect),
  { ssr: false },
);

/** Left branding panel for the split-screen auth layout — hidden on mobile. */
export default function AuthSidePanel() {
  return (
    <div
      className="hidden md:flex relative overflow-hidden"
      style={{ background: '#0f0f10', color: '#fafafa', minHeight: '100vh', width: '50%', flexShrink: 0 }}
    >
      <div className="absolute inset-0">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-[#0f0f10]"
          colors={[
            [255, 255, 255],
            [204, 204, 204],
          ]}
          dotSize={2}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-12">
        <div className="flex flex-1 flex-col justify-center gap-5">
          <h1
            className="font-semibold tracking-tight"
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.75rem)',
              lineHeight: 1.05,
              color: '#fafafa',
              maxWidth: '16ch',
              textWrap: 'balance',
            }}
          >
            {SIDE_PANEL_COPY.headline}
          </h1>
          <p
            className="leading-relaxed"
            style={{ fontSize: 'clamp(1rem, 1.3vw, 1.15rem)', color: 'rgba(250,250,250,0.55)', maxWidth: '34ch' }}
          >
            {SIDE_PANEL_COPY.tagline}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span style={{ fontSize: '0.7rem', color: 'rgba(250,250,250,0.3)' }}>
            © {new Date().getFullYear()} Pane
          </span>
          <Link href="/" aria-label="Home" className="flex items-center gap-2.5">
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-gradient)',
                boxShadow: 'var(--shadow-brand-logo)',
                flexShrink: 0,
              }}
            />
            <span className="font-semibold text-sm" style={{ color: '#fafafa' }}>
              {SIDE_PANEL_COPY.wordmark}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
