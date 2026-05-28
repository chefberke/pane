# Workspace Sharing — Authorization Model

Access control is enforced **server-side** through two layers:

1. **InstantDB permission rules** (`instant.perms.ts`) backed by **schema links**
   (`instant.schema.ts`). These gate every direct client read/write for authenticated
   owners and members.
2. **Admin-token API routes** for the cases CEL cannot express (anonymous share-page
   guests, role-gated non-owner writes, invite acceptance).

## Applying the rules

Order matters. The new rules traverse schema links that older rows don't have yet, so
push the schema, **backfill existing rows**, push the rules, then deploy the app code.

```bash
# 1. Set INSTANT_APP_ADMIN_TOKEN in .env.local (server-only; never NEXT_PUBLIC_).
#    Also set it in the deploy environment (e.g. Vercel) or the API routes will fail.

# 2. Push schema links + permission rules to InstantDB.
bun run db:push        # pushes instant.schema.ts (links) then instant.perms.ts

# 3. Backfill the `workspace` link onto every pre-existing members/shares/invites row.
#    REQUIRED: without it, members invited before this change lose access, because
#    workspaces.view traverses data.ref('members.userId'). Idempotent — safe to re-run.
bun run db:backfill

# 4. Deploy the app code.
```

> ⚠️ Skipping step 3 silently locks existing members out of their workspaces (and breaks
> the owner's member list, role changes, and member removal). Skipping the token in the
> deploy env breaks share pages, non-owner saves, and invite acceptance at runtime.

Verify in the [InstantDB dashboard](https://www.instantdb.com/dash) under **Schema** and
**Permissions**.

---

## Schema links (`instant.schema.ts`)

`workspaceMembers`, `workspaceShares`, and `workspaceInvites` each have a forward
`workspace` link to `workspaces` (reverse labels `members` / `shares` / `invites`,
`onDelete: 'cascade'`). The flat `workspaceId` string fields are retained so existing
queries keep working; the links exist so rules can traverse `data.ref('workspace...')`.

## Permission rules (`instant.perms.ts`)

| Entity | view | create | update | delete |
|---|---|---|---|---|
| `workspaces` | owner OR linked member | self-owned only | **owner only** | owner only |
| `workspaceShares` | creator (owner) | self as creator | creator | creator |
| `workspaceMembers` | workspace owner OR fellow member | **false** (API only) | workspace owner | self OR workspace owner |
| `workspaceInvites` | inviter | self as inviter | inviter | inviter |

`workspaces.update` is owner-only because **non-owner edits go through `/api/workspace/save`**,
and `workspaceMembers.create` is `false` because **members are created only by the
invite-accept route** (prevents arbitrary self-add / role spoofing).

## Admin-token API routes

| Route | Purpose | Authorization |
|---|---|---|
| `GET /api/share/[token]` | Resolve a share link → workspace name + state + role | Valid, non-revoked share token |
| `POST /api/workspace/save` | Persist canvas for non-owner editors | Bearer user (owner/editor member) **or** editor share token |
| `POST /api/invite/[token]/accept` | Accept an invite, create the linked member row | Bearer user whose email matches `invite.email` |

All three run on the server only (`app/lib/admin.ts`, guarded by `server-only`) and are
rate-limited (`app/lib/rateLimit.ts`).

## Security properties

- **No IDOR** — a user can only read workspaces they own or are a member of; only the
  owner can overwrite a workspace directly (others must pass the save route's role check).
- **No privilege escalation** — only the workspace owner can change member roles; members
  cannot be created client-side at all.
- **Token revocation** — setting `revokedAt` on a share row immediately fails the API
  route's validation, blocking both read and write.
- **Invite email binding** — the accept route lowercases and compares `invite.email`
  against the authenticated user's email; acceptance is idempotent (no duplicate members).
- **Anonymous guests** — never touch the sharing tables directly; they only ever see data
  the resolve route returns for a valid token, scoped to `viewer` (read-only) or `editor`.
- **Editor conflict** — v1 uses last-write-wins (stateJson blob); presence cursors make
  concurrent edits visible so users can coordinate.
- **Token entropy** — share/invite tokens are `crypto.randomUUID()` substrings (~88 bits),
  and the resolve/accept routes are rate-limited, so enumeration is impractical.
