/**
 * SECURITY NOTE: Share links and invites are client-enforced in v1.
 * Without server-side InstantDB permission rules, tokens provide obscurity only.
 * See docs/sharing-permissions.md for the dashboard rules that MUST be applied
 * to make access control authoritative.
 */
'use client';
import { useState } from 'react';
import type { RemotePresencePeer } from '@/app/features/types';
import ShareButton from './ShareButton';
import ShareModal from './ShareModal';
import AvatarStack from './AvatarStack';

interface Props {
  workspaceId: string;
  workspaceName: string;
  isOwner: boolean;
  peers: RemotePresencePeer[];
}

/** Orchestrates ShareButton, ShareModal, and AvatarStack for a workspace. */
export default function Share({ workspaceId, workspaceName, isOwner, peers }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AvatarStack peers={peers} />
      <ShareButton onClick={() => setIsOpen(true)} />
      {isOpen && (
        <ShareModal
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          isOwner={isOwner}
          peers={peers}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
