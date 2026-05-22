export type ShareRole = 'viewer' | 'editor';
export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface ShareLink {
  id: string;
  workspaceId: string;
  token: string;
  role: ShareRole;
  createdAt: number;
  createdBy: string;
  revokedAt?: number;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  invitedBy?: string;
  createdAt: number;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: ShareRole;
  token: string;
  invitedBy: string;
  createdAt: number;
  acceptedAt?: number;
}

export interface ShareIdentity {
  id: string;
  name: string;
  color: string;
  role: MemberRole | ShareRole;
}
