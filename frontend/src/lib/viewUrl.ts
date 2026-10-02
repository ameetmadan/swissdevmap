import {
    COMMUTE_MINUTE_OPTIONS,
    COMPANY_TYPES,
    DEFAULT_COMMUTE_MINUTES,
    HEATMAP_GROUPS,
    TAGS_BY_CATEGORY,
} from './filterOptions';

export interface ViewState {
    tags: string[];
    types: string[];
    heatmapTech: string | null;
    commute: { from: string; minutes: number } | null;
}

export const EMPTY_VIEW: ViewState = { tags: [], types: [], heatmapTech: null, commute: null };

const MANAGED_KEYS = ['tag', 'type', 'heatmap', 'from', 'min'] as const;
const MAX_TAGS = 10;
const MAX_VALUE_LENGTH = 60;

const caseInsensitiveLookup = (values: string[]) =>
    new Map(values.map((value) => [value.toLowerCase(), value]));

const KNOWN_TAGS = caseInsensitiveLookup(TAGS_BY_CATEGORY.flatMap((group) => group.tags));
const KNOWN_TYPES = caseInsensitiveLookup(COMPANY_TYPES);
const KNOWN_HEATMAP_TECHS = caseInsensitiveLookup(HEATMAP_GROUPS.flatMap((group) => group.techs));

function cleanValue(raw: string): string | null {
    const value = raw.trim();
    return value && value.length <= MAX_VALUE_LENGTH ? value : null;
}

function unique(values: string[]): string[] {
    return [...new Set(values)];
}

// Tags are free-form (companies can carry any tag), so unknown values pass through; known ones
// are canonicalised so `?tag=rust` lights up the Rust chip.
function parseTags(values: string[]): string[] {
    const tags = values.flatMap((raw) => {
        const value = cleanValue(raw);
        return value ? [KNOWN_TAGS.get(value.toLowerCase()) ?? value] : [];
    });
    return unique(tags).slice(0, MAX_TAGS);
}

function parseTypes(values: string[]): string[] {
    return unique(values.flatMap((raw) => {
        const type = KNOWN_TYPES.get(raw.trim().toLowerCase());
        return type ? [type] : [];
    }));
}

function parseCommute(params: URLSearchParams): ViewState['commute'] {
    const from = cleanValue(params.get('from') ?? '');
    if (!from) return null;
    const minutes = Number(params.get('min'));
    return {
        from,
        minutes: COMMUTE_MINUTE_OPTIONS.includes(minutes) ? minutes : DEFAULT_COMMUTE_MINUTES,
    };
}

export function parseView(search: string): ViewState {
    const params = new URLSearchParams(search);
    return {
        tags: parseTags(params.getAll('tag')),
        types: parseTypes(params.getAll('type')),
        heatmapTech: KNOWN_HEATMAP_TECHS.get((params.get('heatmap') ?? '').trim().toLowerCase()) ?? null,
        commute: parseCommute(params),
    };
}

// Rewrites only the keys this module owns, so unrelated params (utm_*, etc.) survive.
export function applyView(search: string, view: ViewState): string {
    const params = new URLSearchParams(search);
    MANAGED_KEYS.forEach((key) => params.delete(key));
    view.tags.forEach((tag) => params.append('tag', tag));
    view.types.forEach((type) => params.append('type', type));
    if (view.heatmapTech) params.set('heatmap', view.heatmapTech);
    if (view.commute) {
        params.set('from', view.commute.from);
        params.set('min', String(view.commute.minutes));
    }
    const next = params.toString();
    return next ? `?${next}` : '';
}

export function viewKey(view: ViewState): string {
    return applyView('', view);
}
