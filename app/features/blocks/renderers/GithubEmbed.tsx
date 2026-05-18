'use client';
import type { GitHubBlock } from '@/app/features/types';
import { Star, GitFork, Scale } from 'lucide-react';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Renders a GitHub repository card with live stats fetched from the public API. */
export default function GithubEmbed({ block }: { block: GitHubBlock }) {
  const { owner, repo, url, description, stars, forks, language, license, topics, loading } = block;

  if (loading) {
    return (
      <div
        className="w-80 p-4 flex flex-col gap-3 animate-pulse"
        style={{ background: 'var(--color-surface-embed)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: 'var(--color-surface-sunken)' }} />
          <div className="h-3 rounded w-40" style={{ background: 'var(--color-surface-sunken)' }} />
        </div>
        <div className="h-3 rounded w-full" style={{ background: 'var(--color-surface-sunken)' }} />
        <div className="h-3 rounded w-2/3" style={{ background: 'var(--color-surface-sunken)' }} />
        <div className="flex gap-3 pt-1">
          <div className="h-3 rounded w-12" style={{ background: 'var(--color-surface-sunken)' }} />
          <div className="h-3 rounded w-12" style={{ background: 'var(--color-surface-sunken)' }} />
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-80 flex flex-col gap-3 p-4 no-underline"
      style={{ background: 'var(--color-surface-embed)' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--color-text-tertiary)' }}>
          <GithubIcon size={15} />
        </span>
        <span
          className="text-sm font-semibold truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <span style={{ color: 'var(--color-text-tertiary)' }}>{owner}/</span>
          {repo}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p
          className="text-xs line-clamp-2 leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description}
        </p>
      )}

      {/* Topics */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topics.slice(0, 4).map(t => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                background: 'var(--color-surface-sunken)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 pt-0.5">
        {typeof stars === 'number' && (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Star size={11} />
            {formatCount(stars)}
          </span>
        )}
        {typeof forks === 'number' && (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <GitFork size={11} />
            {formatCount(forks)}
          </span>
        )}
        {language && (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
            {language}
          </span>
        )}
        {license && license !== 'NOASSERTION' && (
          <span
            className="flex items-center gap-1 text-xs ml-auto"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Scale size={11} />
            {license}
          </span>
        )}
      </div>
    </a>
  );
}
