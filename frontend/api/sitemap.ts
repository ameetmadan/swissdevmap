import { landingPaths } from '../src/lib/landing';
import { companyPath } from '../src/lib/paths';
import { buildSitemap } from '../src/lib/sitemap';
import type { Company } from '../src/store/mapStore';
import { apiBase, fetchJson } from './_upstream';

// Built from the live company list and cached at the edge, so new companies appear within the hour.

export const config = { runtime: 'edge' };

export default async function handler(): Promise<Response> {
    const base = apiBase();
    const companies = base
        ? await fetchJson<Company[]>(`${base}/api/companies`)
        : null;
    if (!companies) {
        return new Response('Company list unavailable', { status: 503, headers: { 'retry-after': '300' } });
    }

    return new Response(buildSitemap(['/', ...landingPaths(companies), ...companies.map(companyPath)]), {
        headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
