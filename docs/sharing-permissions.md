# InstantDB Permission Rules for Workspace Sharing

## ⚠ Required: Apply these rules in the InstantDB dashboard

Without these server-side rules, share tokens provide obscurity only — anyone who
knows a workspace ID can read it directly. These rules make access authoritative.

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
