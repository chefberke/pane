import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    workspaces: i.entity({
      userId:    i.string(),
      name:      i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
      stateJson: i.string().optional(),
      deletedAt: i.number().optional(),
    }),
    workspaceShares: i.entity({
      workspaceId: i.string(),
      token:       i.string(),
      role:        i.string(),   // 'viewer' | 'editor'
      createdAt:   i.number(),
      createdBy:   i.string(),
      revokedAt:   i.number().optional(),
    }),
    workspaceMembers: i.entity({
      workspaceId: i.string(),
      userId:      i.string(),
      role:        i.string(),   // 'owner' | 'editor' | 'viewer'
      invitedBy:   i.string().optional(),
      createdAt:   i.number(),
    }),
    workspaceInvites: i.entity({
      workspaceId: i.string(),
      email:       i.string(),
      role:        i.string(),
      token:       i.string(),
      invitedBy:   i.string(),
      createdAt:   i.number(),
      acceptedAt:  i.number().optional(),
    }),
  },
  // Links let the permission rules in instant.perms.ts traverse relationships
  // (e.g. "is the caller a member of the workspace this share belongs to").
  // The flat `workspaceId` string fields above are retained so existing queries
  // keep working; the links are additive. `onDelete: 'cascade'` on the forward
  // side removes dependent rows when a workspace is deleted.
  links: {
    workspaceMembersWorkspace: {
      forward: { on: 'workspaceMembers', has: 'one',  label: 'workspace', onDelete: 'cascade' },
      reverse: { on: 'workspaces',       has: 'many', label: 'members' },
    },
    workspaceSharesWorkspace: {
      forward: { on: 'workspaceShares',  has: 'one',  label: 'workspace', onDelete: 'cascade' },
      reverse: { on: 'workspaces',       has: 'many', label: 'shares' },
    },
    workspaceInvitesWorkspace: {
      forward: { on: 'workspaceInvites', has: 'one',  label: 'workspace', onDelete: 'cascade' },
      reverse: { on: 'workspaces',       has: 'many', label: 'invites' },
    },
  },
  rooms: {
    workspace: {
      presence: i.entity({
        name:      i.string(),
        color:     i.string(),
        cursor:    i.json(),
        selection: i.json(),
        typing:    i.boolean(),
      }),
    },
  },
});

export type Schema = typeof _schema;
export default _schema;
