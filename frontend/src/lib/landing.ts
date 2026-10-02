import type { Company } from '../store/mapStore';
import { companyPath } from './paths';
import type { PageMeta } from './pageMeta';
import { escapeHtml, SITE_NAME } from './pageMeta';
import { slugify, tagSlug } from './slug';

/** A page needs at least this many companies; thinner slices would be near-empty indexable pages. */
export const MIN_COMPANIES = 3;
const MAX_LISTED_COMPANIES = 60;
const MAX_RELATED = 6;
/** A technology only counts as "paired" or "related" once this many companies in the slice use it. */
const MIN_CO_OCCURRENCE = 2;

export interface LandingSpec {
    tag?: string;
    city?: string;
}

export interface LandingLink {
    label: string;
    path: string;
    count: number;
}

export interface LandingModel {
    spec: LandingSpec;
    path: string;
    title: string;
    h1: string;
    description: string;
    intro: string;
    count: number;
    liveMapPath: string;
    companies: { name: string; path: string; city: string }[];
    relatedTech: LandingLink[];
    relatedCities: LandingLink[];
}

export type LandingResolution =
    | { kind: 'page'; model: LandingModel }
    | { kind: 'redirect'; to: string }
    | { kind: 'missing' };

export function landingPath({ tag, city }: LandingSpec): string {
    const tech = tag ? `/tech/${tagSlug(tag)}` : '';
    const place = city ? `/city/${slugify(city)}` : '';
    return `${tech}${place}` || '/';
}

/** `/tech/rust`, `/city/zurich` and `/tech/rust/city/zurich`; anything else is not a landing path. */
export function parseLandingPath(pathname: string): { tagSlug?: string; citySlug?: string } | null {
    const parts = pathname.split('/').filter(Boolean);
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const [first, second, third, fourth] = parts;
    if (parts.length === 2 && first === 'tech' && slug.test(second)) return { tagSlug: second };
    if (parts.length === 2 && first === 'city' && slug.test(second)) return { citySlug: second };
    if (parts.length === 4 && first === 'tech' && third === 'city' && slug.test(second) && slug.test(fourth)) {
        return { tagSlug: second, citySlug: fourth };
    }
    return null;
}

const usesTag = (company: Company, tag: string) => company.tags.some((t) => t.tag === tag);

function matching(companies: Company[], { tag, city }: LandingSpec): Company[] {
    return companies.filter((c) => (!tag || usesTag(c, tag)) && (!city || c.city === city));
}

function tally(values: string[]): [string, number][] {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const listOf = (items: string[]) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const companiesLabel = (count: number) => `${count} ${count === 1 ? 'company' : 'companies'}`;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
}

function liveMapPath(spec: LandingSpec): string {
    return spec.tag ? `/?${new URLSearchParams({ tag: spec.tag }).toString()}` : '/';
}

/** The best page for a slice: itself if it is big enough, otherwise the widest valid parent. */
function fallbackPath(companies: Company[], spec: LandingSpec): string {
    const candidates: LandingSpec[] = [spec, ...(spec.tag ? [{ tag: spec.tag }] : []), ...(spec.city ? [{ city: spec.city }] : [])];
    const valid = candidates.find((c) => matching(companies, c).length >= MIN_COMPANIES);
    return valid ? landingPath(valid) : liveMapPath(spec);
}

function describe(spec: LandingSpec, slice: Company[], cityTotal: number): { h1: string; title: string; intro: string } {
    const count = slice.length;
    const topCities = tally(slice.map((c) => c.city).filter(Boolean)).slice(0, 3).map(([c, n]) => `${c} (${n})`);
    const otherTech = (exclude?: string) =>
        tally(slice.flatMap((c) => c.tags.map((t) => t.tag)).filter((t) => t !== exclude)).slice(0, 3);

    if (spec.tag && spec.city) {
        return {
            h1: `${spec.tag} companies in ${spec.city}`,
            title: `${spec.tag} companies in ${spec.city} (${count}) | ${SITE_NAME}`,
            intro: `${companiesLabel(count)} in ${spec.city} use ${spec.tag}, out of ${cityTotal} tech companies listed there.`,
        };
    }
    if (spec.tag) {
        const paired = otherTech(spec.tag).filter(([, n]) => n >= MIN_CO_OCCURRENCE).map(([t]) => t);
        return {
            h1: `Swiss companies using ${spec.tag}`,
            title: `Companies using ${spec.tag} in Switzerland (${count}) | ${SITE_NAME}`,
            intro: `${companiesLabel(count)} in Switzerland use ${spec.tag}. ${topCities.length ? `Most are based in ${listOf(topCities)}. ` : ''}${paired.length ? `They often pair it with ${listOf(paired)}.` : ''}`.trim(),
        };
    }
    const popular = otherTech().map(([t, n]) => `${t} (${n})`);
    return {
        h1: `Tech companies in ${spec.city}`,
        title: `Tech companies in ${spec.city} (${count}) | ${SITE_NAME}`,
        intro: `${companiesLabel(count)} in ${spec.city} are on ${SITE_NAME}. ${popular.length ? `Popular technologies there: ${listOf(popular)}.` : ''}`.trim(),
    };
}

export function resolveLanding(
    companies: Company[],
    params: { tagSlug?: string; citySlug?: string },
): LandingResolution {
    const tag = params.tagSlug
        ? [...new Set(companies.flatMap((c) => c.tags.map((t) => t.tag)))].find((t) => tagSlug(t) === params.tagSlug)
        : undefined;
    const city = params.citySlug
        ? [...new Set(companies.map((c) => c.city).filter(Boolean))].find((c) => slugify(c) === params.citySlug)
        : undefined;
    if ((params.tagSlug && !tag) || (params.citySlug && !city)) return { kind: 'missing' };

    const spec: LandingSpec = { tag, city };
    const slice = matching(companies, spec);
    if (slice.length < MIN_COMPANIES) return { kind: 'redirect', to: fallbackPath(companies, spec) };

    const cityTotal = city ? matching(companies, { city }).length : slice.length;
    const text = describe(spec, slice, cityTotal);
    const path = landingPath(spec);

    const link = (label: string, target: LandingSpec): LandingLink | null => {
        const count = matching(companies, target).length;
        return count >= MIN_COMPANIES ? { label, path: landingPath(target), count } : null;
    };
    const present = (links: (LandingLink | null)[]): LandingLink[] =>
        links.filter((l): l is LandingLink => l !== null).slice(0, MAX_RELATED);

    const otherTech = tally(slice.flatMap((c) => c.tags.map((t) => t.tag)).filter((t) => t !== tag))
        .filter(([, n]) => n >= MIN_CO_OCCURRENCE)
        .map(([t]) => t);
    const relatedTech = present(otherTech.map((t) => link(t, { tag: t, city }) ?? link(t, { tag: t })));

    let relatedCities: LandingLink[];
    if (city) {
        const centre = (name: string) => {
            const cs = companies.filter((c) => c.city === name);
            return { lat: cs.reduce((s, c) => s + c.lat, 0) / cs.length, lng: cs.reduce((s, c) => s + c.lng, 0) / cs.length };
        };
        const here = centre(city);
        const nearby = [...new Set(companies.map((c) => c.city).filter((c) => c && c !== city))]
            .sort((a, b) => distanceKm(here, centre(a)) - distanceKm(here, centre(b)));
        relatedCities = present(nearby.map((c) => link(c, { tag, city: c }) ?? link(c, { city: c })));
    } else {
        relatedCities = present(
            tally(slice.map((c) => c.city).filter(Boolean)).map(([c]) => link(c, { tag, city: c }) ?? link(c, { city: c })),
        );
    }

    return {
        kind: 'page',
        model: {
            spec,
            path,
            ...text,
            description: text.intro,
            count: slice.length,
            liveMapPath: liveMapPath(spec),
            companies: [...slice]
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, MAX_LISTED_COMPANIES)
                .map((c) => ({ name: c.name, path: companyPath(c), city: c.city })),
            relatedTech,
            relatedCities,
        },
    };
}

/** Every landing path worth indexing, for the sitemap. */
export function landingPaths(companies: Company[]): string[] {
    const tags = [...new Set(companies.flatMap((c) => c.tags.map((t) => t.tag)))];
    const cities = [...new Set(companies.map((c) => c.city).filter(Boolean))];
    const specs: LandingSpec[] = [
        ...tags.map((tag) => ({ tag })),
        ...cities.map((city) => ({ city })),
        ...tags.flatMap((tag) => cities.map((city) => ({ tag, city }))),
    ];
    return specs.filter((s) => matching(companies, s).length >= MIN_COMPANIES).map(landingPath).sort();
}

export function landingMeta(model: LandingModel): PageMeta {
    return {
        title: model.title,
        description: model.description,
        path: model.path,
        image: {
            title: model.h1,
            subtitle: `${companiesLabel(model.count)} on ${SITE_NAME}`,
            tags: model.spec.tag ? [model.spec.tag] : model.relatedTech.map((l) => l.label),
        },
    };
}

const anchor = (href: string, label: string) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;

/** Must stay byte-for-byte what <LandingContent> renders; a test compares the two. */
export function landingBodyHtml(model: LandingModel): string {
    const links = (heading: string, items: LandingLink[]) =>
        items.length
            ? `<section><h2>${heading}</h2><ul class="landing-links">${items
                .map((l) => `<li>${anchor(l.path, l.label)} <span>${l.count}</span></li>`)
                .join('')}</ul></section>`
            : '';
    return [
        '<main class="landing">',
        `<p class="landing-brand">${anchor('/', SITE_NAME)}</p>`,
        `<h1>${escapeHtml(model.h1)}</h1>`,
        `<p class="landing-intro">${escapeHtml(model.intro)}</p>`,
        `<p>${anchor(model.liveMapPath, 'Open this view on the interactive map →')}</p>`,
        links('Related technologies', model.relatedTech),
        links(model.spec.city ? 'Nearby cities' : 'Where it is used', model.relatedCities),
        `<section><h2>Companies (${model.count})</h2><ul class="landing-companies">${model.companies
            .map((c) => `<li>${anchor(c.path, c.name)} <span>${escapeHtml(c.city ?? '')}</span></li>`)
            .join('')}</ul></section>`,
        '</main>',
    ].join('');
}
