'use client';
import { memo, useMemo } from 'react';
import type { RemotePresencePeer } from '@/app/features/types';
import { Section, Avatar, RoleBadge } from './SharePrimitives';
import MemberRow from './MemberRow';
import { useMembers } from './hooks/useMembers';
import { initials } from './utils';

interface Props {
  workspaceId: string;
  isOwner: boolean;
  peers: RemotePresencePeer[];
  userId: string;
}

/** Lists members with access and any anonymous guests currently present. */
function PeopleSection({ workspaceId, isOwner, peers, userId }: Props) {
  const { members, isLoading, updateRole, removeMember } = useMembers(workspaceId, isOwner);
  const onlinePeerIds = useMemo(() => new Set(peers.map(p => p.id)), [peers]);
  const memberIds = useMemo(() => new Set(members.map(m => m.userId)), [members]);
  const guestPeers = useMemo(() => peers.filter(p => !memberIds.has(p.id)), [peers, memberIds]);

  if (isLoading) return null;
  if (members.length === 0 && guestPeers.length === 0) return null;

  return (
    <Section label="People with access">
      {members.map(member => (
        <MemberRow
          key={member.id}
          member={member}
          isOnline={onlinePeerIds.has(member.userId)}
          isSelf={member.userId === userId}
          isOwner={isOwner}
          onUpdateRole={updateRole}
          onRemove={removeMember}
        />
      ))}

      {guestPeers.map(peer => (
        <div key={peer.id} className="flex items-center gap-3" style={{ height: 36 }}>
          <Avatar label={initials(peer.name)} isOnline color={peer.color} />
          <span className="flex-1 text-[12px] truncate" style={{ color: 'var(--color-text-primary)' }}>
            {peer.name}
          </span>
          <RoleBadge role="viewer" />
        </div>
      ))}
    </Section>
  );
}

export default memo(PeopleSection);
