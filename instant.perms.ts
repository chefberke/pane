import type { InstantRules } from '@instantdb/react';

// Authorization model (see instant.schema.ts for the links these rules traverse):
//  • Owner is identified by workspaces.userId.
//  • Members are workspaceMembers rows linked to a workspace (created only by the
//    server-side /api/invite/[token]/accept route).
//  • Anonymous share-page guests have no auth.id and cannot be authorized by CEL,
//    so they read via /api/share/[token] and write via /api/workspace/save, both
//    of which validate the share token with the admin token (bypassing these rules).
//  • Non-owner edits (members + share guests) also go through /api/workspace/save,
//    which is why workspaces.update stays owner-only here.

const rules = {
  // ── workspaces ──────────────────────────────────────────────────────────────
  workspaces: {
    bind: [
      'isOwner', 'auth.id != null && auth.id == data.userId',
    ],
    allow: {
      // Owner or any linked member may read.
      view: "isOwner || (auth.id != null && auth.id in data.ref('members.userId'))",
      // Only authenticated users may create workspaces, and only their own.
      create: 'auth.id != null && auth.id == newData.userId',
      // Direct client writes are owner-only; everyone else uses /api/workspace/save.
      update: 'isOwner',
      delete: 'isOwner',
    },
  },

  // ── workspaceShares ───────────────────────────────────────────────────────────
  workspaceShares: {
    bind: ['isCreator', 'auth.id != null && auth.id == data.createdBy'],
    allow: {
      // Only the owner (creator) manages share links. Guests resolve tokens via
      // /api/share/[token], so anonymous read is no longer needed here — this also
      // removes the token-enumeration surface.
      view: 'isCreator',
      create: 'auth.id != null && auth.id == newData.createdBy',
      update: 'isCreator',
      delete: 'isCreator',
    },
  },

  // ── workspaceMembers ────────────────────────────────────────────────────────
  workspaceMembers: {
    bind: [
      'isSelf', 'auth.id != null && auth.id == data.userId',
      'isWorkspaceOwner', "auth.id != null && auth.id in data.ref('workspace.userId')",
    ],
    allow: {
      // The workspace owner and fellow members may read the member list.
      view: "isWorkspaceOwner || (auth.id != null && auth.id in data.ref('workspace.members.userId'))",
      // Members are created only by the invite-accept API route (admin token).
      create: 'false',
      // Only the workspace owner can change a member's role.
      update: 'isWorkspaceOwner',
      // A member can remove themselves; the workspace owner can remove anyone.
      delete: 'isSelf || isWorkspaceOwner',
    },
  },

  // ── workspaceInvites ──────────────────────────────────────────────────────────
  workspaceInvites: {
    bind: [
      'isInviter', 'auth.id != null && auth.id == data.invitedBy',
    ],
    allow: {
      // Only the inviter manages invites client-side. Invitees read + accept via
      // /api/invite/[token]/accept (admin token validates the email binding).
      view: 'isInviter',
      create: 'auth.id != null && auth.id == newData.invitedBy',
      update: 'isInviter',
      delete: 'isInviter',
    },
  },
} satisfies InstantRules;

export default rules;
