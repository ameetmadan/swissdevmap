import { describe, expect, it } from 'vitest';
import { companySlugBase, isUuid, slugCandidate, slugify, SLUG_RE } from './slug';

describe('slugify', () => {
    it('folds diacritics and punctuation into hyphens', () => {
        expect(slugify('Zürcher Kantonalbank')).toBe('zurcher-kantonalbank');
        expect(slugify('Crédit Suisse (Schweiz) AG')).toBe('credit-suisse-schweiz-ag');
    });

    it('spells out ampersands', () => {
        expect(slugify('Beta & Söhne')).toBe('beta-and-sohne');
    });

    it('strips markup so it cannot reach a URL or sitemap', () => {
        const slug = slugify('"><script>alert(1)</script>');
        expect(slug).toBe('script-alert-1-script');
        expect(slug).toMatch(SLUG_RE);
    });

    it('truncates without leaving a trailing hyphen', () => {
        const slug = slugify(`${'word '.repeat(30)}end`);
        expect(slug.length).toBeLessThanOrEqual(60);
        expect(slug.endsWith('-')).toBe(false);
    });

    it('returns an empty string when nothing usable is left', () => {
        expect(slugify('???')).toBe('');
        expect(slugify('日本語')).toBe('');
    });
});

describe('companySlugBase', () => {
    it('appends the city to tell same-named companies apart', () => {
        expect(companySlugBase('Acme AG', 'Zürich')).toBe('acme-ag-zurich');
        expect(companySlugBase('Acme AG', null)).toBe('acme-ag');
    });

    it('falls back to a placeholder for names with no usable characters', () => {
        expect(companySlugBase('???')).toBe('company');
    });

    it('never produces a slug that parses as a UUID', () => {
        const base = companySlugBase('11111111-1111-4111-8111-111111111111');
        expect(isUuid(base)).toBe(false);
        expect(base).toMatch(SLUG_RE);
    });
});

describe('slugCandidate', () => {
    it('uses the base first, then numbers from 2', () => {
        expect([0, 1, 2].map((attempt) => slugCandidate('acme', attempt))).toEqual(['acme', 'acme-2', 'acme-3']);
    });
});
