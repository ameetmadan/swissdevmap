import { companyMeta, DEFAULT_META, injectPage, PageMeta, viewMeta } from '../src/lib/pageMeta';
import { parseView } from '../src/lib/viewUrl';
import { apiBase, fetchJson } from './_upstream';

// Serves index.html with <head> tags and, for companies, readable content for the requested URL.
// Crawlers don't run the SPA, so this is what makes a pasted link unfurl with a real title and
// image, and what lets a company page be indexed. vercel.json routes /company/:ref and filtered
// `/?tag=…` URLs here; everything else stays static.

export const config = { runtime: 'edge' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_REF_LENGTH = 80;

type CompanyRecord = Parameters<typeof companyMeta>[0];

const isCompanyRef = (ref: string) => UUID.test(ref) || (ref.length <= MAX_REF_LENGTH && SLUG.test(ref));

async function describeView(url: URL, base: string): Promise<PageMeta> {
    const view = parseView(url.search);
    // A commute count needs the rate-limited SBB lookup, so previews skip counting for those views.
    if (view.commute) return viewMeta(view, null);

    const params = new URLSearchParams();
    view.tags.forEach((tag) => params.append('tag', tag));
    view.types.forEach((type) => params.append('type', type));
    const companies = await fetchJson<unknown[]>(`${base}/api/companies?${params.toString()}`);
    return viewMeta(view, companies ? companies.length : null);
}

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const base = apiBase();
    const ref = url.searchParams.get('ref');

    let company: CompanyRecord | null = null;
    let meta: PageMeta = DEFAULT_META;
    if (base && ref && isCompanyRef(ref)) {
        company = await fetchJson<CompanyRecord>(`${base}/api/companies/${ref}`);
        if (company) meta = companyMeta(company);
    } else if (base && !ref) {
        meta = await describeView(url, base);
    }

    // An id-based link permanently moves to the slug URL, so only one address per company gets indexed.
    if (company?.slug && ref !== company.slug) {
        const query = new URLSearchParams(url.search);
        query.delete('ref');
        const search = query.toString();
        return new Response(null, {
            status: 301,
            headers: {
                location: `${url.origin}${meta.path}${search ? `?${search}` : ''}`,
                'cache-control': 'public, s-maxage=3600',
            },
        });
    }

    // Deployment protection on previews guards the self-fetch too, so pass the caller's credentials on.
    const templateHeaders = new Headers();
    for (const name of ['cookie', 'x-vercel-protection-bypass']) {
        const value = request.headers.get(name);
        if (value) templateHeaders.set(name, value);
    }
    const html = await fetch(`${url.origin}/index.html`, { headers: templateHeaders }).then((res) => res.text());

    return new Response(injectPage(html, meta), {
        headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
