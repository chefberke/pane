import type { InstantRules } from '@instantdb/react';
import type { Schema } from './instant.schema';

// Authorization model (see instant.schema.ts for the links these rules traverse):
//  • Owner is identified by workspaces.userId.
//  • Members are workspaceMembers rows linked to a workspace (created only by the
//    server-side /api/invite/[token]/accept route).
//  • Anonymous share-page guests have no auth.id and cannot be authorized by CEL,
//    so they read via /api/share/[token] and write via /api/workspace/save, both
//    of which validate the share token with the admin token (bypassing these rules).
//  • Non-owner edits (members + share guests) also go through /api/workspace/save,
//    which is why workspaces.update stays owner-only here.
//
// Rate limits ($rateLimits, bottom) are enforced server-side by InstantDB on the
// create/update rules below — InstantDB does NOT rate-limit writes automatically.

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
      // Name capped at 50 chars (see MAX_WORKSPACE_NAME_LENGTH); checked before the
      // rate limit so an over-length write is rejected without burning a token.
      // Per-user rate limit so a script can't mass-create workspaces.
      create: 'auth.id != null && auth.id == newData.userId && size(newData.name) <= 50 && rateLimit.workspaceCreate.limit(auth.id)',
      // Direct client writes are owner-only; everyone else uses /api/workspace/save.
      // The modifiedFields guard applies the 50-char cap only when `name` actually
      // changes, so state-only saves (stateJson/updatedAt) are never blocked.
      // Per-user rate limit caps runaway save loops (debounced saves stay well under).
      update: "isOwner && (!('name' in request.modifiedFields) || size(newData.name) <= 50) && rateLimit.workspaceWrite.limit(auth.id)",
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
      create: 'auth.id != null && auth.id == newData.createdBy && rateLimit.shareCreate.limit(auth.id)',
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
      create: 'auth.id != null && auth.id == newData.invitedBy && rateLimit.inviteCreate.limit(auth.id)',
      update: 'isInviter',
      delete: 'isInviter',
    },
  },

  // ── feedback ──────────────────────────────────────────────────────────────────
  // Written only by /api/feedback (admin token), which lets anonymous and signed-in
  // users submit alike. The client never reads or writes it directly, so every
  // action is denied here.
  feedback: {
    allow: {
      view: 'false',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ── deny-all fallback ─────────────────────────────────────────────────────────
  // Any namespace not explicitly listed above — InstantDB built-ins ($users/$files)
  // and any future entity — defaults to closed, so a forgotten rule fails safe
  // instead of leaking data. All four entities above have explicit rules that
  // override this, and the client never queries any other namespace.
  $default: {
    allow: { $default: 'false' },
  },

  // ── rate limits ───────────────────────────────────────────────────────────────
  // Token-bucket limits InstantDB enforces server-side on the create/update rules
  // above, keyed per user (auth.id). These are the ONLY rate limits on direct
  // client→DB writes. Starting values — tune from real usage. Periods are duration
  // strings ("1 hour", "1 minute"); refill defaults to greedy (continuous trickle).
  $rateLimits: {
    workspaceCreate: { limits: [{ capacity: 30,  refill: { amount: 30,  period: '1 hour'   } }] },
    workspaceWrite:  { limits: [{ capacity: 300, refill: { amount: 300, period: '1 minute' } }] },
    shareCreate:     { limits: [{ capacity: 60,  refill: { amount: 60,  period: '1 hour'   } }] },
    inviteCreate:    { limits: [{ capacity: 60,  refill: { amount: 60,  period: '1 hour'   } }] },
  },
  // Typed against the app schema (not bare `InstantRules`) so the `$rateLimits` /
  // `$default` special keys resolve correctly instead of being treated as entities.
} satisfies InstantRules<Schema>;

export default rules;
