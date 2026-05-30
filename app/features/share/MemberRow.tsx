'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import { Avatar, RoleBadge } from './SharePrimitives';
import RoleDropdown from './RoleDropdown';
import { initials } from './utils';
import type { MemberRole, WorkspaceMember } from './types';

interface Props {
  member: WorkspaceMember;
  isOnline: boolean;
  isSelf: boolean;
  isOwner: boolean;
  onUpdateRole: (memberId: string, role: MemberRole) => void;
  onRemove: (memberId: string) => void;
}

const ROW_STYLE: CSSProperties = { height: 36 };

/** A single workspace member row — avatar, identity, and role control. */
function MemberRow({ member, isOnline, isSelf, isOwner, onUpdateRole, onRemove }: Props) {
  const editable = member.role !== 'owner' && isOwner;

  return (
    <div className="flex items-center gap-3" style={ROW_STYLE}>
      <Avatar label={initials(member.userId)} isOnline={isOnline} />
      <span className="flex-1 text-[12px] truncate" style={{ color: 'var(--color-text-primary)' }}>
        {member.userId}
        {isSelf && <span style={{ color: 'var(--color-text-muted)' }}> (you)</span>}
      </span>
      {editable ? (
        <RoleDropdown
          role={member.role as MemberRole}
          onChange={r => {
            if (r === 'remove') onRemove(member.id);
            else onUpdateRole(member.id, r);
          }}
        />
      ) : (
        <RoleBadge role={member.role} />
      )}
    </div>
  );
}

export default memo(MemberRow);
