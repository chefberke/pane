# InstantDB Permission Rules for Workspace Sharing

## Rules are now in code — `instant.perms.ts`

Rules live in `instant.perms.ts` at the repo root. Apply them with:

```bash
npx instant-cli@latest push perms
```

Then verify in the [InstantDB dashboard](https://www.instantdb.com/dash) under **Permissions**.

---

## Current limitations (requires schema links to fully resolve)

Because `instant.schema.ts` has no `i.link()` definitions, cross-entity CEL rules
(`data.ref()`) are unavailable. Two things that need schema links to fully lock down:

1. **workspace.view** — should only allow members/share-token holders, not everyone
2. **workspace.update** — anonymous share-page editors (no auth.id) cannot be
   validated without an API-route canvas-save endpoint

Until schema links are added, these remain intentionally open.

---

## Legacy JSON format (for reference / manual dashboard entry)

The rules below were the originally intended full ruleset. They rely on cross-entity
joins that require schema links. Use `instant.perms.ts` instead — the JSON here is
kept for historical reference only.

Go to your app in the [InstantDB dashboard](https://www.instantdb.com/dash), open
**Permissions**, and set the following rules (JSON format):

```json
{
  "workspaces": {
    "allow": {
      "view": "auth.id == data.userId || (query.workspaceMembers.userId == auth.id && query.workspaceMembers.workspaceId == data.id) || exists(data.workspaceShares, s => s.workspaceId == data.id && s.revokedAt == null)",
      "create": "auth.id != null",
      "update": "auth.id == data.userId || exists(query.workspaceMembers, m => m.userId == auth.id && m.workspaceId == data.id && m.role == 'editor')",
      "delete": "auth.id == data.userId"
    }
  },
  "workspaceShares": {
    "allow": {
      "view": "auth.id == data.createdBy",
      "create": "auth.id == data.createdBy",
      "update": "auth.id == data.createdBy",
      "delete": "auth.id == data.createdBy"
    }
  },
  "workspaceInvites": {
    "allow": {
      "view": "auth.id != null && (auth.id == data.invitedBy || auth.email == data.email)",
      "create": "auth.id != null",
      "update": "auth.id != null && (auth.id == data.invitedBy || auth.email == data.email)",
      "delete": "auth.id == data.invitedBy"
    }
  },
  "workspaceMembers": {
    "allow": {
      "view": "auth.id != null",
      "create": "auth.id != null",
      "update": "exists(query.workspaceMembers, m => m.userId == auth.id && m.workspaceId == data.workspaceId && m.role == 'owner')",
      "delete": "exists(query.workspaceMembers, m => m.userId == auth.id && m.workspaceId == data.workspaceId && m.role == 'owner') || auth.id == data.userId"
    }
  }
}
```

## What this enforces

| Rule | Effect |
|---|---|
| `workspaces.view` | Only owner, members, or holders of a non-revoked share token can read workspace data |
| `workspaces.update` | Only owner or editor-role members can write canvas state |
| `workspaceShares.*` | Only the creator can manage share links |
| `workspaceInvites.*` | Invitees can read/accept their own invite; only the inviter can delete |
| `workspaceMembers.*` | Only the workspace owner can change roles or remove members |

## Security properties

- **Token revocation** — setting `revokedAt` on a share row immediately blocks access
  (the view rule checks `s.revokedAt == null`)
- **Invite email binding** — invite tokens are linked to a specific email address;
  the accept flow in `/s/invite/[token]/page.tsx` verifies `invite.email === user.email`
- **Anonymous share guests** — can only access canvas state via their role
  (`viewer` = read-only, `editor` = read+write); they cannot touch sharing tables
- **Editor conflict** — v1 uses last-write-wins (stateJson blob); presence cursors
  make concurrent edits visible so users can coordinate
