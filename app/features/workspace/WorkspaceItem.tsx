import Link from 'next/link';
import { Layers } from 'lucide-react';
import type { Workspace } from './types';

interface Props {
  workspace: Workspace;
  isActive: boolean;
}

/** Single workspace row in the sidebar list. */
export default function WorkspaceItem({ workspace, isActive }: Props) {
  return (
    <Link
      href={`/w/${workspace.id}`}
      className="flex items-center gap-2 px-3 mx-2 rounded-lg cursor-pointer"
      style={{
        height: 32,
        background: isActive ? 'var(--color-bg-active)' : 'transparent',
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        textDecoration: 'none',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-bg-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = isActive ? 'var(--color-bg-active)' : 'transparent';
      }}
    >
      <Layers size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
      <span className="text-[13px] truncate flex-1">{workspace.name}</span>
    </Link>
  );
}
