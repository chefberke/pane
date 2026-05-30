/**
 * Access control is enforced server-side: InstantDB permission rules (instant.perms.ts,
 * backed by schema links) gate member/owner reads and writes, and anonymous share-page
 * access is validated by the /api/share/[token], /api/workspace/save, and
 * /api/invite/[token]/accept routes using the admin token. The UI gates here are
 * defense-in-depth, not the authoritative layer.
 */
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { RemotePresencePeer } from '@/app/features/types';
import ShareButton from './ShareButton';
import AvatarStack from './AvatarStack';

// The share dialog (and its framer-motion dropdowns) is only needed once the user
// opens it — code-split it out of the workspace's initial client bundle.
const ShareModal = dynamic(() => import('./ShareModal'), { ssr: false });

interface Props {
  workspaceId: string;
  workspaceName: string;
  isOwner: boolean;
  peers: RemotePresencePeer[];
  followedPeerId?: string | null;
  onSelectPeer?: (peerId: string) => void;
}

/** Orchestrates ShareButton, ShareModal, and AvatarStack for a workspace. */
export default function Share({ workspaceId, workspaceName, isOwner, peers, followedPeerId, onSelectPeer }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AvatarStack peers={peers} followedPeerId={followedPeerId} onSelectPeer={onSelectPeer} />
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
