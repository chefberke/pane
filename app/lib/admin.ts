import 'server-only';
import { init } from '@instantdb/admin';
import type { User } from '@instantdb/admin';
import schema from '../../instant.schema';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.warn(
    '[InstantDB admin] INSTANT_APP_ADMIN_TOKEN is not set. Server-side authorization ' +
    'routes (share resolve, workspace save, invite accept) will fail until it is provided.',
  );
}

/**
 * Server-only InstantDB admin client. Uses the admin token to bypass permission
 * rules, so it MUST only ever run on the server (guarded by `server-only`) and
 * every route using it is responsible for authorizing the request itself.
 */
export const adminDb = init({
  appId: APP_ID || 'missing-instant-app-id',
  adminToken: ADMIN_TOKEN || 'missing-admin-token',
  schema,
});

/**
 * Verifies the `Authorization: Bearer <refresh_token>` header against InstantDB
 * and returns the authenticated user, or null if absent/invalid.
 */
export async function verifyBearer(request: Request): Promise<User | null> {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  try {
    return await adminDb.auth.verifyToken(match[1]);
  } catch {
    return null;
  }
}
