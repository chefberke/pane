import { i } from '@instantdb/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _schema = (i.schema as any)({
  entities: {
    workspaces: i.entity({
      userId:    i.string(),
      name:      i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
      stateJson: i.string().optional(),
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
