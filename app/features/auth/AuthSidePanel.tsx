import Link from 'next/link';
import { SIDE_PANEL_COPY } from './constants';

/** Left branding panel for the split-screen auth layout — hidden on mobile. */
export default function AuthSidePanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between p-12"
      style={{ background: '#0f0f10', color: '#fafafa', minHeight: '100vh', width: '45%', flexShrink: 0 }}
    >
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

      <div className="flex flex-col gap-5">
        <p
          className="font-semibold tracking-tight leading-none"
          style={{ fontSize: 'clamp(3.5rem, 5.5vw, 6.5rem)', color: '#fafafa' }}
        >
          {SIDE_PANEL_COPY.wordmark}
        </p>
        <p
          className="leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)', color: 'rgba(250,250,250,0.5)', maxWidth: '26ch' }}
        >
          {SIDE_PANEL_COPY.tagline}
        </p>
      </div>

      <span style={{ fontSize: '0.7rem', color: 'rgba(250,250,250,0.25)' }}>
        © {new Date().getFullYear()} Pane
      </span>
    </div>
  );
}
