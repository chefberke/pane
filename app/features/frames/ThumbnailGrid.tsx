'use client';
import { useState } from 'react';
import { Link as LinkIcon, Image as ImageIcon, Play, MessageCircle, FileText, Music, Map as MapIcon, Code2, StickyNote, FolderOpen } from 'lucide-react';
import type { Block } from '@/app/features/types';

interface Props {
  blocks: Block[];
}

/** Visual identity (tile bg + icon color) per block type — keeps fallback tiles readable. */
const TYPE_STYLE: Record<Block['type'], { bg: string; fg: string }> = {
  link:    { bg: 'rgba(96, 165, 250, 0.18)',  fg: 'rgb(59, 130, 246)' },
  youtube: { bg: 'rgba(239, 68, 68, 0.18)',   fg: 'rgb(220, 38, 38)' },
  twitter: { bg: 'rgba(56, 189, 248, 0.18)',  fg: 'rgb(14, 165, 233)' },
  image:   { bg: 'rgba(168, 85, 247, 0.18)',  fg: 'rgb(147, 51, 234)' },
  text:    { bg: 'rgba(251, 191, 36, 0.22)',  fg: 'rgb(202, 138, 4)' },
  pdf:     { bg: 'rgba(244, 63, 94, 0.18)',   fg: 'rgb(225, 29, 72)' },
  spotify: { bg: 'rgba(34, 197, 94, 0.18)',   fg: 'rgb(22, 163, 74)' },
  map:     { bg: 'rgba(20, 184, 166, 0.18)',  fg: 'rgb(13, 148, 136)' },
  github:  { bg: 'rgba(148, 163, 184, 0.22)', fg: 'rgb(71, 85, 105)' },
};

function parseDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

/** 2x2 mini-preview grid for a collapsed frame. Fills the container; never overflows. */
export default function ThumbnailGrid({ blocks }: Props) {
  if (blocks.length === 0) {
    return (
      <div
        className="w-full h-full rounded-md flex flex-col items-center justify-center gap-1"
        style={{ background: 'var(--color-bg-hint)', color: 'var(--color-text-tertiary)' }}
      >
        <FolderOpen size={18} />
        <span className="text-[10px] font-medium">Empty group</span>
      </div>
    );
  }

  const overflow = blocks.length > 4 ? blocks.length - 3 : 0;
  const visible = overflow > 0 ? blocks.slice(0, 3) : blocks.slice(0, 4);
  const empty = overflow > 0 ? 0 : 4 - visible.length;

  return (
    <div
      className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full"
      style={{ minHeight: 0 }}
    >
      {visible.map(b => (
        <Tile key={b.id}>
          <Thumbnail block={b} />
        </Tile>
      ))}
      {overflow > 0 && (
        <Tile>
          <OverflowTile count={overflow} />
        </Tile>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Tile key={`empty-${i}`}>
          <div
            className="rounded-md w-full h-full"
            style={{ background: 'var(--color-bg-hint)' }}
          />
        </Tile>
      ))}
    </div>
  );
}

/** Non-interactive grid cell — the collapsed card body handles pointer/drag. */
function Tile({ children }: { children: React.ReactNode }) {
  return <div className="min-h-0 min-w-0">{children}</div>;
}

function OverflowTile({ count }: { count: number }) {
  return (
    <div
      className="rounded-md w-full h-full flex items-center justify-center"
      style={{
        background: 'var(--color-surface-sunken)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span className="text-xs font-semibold tabular-nums">+{count}</span>
    </div>
  );
}

function Thumbnail({ block }: { block: Block }) {
  // While the block's metadata is being (re)fetched, show a skeleton tile
  // mirroring the LinkPreview/GithubEmbed loading state.
  if ((block.type === 'link' || block.type === 'github') && block.loading === true) {
    return <SkeletonTile />;
  }
  return <ThumbnailContent block={block} />;
}

/** Pulsing skeleton tile matching the LinkPreview/GithubEmbed loading visual. */
function SkeletonTile() {
  return (
    <div
      className="rounded-md overflow-hidden w-full h-full p-1.5 flex flex-col gap-1 animate-pulse"
      style={{ background: 'var(--color-surface-embed)' }}
    >
      <div
        className="flex-1 min-h-0 rounded"
        style={{ background: 'var(--color-surface-sunken)' }}
      />
      <div
        className="h-1.5 rounded w-3/4 flex-shrink-0"
        style={{ background: 'var(--color-surface-sunken)' }}
      />
      <div
        className="h-1.5 rounded w-1/2 flex-shrink-0"
        style={{ background: 'var(--color-surface-sunken)' }}
      />
    </div>
  );
}

function ThumbnailContent({ block }: { block: Block }) {
  // ─── Text note tile (sticky-note styling) ──────────────────────────────
  if (block.type === 'text') {
    return (
      <div
        className="rounded-md overflow-hidden h-full w-full p-1.5 flex items-start"
        style={{
          background: 'var(--color-surface-note)',
          color: TYPE_STYLE.text.fg,
        }}
      >
        <span className="text-[9px] leading-tight line-clamp-4 font-medium break-words">
          {block.content || 'Note'}
        </span>
      </div>
    );
  }

  // ─── Image-style tiles (with graceful fallback on load error). ─────────
  // Keyed by src so the failed-state resets when the URL changes (e.g. after refresh).
  if (block.type === 'image') {
    return <ImageTile key={block.url} src={block.url} alt={block.alt ?? ''} fallback={<CardTile block={block} />} />;
  }
  if (block.type === 'link' && block.image) {
    return <ImageTile key={block.image} src={block.image} alt={block.title ?? ''} fallback={<CardTile block={block} />} />;
  }
  if (block.type === 'youtube') {
    const src = `https://i.ytimg.com/vi/${block.videoId}/mqdefault.jpg`;
    return <ImageTile key={src} src={src} alt={block.title ?? ''} bg="rgb(0,0,0)" fallback={<CardTile block={block} />} />;
  }

  // ─── Compact card: icon + label (link without image, pdf, github, etc.) ──
  return <CardTile block={block} />;
}

interface ImageTileProps {
  src: string;
  alt: string;
  fallback: React.ReactNode;
  bg?: string;
}

function ImageTile({ src, alt, fallback, bg = 'var(--color-surface-sunken)' }: ImageTileProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <div
      className="rounded-md overflow-hidden w-full h-full flex items-center justify-center"
      style={{ background: bg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-label={alt}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function CardTile({ block }: { block: Block }) {
  const style = TYPE_STYLE[block.type];
  const { primary, secondary } = labelsFor(block);

  return (
    <div
      className="rounded-md overflow-hidden w-full h-full p-1.5 flex flex-col gap-1"
      style={{ background: style.bg, color: style.fg }}
    >
      <div className="flex-shrink-0">
        {renderIcon(block, 16)}
      </div>
      <div className="flex-1 min-h-0 flex flex-col justify-end gap-0.5 overflow-hidden">
        {primary && (
          <span
            className="text-[9px] font-semibold leading-tight line-clamp-2 break-words"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {primary}
          </span>
        )}
        {secondary && (
          <span
            className="text-[8px] leading-tight truncate"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {secondary}
          </span>
        )}
      </div>
    </div>
  );
}

/** Picks a primary (bold) and secondary (muted) label for the card tile per block type. */
function labelsFor(block: Block): { primary?: string; secondary?: string } {
  switch (block.type) {
    case 'link':    return { primary: block.title ?? parseDomain(block.url), secondary: block.title ? parseDomain(block.url) : undefined };
    case 'twitter': return { primary: 'Tweet', secondary: parseDomain(block.url) };
    case 'pdf':     return { primary: block.title ?? 'PDF', secondary: parseDomain(block.url) };
    case 'spotify': return { primary: block.spotifyType.charAt(0).toUpperCase() + block.spotifyType.slice(1), secondary: 'Spotify' };
    case 'map':     return { primary: block.title ?? 'Map', secondary: 'Location' };
    case 'github':  return { primary: `${block.owner}/${block.repo}`, secondary: block.language ?? 'GitHub' };
    default:        return {};
  }
}

function renderIcon(block: Block, size = 22) {
  const stroke = 2.2;
  switch (block.type) {
    case 'link':    return <LinkIcon size={size} strokeWidth={stroke} />;
    case 'image':   return <ImageIcon size={size} strokeWidth={stroke} />;
    case 'youtube': return <Play size={size} strokeWidth={stroke} />;
    case 'twitter': return <MessageCircle size={size} strokeWidth={stroke} />;
    case 'pdf':     return <FileText size={size} strokeWidth={stroke} />;
    case 'spotify': return <Music size={size} strokeWidth={stroke} />;
    case 'map':     return <MapIcon size={size} strokeWidth={stroke} />;
    case 'github':  return <Code2 size={size} strokeWidth={stroke} />;
    case 'text':    return <StickyNote size={size} strokeWidth={stroke} />;
  }
}
