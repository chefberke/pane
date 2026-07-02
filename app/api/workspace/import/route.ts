/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from 'next/server';
import { adminDb, verifyBearer } from '@/app/lib/admin';
import { rateLimitRequest } from '@/app/lib/rateLimit';
import { logDevResult } from '@/app/lib/env';

// Match the per-canvas cap enforced on save, and bound how many canvases a single
// import request may create so a bulk restore can't spam the database.
const MAX_STATE_BYTES = 2_000_000; // 2 MB
const MAX_IMPORT_WORKSPACES = 200;

interface ImportItem {
  name?: unknown;
  stateJson?: unknown;
}
interface ImportBody {
  workspaces?: unknown;
}

/**
 * Creates one or more workspaces owned by the authenticated caller from an import
 * file. Uses the admin token so a bulk restore batches into a single transaction and
 * bypasses the per-user client create rate limit; ownership is forced to the bearer
 * user server-side and each canvas's state is size/JSON validated like the save route.
 */
export async function POST(request: NextRequest) {
  if (!rateLimitRequest(request, 'workspace-import', 20, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await verifyBearer(request);
  if (!user) {
    logDevResult('workspace-import', 401, 'no/invalid bearer');
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: ImportBody;
  try {
    body = await request.json();
  } catch {
    logDevResult('workspace-import', 400, 'invalid JSON');
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawList = Array.isArray(body.workspaces) ? (body.workspaces as ImportItem[]) : null;
  if (!rawList || rawList.length === 0) {
    logDevResult('workspace-import', 400, 'workspaces missing/empty');
    return Response.json({ error: 'workspaces array is required' }, { status: 400 });
  }
  if (rawList.length > MAX_IMPORT_WORKSPACES) {
    logDevResult('workspace-import', 400, 'too many workspaces');
    return Response.json({ error: `Too many canvases in one import (max ${MAX_IMPORT_WORKSPACES})` }, { status: 400 });
  }

  const now = Date.now();
  const ids: string[] = [];
  const txs: any[] = [];
  for (const item of rawList) {
    const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Imported canvas';
    const stateJson = typeof item.stateJson === 'string' ? item.stateJson : '';
    if (!stateJson) {
      logDevResult('workspace-import', 400, 'stateJson missing');
      return Response.json({ error: 'Each canvas requires stateJson' }, { status: 400 });
    }
    if (Buffer.byteLength(stateJson, 'utf8') > MAX_STATE_BYTES) {
      logDevResult('workspace-import', 413, 'state too large');
      return Response.json({ error: 'Canvas state too large' }, { status: 413 });
    }
    try {
      JSON.parse(stateJson);
    } catch {
      logDevResult('workspace-import', 400, 'stateJson not valid JSON');
      return Response.json({ error: 'stateJson must be valid JSON' }, { status: 400 });
    }
    const wid = crypto.randomUUID();
    ids.push(wid);
    txs.push(
      (adminDb.tx as any).workspaces[wid].update({
        userId: user.id, // ownership forced server-side — the client can't spoof it
        name,
        stateJson,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  await adminDb.transact(txs);
  logDevResult('workspace-import', 200, `${ids.length} imported`);
  return Response.json({ ids });
}
