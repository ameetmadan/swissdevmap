import type { Company } from '../store/mapStore';

export type SearchOption =
    | { kind: 'company'; id: string; label: string; detail: string }
    | { kind: 'technology'; tag: string; label: string; detail: string }
    | { kind: 'city'; city: string; label: string; detail: string; lat: number; lng: number };

interface CompanyEntry { id: string; name: string; city: string; key: string }
interface TechEntry { tag: string; key: string; count: number }
interface CityEntry { city: string; key: string; count: number; lat: number; lng: number }

export interface SearchIndex {
    companies: CompanyEntry[];
    technologies: TechEntry[];
    cities: CityEntry[];
}

/** Lowercases and strips diacritics so "zurich" finds "Zürich". */
export function normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function buildIndex(companies: Company[]): SearchIndex {
    const techCounts = new Map<string, number>();
    const cityStats = new Map<string, { count: number; lat: number; lng: number }>();

    for (const company of companies) {
        for (const { tag } of company.tags) techCounts.set(tag, (techCounts.get(tag) ?? 0) + 1);
        if (!company.city) continue;
        const stats = cityStats.get(company.city) ?? { count: 0, lat: 0, lng: 0 };
        cityStats.set(company.city, {
            count: stats.count + 1,
            lat: stats.lat + company.lat,
            lng: stats.lng + company.lng,
        });
    }

    return {
        companies: companies.map((c) => ({ id: c.id, name: c.name, city: c.city, key: normalize(c.name) })),
        technologies: [...techCounts].map(([tag, count]) => ({ tag, key: normalize(tag), count })),
        cities: [...cityStats].map(([city, s]) => ({
            city, key: normalize(city), count: s.count, lat: s.lat / s.count, lng: s.lng / s.count,
        })),
    };
}

const NO_MATCH = Infinity;

// Exact beats prefix beats word-prefix beats substring.
function matchRank(key: string, query: string): number {
    if (key === query) return 0;
    if (key.startsWith(query)) return 1;
    if (key.split(/[\s\-./]+/).some((word) => word.startsWith(query))) return 2;
    return key.includes(query) ? 3 : NO_MATCH;
}

function topMatches<T extends { key: string }>(
    entries: T[], query: string, limit: number, tieBreak: (a: T, b: T) => number,
): T[] {
    return entries
        .map((entry) => ({ entry, rank: matchRank(entry.key, query) }))
        .filter(({ rank }) => rank !== NO_MATCH)
        .sort((a, b) => a.rank - b.rank || tieBreak(a.entry, b.entry))
        .slice(0, limit)
        .map(({ entry }) => entry);
}

const companyCount = (count: number) => `${count} ${count === 1 ? 'company' : 'companies'}`;

/** Companies first, then technologies, then cities, each group capped at `limitPerGroup`. */
export function search(index: SearchIndex, rawQuery: string, limitPerGroup = 5): SearchOption[] {
    const query = normalize(rawQuery);
    if (!query) return [];

    const byName = (a: CompanyEntry, b: CompanyEntry) => a.name.localeCompare(b.name);
    const byCount = (a: { count: number; key: string }, b: { count: number; key: string }) =>
        b.count - a.count || a.key.localeCompare(b.key);

    return [
        ...topMatches(index.companies, query, limitPerGroup, byName).map((c): SearchOption => ({
            kind: 'company', id: c.id, label: c.name, detail: c.city,
        })),
        ...topMatches(index.technologies, query, limitPerGroup, byCount).map((t): SearchOption => ({
            kind: 'technology', tag: t.tag, label: t.tag, detail: companyCount(t.count),
        })),
        ...topMatches(index.cities, query, limitPerGroup, byCount).map((c): SearchOption => ({
            kind: 'city', city: c.city, label: c.city, detail: companyCount(c.count),
            lat: c.lat, lng: c.lng,
        })),
    ];
}
