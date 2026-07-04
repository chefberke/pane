// Client-safe helpers for calling our API routes with the signed-in user's bearer
// token. No `server-only` guard — these run in the browser. Each caller keeps its own
// missing-token policy (throw / silent skip / allow anonymous); the only thing shared
// here is reading `refresh_token` and building the header.

/** The minimal shape we need off the InstantDB auth user — satisfied by `User | null | undefined`. */
type AuthUser = { refresh_token?: string } | null | undefined;

/** Bearer auth header for the signed-in user, or `{}` when anonymous. */
export function authHeader(user: AuthUser): Record<string, string> {
  const token = user?.refresh_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** POST a JSON body to an app API route, attaching the user's bearer token when present. */
export function postJson(url: string, body: unknown, user: AuthUser): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(user) },
    body: JSON.stringify(body),
  });
}
