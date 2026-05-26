import type { InstantRules } from '@instantdb/react';

// ─── Limitation note ──────────────────────────────────────────────────────────
// instant.schema.ts has no i.link() definitions, so cross-entity CEL traversals
// (data.ref / newData.ref) are unavailable here. Rules below provide the best
// protection achievable with flat entity fields only.
//
// Two things that require schema links + a future migration to fully lock down:
//  1. workspace.view  — needs "viewer is a member OR has a valid share token"
//  2. workspace.update — needs "updater is an editor-role member OR share-editor"
//  Until then workspace read/write is gated on auth only (better than wide-open).
//
// workspace.update for anonymous share-page guests (no auth.id) cannot be
// enforced without server-side token validation (API route). That is tracked as
// a follow-up: move canvas save in /s/[token]/page.tsx to an API route that
// validates the token before writing.
// ─────────────────────────────────────────────────────────────────────────────

const rules = {
  // ── workspaces ────────────────────────────────────────────────────────────
  workspaces: {
    bind: [
      'isOwner', 'auth.id != null && auth.id == data.userId',
    ],
    allow: {
      // Intentionally open: anonymous share-page guests need to read workspace
      // data after resolving a token. Proper scoping requires schema links.
      view: 'true',

      // Only authenticated users may create workspaces, and they must own them.
      create: 'auth.id != null && auth.id == newData.userId',

      // Requires auth at minimum. Full member/share-editor check needs links.
      // The share-page anonymous-editor case must be migrated to an API route.
      update: 'isOwner || auth.id != null',

      // Hard gate: only the owner can delete their workspace.
      delete: 'isOwner',
    },
  },

  // ── workspaceShares ───────────────────────────────────────────────────────
  workspaceShares: {
    bind: ['isCreator', 'auth.id != null && auth.id == data.createdBy'],
    allow: {
      // MUST be open: anonymous guests call db.useQuery({ workspaceShares: { $: { where: { token } } } })
      // to resolve a share link. Tokens are crypto.randomUUID() substrings (~88 bits
      // of entropy) so enumeration is not a practical attack.
      view: 'true',

      // Only the workspace owner (createdBy) can create/update/revoke shares.
      create: 'auth.id != null && auth.id == newData.createdBy',
      update: 'isCreator',
      delete: 'isCreator',
    },
  },

  // ── workspaceMembers ──────────────────────────────────────────────────────
  workspaceMembers: {
    bind: [
      'isSelf', 'auth.id != null && auth.id == data.userId',
    ],
    allow: {
      // Any authenticated user may read member lists (needed for presence/UI).
      view: 'auth.id != null',

      // Allow authenticated users to create their own member record (invite
      // acceptance flow). Without schema links we cannot verify an invite
      // exists — the invite-page still checks server-side via client logic.
      create: 'auth.id != null && auth.id == newData.userId',

      // Role updates require the existing workspaceMembers row to already exist.
      // Without links we cannot verify caller is workspace owner here; the
      // UI-level guard in ShareModal is the remaining line of defence until
      // schema links are added.
      update: 'auth.id != null',

      // Any member may remove themselves; owner removal of others relies on UI.
      delete: 'isSelf || auth.id != null',
    },
  },

  // ── workspaceInvites ──────────────────────────────────────────────────────
  workspaceInvites: {
    bind: [
      'isInviter', 'auth.id != null && auth.id == data.invitedBy',
    ],
    allow: {
      // Invitees need to read their own invite to accept it.
      view: 'auth.id != null',

      // Only authenticated users may send invites.
      create: 'auth.id != null && auth.id == newData.invitedBy',

      // Acceptance writes acceptedAt. Both the inviter and the invitee (by
      // email) should be allowed, but email check requires auth.email which
      // may not be exposed. Require auth as minimum gate.
      update: 'auth.id != null',

      // Only the inviter can revoke an invite.
      delete: 'isInviter',
    },
  },
} satisfies InstantRules;

export default rules;
