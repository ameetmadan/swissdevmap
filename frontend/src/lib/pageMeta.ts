import { companyPath } from './paths';
import { ViewState, viewKey } from './viewUrl';

export const SITE_URL = 'https://swissdevmap.ch';
export const SITE_NAME = 'SwissDevMap';

export interface PageMeta {
    title: string;
    description: string;
    /** Path plus canonical query string, relative to SITE_URL. */
    path: string;
    image: { title: string; subtitle: string; tags: string[] };
    /** schema.org data for crawlers. */
    jsonLd?: Record<string, unknown>;
    /** Plain HTML placed inside #root for clients that don't run the app. React replaces it on mount. */
    bodyHtml?: string;
}

export interface CompanyMetaInput {
    id: string;
    slug?: string | null;
    name: string;
    city?: string | null;
    type?: string | null;
    website?: string | null;
    uid?: string | null;
    tags: { tag: string | null }[];
}

const plainBody = (heading: string, text: string) =>
    `<main class="visually-hidden"><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(text)}</p></main>`;

/** The map's own heading, for assistive tech and for clients that never run the app. */
export const MAP_HEADING = 'SwissDevMap: Swiss tech companies and the technologies they use, on a map';

export const DEFAULT_META: PageMeta = {
    title: `${SITE_NAME} — Swiss tech stacks on a map`,
    description:
        "Explore which Swiss tech companies use which technologies. Filter by stack, company type or commute time on an interactive map of Switzerland's tech ecosystem.",
    path: '/',
    image: {
        title: SITE_NAME,
        subtitle: "Which Swiss companies use which tech? Explore Switzerland's tech ecosystem on a map.",
        tags: [],
    },
    bodyHtml: plainBody(
        MAP_HEADING,
        "Explore which Swiss tech companies use which technologies. Filter by stack, company type or commute time on an interactive map of Switzerland's tech ecosystem.",
    ),
};

const MAX_LISTED_TAGS = 6;

function list(values: string[]): string {
    if (values.length <= 1) return values.join('');
    if (values.length <= 3) return `${values.slice(0, -1).join(', ')} & ${values[values.length - 1]}`;
    return `${values.slice(0, 3).join(', ')} & ${values.length - 3} more`;
}

function isFiltered(view: ViewState): boolean {
    return view.tags.length > 0 || view.types.length > 0 || view.heatmapTech !== null || view.commute !== null;
}

function viewSubject(view: ViewState): string {
    const noun = view.types.length ? `${list(view.types)} companies` : 'Tech companies';
    const using = view.tags.length ? ` using ${list(view.tags)}` : '';
    const where = view.commute
        ? ` within ${view.commute.minutes} min of ${view.commute.from}`
        : ' in Switzerland';
    return `${noun}${using}${where}`;
}

export function viewTitle(view: ViewState): string {
    if (!isFiltered(view)) return DEFAULT_META.title;
    if (view.heatmapTech && !view.tags.length && !view.types.length && !view.commute) {
        return `${view.heatmapTech} heatmap of Swiss tech companies | ${SITE_NAME}`;
    }
    const heatmap = view.heatmapTech ? ` · ${view.heatmapTech} heatmap` : '';
    return `${viewSubject(view)}${heatmap} | ${SITE_NAME}`;
}

/** `count` is null when it isn't known, e.g. commute results need a slow SBB lookup. */
export function viewMeta(view: ViewState, count: number | null): PageMeta {
    if (!isFiltered(view)) return DEFAULT_META;
    if (view.heatmapTech && !view.tags.length && !view.types.length && !view.commute) {
        const across = count === null ? 'Swiss tech companies' : `${count} Swiss tech companies`;
        return {
            title: viewTitle(view),
            description: `Heatmap of where ${view.heatmapTech} is used across ${across}, on the SwissDevMap interactive map.`,
            path: `/${viewKey(view)}`,
            image: { title: `${view.heatmapTech} across Switzerland`, subtitle: 'Heatmap on SwissDevMap', tags: [view.heatmapTech] },
            bodyHtml: plainBody(`${view.heatmapTech} across Switzerland`, `Heatmap of where ${view.heatmapTech} is used across ${across}.`),
        };
    }
    const subject = viewSubject(view);
    const counted =
        count === null || view.commute
            ? `${subject}.`
            : `${count} ${count === 1 ? 'company matches' : 'companies match'}: ${subject.charAt(0).toLowerCase()}${subject.slice(1)}.`;
    return {
        title: viewTitle(view),
        description: `${counted} Explore them on the SwissDevMap interactive map of Switzerland's tech ecosystem.`,
        path: `/${viewKey(view)}`,
        image: {
            title: subject,
            subtitle: count === null || view.commute ? 'SwissDevMap' : `${count} on SwissDevMap`,
            tags: view.tags,
        },
        bodyHtml: plainBody(subject, counted),
    };
}

export function companyTitle(company: Pick<CompanyMetaInput, 'name' | 'city'>): string {
    const where = company.city ? ` (${company.city})` : '';
    return `${company.name}${where} tech stack | ${SITE_NAME}`;
}

const isHttpUrl = (value?: string | null): value is string => !!value && /^https?:\/\//i.test(value);

function companyJsonLd(company: CompanyMetaInput, tags: string[], url: string): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: company.name,
        mainEntityOfPage: url,
        ...(isHttpUrl(company.website) && { url: company.website }),
        ...(company.city && {
            address: { '@type': 'PostalAddress', addressLocality: company.city, addressCountry: 'CH' },
        }),
        ...(company.uid && { identifier: company.uid }),
        ...(tags.length > 0 && { knowsAbout: tags }),
    };
}

function companyBodyHtml(company: CompanyMetaInput, tags: string[]): string {
    const where = [company.type, company.city].filter(Boolean).join(' · ');
    return [
        '<main class="visually-hidden">',
        `<h1>${escapeHtml(company.name)}</h1>`,
        where ? `<p>${escapeHtml(where)}</p>` : '',
        tags.length ? `<h2>Tech stack</h2><ul>${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>` : '',
        '<p><a href="/">Explore Swiss tech companies on SwissDevMap</a></p>',
        '</main>',
    ].join('');
}

export function companyMeta(company: CompanyMetaInput): PageMeta {
    const tags = company.tags.flatMap((t) => (t.tag ? [t.tag] : []));
    const city = company.city ? ` in ${company.city}` : '';
    const stack = tags.length
        ? `uses ${tags.slice(0, MAX_LISTED_TAGS).join(', ')}${tags.length > MAX_LISTED_TAGS ? ' and more' : ''}`
        : 'is listed';
    const path = companyPath(company);
    return {
        title: companyTitle({ name: company.name, city: company.city ?? undefined }),
        description: `${company.name}${city} ${stack}. See their full tech stack on SwissDevMap.`,
        path,
        image: {
            title: company.name,
            subtitle: [company.type, company.city].filter(Boolean).join(' · ') || 'Swiss tech company',
            tags,
        },
        jsonLd: companyJsonLd(company, tags, `${SITE_URL}${path}`),
        bodyHtml: companyBodyHtml(company, tags),
    };
}

export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function ogImageUrl(image: PageMeta['image']): string {
    const params = new URLSearchParams({ title: image.title, subtitle: image.subtitle });
    if (image.tags.length) params.set('tags', image.tags.slice(0, MAX_LISTED_TAGS).join(','));
    return `${SITE_URL}/api/og?${params.toString()}`;
}

/** Everything crawlers read from <head>, as one block of HTML. */
/** `<` is escaped so a company name containing `</script>` can't end the block early. */
function serializeJsonLd(data: Record<string, unknown>): string {
    return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function renderHeadTags(meta: PageMeta): string {
    const url = `${SITE_URL}${meta.path}`;
    const image = ogImageUrl(meta.image);
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    return [
        `<title>${title}</title>`,
        `<meta name="description" content="${description}" />`,
        `<link rel="canonical" href="${escapeHtml(url)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${SITE_NAME}" />`,
        `<meta property="og:title" content="${title}" />`,
        `<meta property="og:description" content="${description}" />`,
        `<meta property="og:url" content="${escapeHtml(url)}" />`,
        `<meta property="og:image" content="${escapeHtml(image)}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${title}" />`,
        `<meta name="twitter:description" content="${description}" />`,
        `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
        ...(meta.jsonLd ? [`<script type="application/ld+json">${serializeJsonLd(meta.jsonLd)}</script>`] : []),
    ].join('\n  ');
}

const HEAD_TAG_PATTERNS = [
    /<title>[\s\S]*?<\/title>\s*/i,
    /<meta\s+name="description"[^>]*>\s*/i,
    /<link\s+rel="canonical"[^>]*>\s*/i,
    /<meta\s+(?:property="og:|name="twitter:)[^>]*>\s*/gi,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi,
];

/** Swaps the SEO tags in a built index.html for the ones describing `meta`, and fills #root if it has a body. */
export function injectPage(html: string, meta: PageMeta): string {
    const stripped = HEAD_TAG_PATTERNS.reduce((out, pattern) => out.replace(pattern, ''), html);
    const withHead = stripped.replace('</head>', `  ${renderHeadTags(meta)}\n</head>`);
    return meta.bodyHtml
        ? withHead.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${meta.bodyHtml}</div>`)
        : withHead;
}
