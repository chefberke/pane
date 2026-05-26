import type { NextRequest } from 'next/server';
import { assertPublicHttpsUrl, assertPublicHostname, safeFetch } from './security';

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) return Response.json({ error: 'URL required' }, { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = assertPublicHttpsUrl(raw);
    await assertPublicHostname(parsedUrl.hostname);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid URL';
    return Response.json({ error: msg }, { status: 400 });
  }

  let html: string;
  try {
    const res = await safeFetch(
      parsedUrl,
      { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
      6000,
    );
    html = await res.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    return Response.json({ error: msg }, { status: 400 });
  }

  const meta = (name: string) => {
    const patterns = [
      new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${name}["']`, 'i'),
      new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i'),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) return decodeHTMLEntities(m[1]);
    }
    return undefined;
  };

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = meta('title') || (titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : undefined);
  const description = meta('description');
  const image = meta('image');

  const origin = parsedUrl.origin;
  const faviconMatch = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)
    || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*icon[^"']*["']/i);
  let favicon = faviconMatch?.[1] ?? `${origin}/favicon.ico`;
  if (favicon && !favicon.startsWith('http')) {
    favicon = favicon.startsWith('/') ? `${origin}${favicon}` : `${origin}/${favicon}`;
  }

  return Response.json({ title, description, image, favicon, url: parsedUrl.toString() });
}

function decodeHTMLEntities(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
