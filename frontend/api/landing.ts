import { landingBodyHtml, landingMeta, parseLandingPath, resolveLanding } from '../src/lib/landing';
import { DEFAULT_META, injectPage } from '../src/lib/pageMeta';
import type { Company } from '../src/store/mapStore';
import { apiBase, fetchJson } from './_upstream';

// Serves /tech/:tag, /city/:city and /tech/:tag/city/:city. The body is the same content the SPA
// renders, so crawlers and people see one page. Thin slices redirect to their widest valid parent.

export const config = { runtime: 'edge' };

async function template(request: Request, origin: string): Promise<string> {
    // Deployment protection on previews guards the self-fetch too, so pass the caller's credentials on.
    const headers = new Headers();
    for (const name of ['cookie', 'x-vercel-protection-bypass']) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
    }
    return fetch(`${origin}/index.html`, { headers }).then((res) => res.text());
}

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const tag = url.searchParams.get('tag');
    const city = url.searchParams.get('city');
    const params = parseLandingPath(`${tag ? `/tech/${tag}` : ''}${city ? `/city/${city}` : ''}`);
    const base = apiBase();
    const html = await template(request, url.origin);
    const htmlHeaders = { 'content-type': 'text/html; charset=utf-8' };

    const companies = params && base ? await fetchJson<Company[]>(`${base}/api/companies`) : null;
    if (!params || !companies) {
        // Unknown shape or no data: hand the SPA its shell and let it resolve the page itself.
        const status = params ? 200 : 404;
        return new Response(injectPage(html, DEFAULT_META), {
            status,
            headers: { ...htmlHeaders, 'cache-control': 'public, max-age=0, s-maxage=60' },
        });
    }

    const resolution = resolveLanding(companies, params);
    if (resolution.kind === 'redirect') {
        return new Response(null, {
            status: 302,
            headers: { location: `${url.origin}${resolution.to}`, 'cache-control': 'public, s-maxage=3600' },
        });
    }
    if (resolution.kind === 'missing') {
        return new Response(injectPage(html, DEFAULT_META), {
            status: 404,
            headers: { ...htmlHeaders, 'cache-control': 'public, max-age=0, s-maxage=300' },
        });
    }

    const { model } = resolution;
    return new Response(injectPage(html, { ...landingMeta(model), bodyHtml: landingBodyHtml(model) }), {
        headers: { ...htmlHeaders, 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
    });
}
