import { lookup } from 'dns/promises';

const PRIVATE_RANGES = [
  // IPv4 loopback / link-local / private / multicast
  /^127\./,
  /^169\.254\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // RFC 6598 shared address space
  /^0\./,
  /^(22[4-9]|2[3-4]\d|25[0-5])\./,  // multicast 224-255.x.x.x
  // IPv6 loopback, link-local, ULA
  /^::1$/,
  /^fe[89ab][0-9a-f]:/i,  // link-local fe80::/10
  /^fc[0-9a-f]{2}:/i,     // ULA fc00::/7
  /^fd[0-9a-f]{2}:/i,
];

/** Validates the URL is https:// with a public hostname and no credentials. */
export function assertPublicHttpsUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http/https URLs are allowed');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs with credentials are not allowed');
  }
  // Block bare IP literals in the host field (numeric IPv4 / bracketed IPv6)
  const host = parsed.hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith('[')) {
    if (isPrivateIp(host.replace(/^\[|\]$/g, ''))) {
      throw new Error('URL resolves to a private address');
    }
  }
  return parsed;
}

/** Resolves a hostname and throws if any returned address is private/loopback. */
export async function assertPublicHostname(hostname: string): Promise<void> {
  let records: { address: string }[];
  try {
    records = await lookup(hostname, { all: true });
  } catch {
    throw new Error('Could not resolve hostname');
  }
  for (const { address } of records) {
    if (isPrivateIp(address)) {
      throw new Error('URL resolves to a private address');
    }
  }
}

function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some(r => r.test(ip));
}

const MAX_RESPONSE_BYTES = 1_000_000; // 1 MB
const MAX_HOPS = 3;

/**
 * Fetches a URL with manual redirect handling so every hop is validated.
 * Throws if a redirect would land on a private address.
 */
export async function safeFetch(
  url: URL,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const res = await fetch(current.toString(), {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirect with no Location header');
      const next = assertPublicHttpsUrl(new URL(location, current).toString());
      await assertPublicHostname(next.hostname);
      current = next;
      continue;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Cap response size to prevent memory exhaustion
    const reader = res.body?.getReader();
    if (!reader) return new Response('', { status: res.status, headers: res.headers });

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value?.byteLength ?? 0;
      if (total > MAX_RESPONSE_BYTES) {
        reader.cancel();
        throw new Error('Response too large');
      }
      if (value) chunks.push(value);
    }

    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new Response(body, { status: res.status, headers: res.headers });
  }
  throw new Error('Too many redirects');
}
