import { describe, expect, it } from 'vitest';
import { applyView, EMPTY_VIEW, parseView, viewKey, ViewState } from './viewUrl';

describe('parseView', () => {
    it('returns the empty view for an empty query string', () => {
        expect(parseView('')).toEqual(EMPTY_VIEW);
    });

    it('reads tags, types, heatmap and commute', () => {
        const view = parseView('?tag=Rust&tag=Go&type=Fintech&heatmap=Rust&from=Z%C3%BCrich&min=45');
        expect(view).toEqual({
            tags: ['Rust', 'Go'],
            types: ['Fintech'],
            heatmapTech: 'Rust',
            commute: { from: 'Zürich', minutes: 45 },
        });
    });

    it('canonicalises the case of known values', () => {
        const view = parseView('?tag=rust&type=FINTECH&heatmap=nEXt.js');
        expect(view.tags).toEqual(['Rust']);
        expect(view.types).toEqual(['Fintech']);
        expect(view.heatmapTech).toBe('Next.js');
    });

    it('keeps unknown tags because companies can carry any tag', () => {
        expect(parseView('?tag=Elixir').tags).toEqual(['Elixir']);
    });

    it('drops unknown types and heatmap techs', () => {
        const view = parseView('?type=Banana&heatmap=Cobol');
        expect(view.types).toEqual([]);
        expect(view.heatmapTech).toBeNull();
    });

    it('drops blank, oversized and duplicate values', () => {
        const view = parseView(`?tag=&tag=%20&tag=${'x'.repeat(61)}&tag=Go&tag=go`);
        expect(view.tags).toEqual(['Go']);
    });

    it('caps the number of tags', () => {
        const query = Array.from({ length: 25 }, (_, i) => `tag=t${i}`).join('&');
        expect(parseView(`?${query}`).tags).toHaveLength(10);
    });

    it('falls back to 30 minutes for an invalid duration', () => {
        expect(parseView('?from=Bern&min=7').commute).toEqual({ from: 'Bern', minutes: 30 });
        expect(parseView('?from=Bern&min=abc').commute).toEqual({ from: 'Bern', minutes: 30 });
    });

    it('ignores minutes without an origin', () => {
        expect(parseView('?min=45').commute).toBeNull();
    });
});

describe('applyView', () => {
    const view: ViewState = {
        tags: ['Rust', 'C++'],
        types: ['Fintech'],
        heatmapTech: 'Go',
        commute: { from: 'Zürich', minutes: 30 },
    };

    it('round-trips through parseView', () => {
        expect(parseView(applyView('', view))).toEqual(view);
    });

    it('returns an empty string for the empty view', () => {
        expect(applyView('', EMPTY_VIEW)).toBe('');
    });

    it('replaces managed params and keeps unrelated ones', () => {
        const next = applyView('?utm_source=x&tag=Old&min=15', { ...EMPTY_VIEW, tags: ['Go'] });
        expect(next).toBe('?utm_source=x&tag=Go');
    });

    it('yields the same key regardless of unrelated params', () => {
        expect(viewKey(parseView('?utm_source=x&tag=Go'))).toBe(viewKey(parseView('?tag=Go')));
    });
});
