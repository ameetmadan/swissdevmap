const MAX_SLUG_LENGTH = 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_SLUG_ATTEMPTS = 50;

/** "Zürcher Kantonalbank" -> "zurcher-kantonalbank". Always ASCII, so it is safe in URLs and sitemaps. */
export function slugify(text: string): string {
    const slug = text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/, '');
}

/** Name plus city keeps same-named companies in different places apart without a number. */
export function companySlugBase(name: string, city?: string | null): string {
    const base = slugify(city ? `${name} ${city}` : name) || 'company';
    // A slug that parses as a UUID would be ambiguous with the id lookup on /api/companies/:ref.
    return UUID_RE.test(base) ? `company-${base}` : base;
}

/** attempt 0 is the base slug; later attempts append -2, -3, ... */
export function slugCandidate(base: string, attempt: number): string {
    return attempt === 0 ? base : `${base}-${attempt + 1}`;
}

export function isUuid(value: string): boolean {
    return UUID_RE.test(value);
}
