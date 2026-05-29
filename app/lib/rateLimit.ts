import 'server-only';
import { isDev, logDevRequest } from './env';

// NOTE: This is an in-memory, per-instance limiter. On serverless/multi-instance
// deployments each instance has its own counters, so it is best-effort abuse
// protection rather than a hard global limit. For production-grade limiting,
// back this with a durable store (e.g. Upstash Redis) keyed the same way.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Derives a client key from the request's forwarded IP (falls back to a constant). */
export function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0]!.trim() : request.headers.get('x-real-ip');
  return ip || 'unknown';
}

/**
 * Fixed-window rate limiter. Returns true if the request is allowed, false if the
 * caller has exceeded `limit` requests within `windowMs` for the given bucket.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic cleanup so the map does not grow unbounded.
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
    }
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/** Convenience wrapper: rate-limit by client IP under a named route bucket. */
export function rateLimitRequest(
  request: Request,
  routeName: string,
  limit: number,
  windowMs: number,
): boolean {
  // Dev: log the hit and never rate-limit so local testing doesn't trip 429s.
  if (isDev) {
    logDevRequest(routeName, request);
    return true;
  }
  return rateLimit(`${routeName}:${clientKey(request)}`, limit, windowMs);
}
