import { describe, expect, it } from 'vitest';
import { parseCompanySubmission, ValidationError } from './companySubmission';

const valid = { name: 'Acme AG', city: 'Zürich', lat: 47.37, lng: 8.54 };

describe('parseCompanySubmission', () => {
    it('accepts a minimal company and normalizes optional fields', () => {
        expect(parseCompanySubmission({ ...valid, name: '  Acme AG ' })).toEqual({
            name: 'Acme AG', uid: null, website: null, city: 'Zürich', lat: 47.37, lng: 8.54, tags: [],
        });
    });

    it.each([
        ['missing city', { ...valid, city: undefined }],
        ['blank city', { ...valid, city: '   ' }],
        ['non-string city', { ...valid, city: 42 }],
        ['missing name', { ...valid, name: '' }],
        ['oversized name', { ...valid, name: 'x'.repeat(201) }],
        ['string coordinates', { ...valid, lat: '47.37' }],
        ['out-of-range latitude', { ...valid, lat: 91 }],
        ['NaN longitude', { ...valid, lng: NaN }],
        ['javascript: website', { ...valid, website: 'javascript:alert(1)' }],
        ['malformed website', { ...valid, website: 'not a url' }],
        ['prototype tag category', { ...valid, tags: [{ tag: 'React', category: '__proto__' }] }],
        ['unknown tag category', { ...valid, tags: [{ tag: 'React', category: 'mobile' }] }],
        ['blank tag', { ...valid, tags: [{ tag: ' ', category: 'frontend' }] }],
        ['non-list tags', { ...valid, tags: 'React' }],
        ['too many tags', { ...valid, tags: Array.from({ length: 51 }, () => ({ tag: 'a', category: 'cloud' })) }],
    ])('rejects %s', (_label, body) => {
        expect(() => parseCompanySubmission(body)).toThrow(ValidationError);
    });

    it('rejects a missing body', () => {
        expect(() => parseCompanySubmission(undefined)).toThrow(ValidationError);
    });

    it('keeps valid tags and an https website', () => {
        const result = parseCompanySubmission({
            ...valid, website: 'https://acme.ch', tags: [{ tag: ' React ', category: 'frontend' }],
        });
        expect(result.website).toBe('https://acme.ch');
        expect(result.tags).toEqual([{ tag: 'React', category: 'frontend' }]);
    });
});
