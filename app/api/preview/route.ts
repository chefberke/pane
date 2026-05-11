import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return Response.json({ error: 'Fetch failed' }, { status: 400 });

    const html = await res.text();

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

    const origin = new URL(url).origin;
    const faviconMatch = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)
      || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*icon[^"']*["']/i);
    let favicon = faviconMatch?.[1] ?? `${origin}/favicon.ico`;
    if (favicon && !favicon.startsWith('http')) {
      favicon = favicon.startsWith('/') ? `${origin}${favicon}` : `${origin}/${favicon}`;
    }

    return Response.json({ title, description, image, favicon, url });
  } catch {
    return Response.json({ error: 'Preview unavailable' }, { status: 500 });
  }
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
