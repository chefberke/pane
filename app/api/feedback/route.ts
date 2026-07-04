/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from 'next/server';
import { adminDb, verifyBearer } from '@/app/lib/admin';
import { rateLimitRequest } from '@/app/lib/rateLimit';
import { logDevResult } from '@/app/lib/env';
import { FEEDBACK_MAX_LENGTH } from '@/app/lib/constants';

const MOODS = ['Awful', 'Poor', 'Okay', 'Good', 'Great'];
const CATEGORIES = ['bug', 'idea', 'praise', 'other'];

interface FeedbackBody {
  mood?: unknown;
  category?: unknown;
  message?: unknown;
  path?: unknown;
}

/**
 * Stores a feedback submission (mood + category + message). Open to anyone —
 * anonymous or signed-in — so a bearer token, when present, only attaches the
 * sender's identity. Writes via the admin token so the `feedback` namespace stays
 * closed to direct client access (see instant.perms.ts).
 */
export async function POST(request: NextRequest) {
  if (!rateLimitRequest(request, 'feedback', 20, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: FeedbackBody;
  try {
    body = await request.json();
  } catch {
    logDevResult('feedback', 400, 'invalid JSON');
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const mood = typeof body.mood === 'string' ? body.mood : '';
  const category = typeof body.category === 'string' ? body.category : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const path = typeof body.path === 'string' ? body.path.slice(0, 200) : '';

  if (!MOODS.includes(mood)) {
    logDevResult('feedback', 400, 'invalid mood');
    return Response.json({ error: 'invalid mood' }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    logDevResult('feedback', 400, 'unknown category');
    return Response.json({ error: 'invalid category' }, { status: 400 });
  }
  if (!message) {
    logDevResult('feedback', 400, 'empty message');
    return Response.json({ error: 'message is required' }, { status: 400 });
  }
  if (message.length > FEEDBACK_MAX_LENGTH) {
    logDevResult('feedback', 413, 'message too long');
    return Response.json({ error: 'message too long' }, { status: 413 });
  }

  // Anonymous feedback is allowed, so a missing/invalid token just means we store
  // no identity fields.
  const user = await verifyBearer(request);

  try {
    await adminDb.transact(
      (adminDb.tx as any).feedback[crypto.randomUUID()].update({
        mood,
        category,
        message,
        ...(path ? { path } : {}),
        ...(user ? { userId: user.id, email: user.email } : {}),
        createdAt: Date.now(),
      }),
    );
  } catch (err) {
    // Most likely cause: INSTANT_APP_ADMIN_TOKEN unset or the schema not yet pushed.
    logDevResult('feedback', 502, err instanceof Error ? err.message : 'transact failed');
    return Response.json({ error: 'Could not store feedback' }, { status: 502 });
  }

  logDevResult('feedback', 200);
  return Response.json({ ok: true });
}
