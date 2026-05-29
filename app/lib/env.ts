import 'server-only';

// Single source of truth for the dev/prod distinction used by server-side guards.
// In development (`next dev`), rate limiting is bypassed and the SSRF guard allows
// localhost/private hosts; production builds keep both fully active.

/** True when not running a production build (`next dev` / `NODE_ENV !== "production"`). */
export const isDev = process.env.NODE_ENV !== 'production';

/** Logs a compact API request line in dev only (route + method + client IP); no-op in prod. */
export function logDevRequest(routeName: string, request: Request): void {
  if (!isDev) return;
  const fwd = request.headers.get('x-forwarded-for');
  const ip = (fwd ? fwd.split(',')[0]!.trim() : request.headers.get('x-real-ip')) || 'unknown';
  console.log(`[dev] ${request.method} ${routeName} ip=${ip}`);
}

/** Logs a dev-only outcome line (route + HTTP status + optional reason); no-op in prod. */
export function logDevResult(routeName: string, status: number, reason?: string): void {
  if (!isDev) return;
  console.log(`[dev] ${routeName} → ${status}${reason ? ` (${reason})` : ''}`);
}
