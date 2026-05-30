'use client';
import { memo } from 'react';
import { Section } from './SharePrimitives';
import LinkRow from './LinkRow';
import { useShareLinks } from './hooks/useShareLinks';

interface Props {
  workspaceId: string;
  isOwner: boolean;
  userId: string;
}

/** Public view-only and editor share links for the workspace. */
function LinksSection({ workspaceId, isOwner, userId }: Props) {
  const { shares, isLoading, createShare, revokeShare, regenerateShare } = useShareLinks(workspaceId, userId);
  const viewerShare = shares.find(s => s.role === 'viewer');
  const editorShare = shares.find(s => s.role === 'editor');

  return (
    <Section label="Share link">
      <LinkRow
        label="View only"
        share={viewerShare}
        isOwner={isOwner}
        isLoading={isLoading}
        onCreate={() => createShare('viewer')}
        onRevoke={id => revokeShare(id)}
        onRegenerate={id => regenerateShare(id, 'viewer')}
      />
      <LinkRow
        label="Can edit"
        share={editorShare}
        isOwner={isOwner}
        isLoading={isLoading}
        onCreate={() => createShare('editor')}
        onRevoke={id => revokeShare(id)}
        onRegenerate={id => regenerateShare(id, 'editor')}
      />
    </Section>
  );
}

export default memo(LinksSection);
