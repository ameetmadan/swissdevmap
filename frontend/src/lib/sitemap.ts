import { escapeHtml, SITE_URL } from './pageMeta';

/** One <url> per path, absolute against SITE_URL. Duplicates are dropped; order is kept. */
export function buildSitemap(paths: string[]): string {
    const urls = [...new Set(paths)]
        .map((path) => `  <url><loc>${escapeHtml(`${SITE_URL}${path}`)}</loc></url>`)
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
