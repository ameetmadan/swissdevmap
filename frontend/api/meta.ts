import { companyMeta, DEFAULT_META, injectHeadTags, PageMeta, viewMeta } from '../src/lib/pageMeta';
import { parseView } from '../src/lib/viewUrl';

// Serves index.html with <head> tags for the requested company or filtered view. Crawlers don't
// run the SPA, so this is what makes a pasted link unfurl with a real title and image.
// vercel.json routes /company/:id and filtered `/?tag=…` URLs here; everything else stays static.

export const config = { runtime: 'edge' };

const UPSTREAM_TIMEOUT_MS = 3000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchJson<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res.ok ? ((await res.json()) as T) : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

async function describePage(url: URL, apiBase: string): Promise<PageMeta> {
    const id = url.searchParams.get('id');
    if (id) {
        if (!UUID.test(id)) return DEFAULT_META;
        const company = await fetchJson<Parameters<typeof companyMeta>[0]>(`${apiBase}/api/companies/${id}`);
        return company ? companyMeta(company) : DEFAULT_META;
    }

    const view = parseView(url.search);
    // A commute count needs the rate-limited SBB lookup, so previews skip counting for those views.
    if (view.commute) return viewMeta(view, null);

    const params = new URLSearchParams();
    view.tags.forEach((tag) => params.append('tag', tag));
    view.types.forEach((type) => params.append('type', type));
    const companies = await fetchJson<unknown[]>(`${apiBase}/api/companies?${params.toString()}`);
    return viewMeta(view, companies ? companies.length : null);
}

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const apiBase = (process.env.VITE_API_URL ?? '').replace(/\/$/, '');

    // Deployment protection on previews guards the self-fetch too, so pass the caller's credentials on.
    const templateHeaders = new Headers();
    for (const name of ['cookie', 'x-vercel-protection-bypass']) {
        const value = request.headers.get(name);
        if (value) templateHeaders.set(name, value);
    }

    const [html, meta] = await Promise.all([
        fetch(`${url.origin}/index.html`, { headers: templateHeaders }).then((res) => res.text()),
        apiBase ? describePage(url, apiBase) : DEFAULT_META,
    ]);

    return new Response(injectHeadTags(html, meta), {
        headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
