/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from 'next/server';
import { adminDb } from '@/app/lib/admin';
import { rateLimitRequest } from '@/app/lib/rateLimit';
import { logDevResult } from '@/app/lib/env';

interface Params {
  params: Promise<{ token: string }>;
}

/**
 * Resolves a share token server-side and returns the workspace payload only when
 * the share is valid and not revoked. Keeps `workspaceShares`/`workspaces` reads
 * locked down to owners in the client permission rules.
 */
export async function GET(request: NextRequest, { params }: Params) {
  if (!rateLimitRequest(request, 'share-resolve', 60, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { token } = await params;
  if (!token) {
    logDevResult('share-resolve', 400, 'token missing');
    return Response.json({ error: 'Token required' }, { status: 400 });
  }

  const shareRes = await adminDb.query({
    workspaceShares: { $: { where: { token } as any } },
  });
  const share = (shareRes as any)?.workspaceShares?.[0];
  if (!share || share.revokedAt) {
    logDevResult('share-resolve', 404, share ? 'revoked' : 'token not found');
    return Response.json({ error: 'This link is no longer active.' }, { status: 404 });
  }

  const wsRes = await adminDb.query({
    workspaces: { $: { where: { id: share.workspaceId } as any } },
  });
  const workspace = (wsRes as any)?.workspaces?.[0];
  if (!workspace) {
    logDevResult('share-resolve', 404, 'workspace missing');
    return Response.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  return Response.json({
    workspaceId: share.workspaceId,
    name: workspace.name ?? 'Shared workspace',
    stateJson: workspace.stateJson ?? null,
    role: share.role === 'editor' ? 'editor' : 'viewer',
  });
}
