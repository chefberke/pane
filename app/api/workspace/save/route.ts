/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from 'next/server';
import { adminDb, verifyBearer } from '@/app/lib/admin';
import { rateLimitRequest } from '@/app/lib/rateLimit';
import { logDevResult } from '@/app/lib/env';

// Cap the serialized canvas to guard against oversized / abusive payloads.
const MAX_STATE_BYTES = 2_000_000; // 2 MB

interface SaveBody {
  id?: unknown;
  stateJson?: unknown;
  shareToken?: unknown;
}

/**
 * Persists a workspace's canvas state on behalf of a non-owner editor. Authorizes
 * via either a logged-in user (owner or editor/owner member) or an editor share
 * token, so the client-side `workspaces.update` rule can stay owner-only.
 */
export async function POST(request: NextRequest) {
  if (!rateLimitRequest(request, 'workspace-save', 120, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: SaveBody;
  try {
    body = await request.json();
  } catch {
    logDevResult('workspace-save', 400, 'invalid JSON');
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const stateJson = typeof body.stateJson === 'string' ? body.stateJson : '';
  const shareToken = typeof body.shareToken === 'string' ? body.shareToken : '';

  if (!id || !stateJson) {
    logDevResult('workspace-save', 400, 'id/stateJson missing');
    return Response.json({ error: 'id and stateJson are required' }, { status: 400 });
  }
  if (Buffer.byteLength(stateJson, 'utf8') > MAX_STATE_BYTES) {
    logDevResult('workspace-save', 413, 'state too large');
    return Response.json({ error: 'Canvas state too large' }, { status: 413 });
  }
  // Reject malformed payloads so an editor can't persist garbage that breaks the
  // owner's canvas load (size is already capped above).
  try {
    JSON.parse(stateJson);
  } catch {
    logDevResult('workspace-save', 400, 'stateJson not valid JSON');
    return Response.json({ error: 'stateJson must be valid JSON' }, { status: 400 });
  }

  const authorized = shareToken
    ? await authorizeShare(shareToken, id)
    : await authorizeMember(request, id);

  if (!authorized) {
    logDevResult('workspace-save', 403, shareToken ? 'share token not editor' : 'not owner/editor member');
    return Response.json({ error: 'Not authorized to edit this workspace' }, { status: 403 });
  }

  await adminDb.transact(
    (adminDb.tx as any).workspaces[id].update({ stateJson, updatedAt: Date.now() }),
  );
  return Response.json({ ok: true });
}

/** True if `shareToken` is an active editor share for workspace `id`. */
async function authorizeShare(shareToken: string, id: string): Promise<boolean> {
  const res = await adminDb.query({
    workspaceShares: { $: { where: { token: shareToken } as any } },
  });
  const share = (res as any)?.workspaceShares?.[0];
  return !!share && !share.revokedAt && share.role === 'editor' && share.workspaceId === id;
}

/** True if the bearer user is the owner or an editor/owner member of workspace `id`. */
async function authorizeMember(request: NextRequest, id: string): Promise<boolean> {
  // The workspace lookup keys off `id` (from the request body), not the user, so kick it
  // off in parallel with auth instead of waiting for the bearer check first.
  const userPromise = verifyBearer(request);
  const wsPromise = adminDb.query({
    workspaces: { $: { where: { id } as any } },
  });

  const user = await userPromise;
  if (!user) return false;

  const wsRes = await wsPromise;
  const workspace = (wsRes as any)?.workspaces?.[0];
  if (!workspace) return false;
  if (workspace.userId === user.id) return true; // owner

  const memberRes = await adminDb.query({
    workspaceMembers: { $: { where: { workspaceId: id, userId: user.id } as any } },
  });
  const member = (memberRes as any)?.workspaceMembers?.[0];
  return !!member && (member.role === 'editor' || member.role === 'owner');
}
