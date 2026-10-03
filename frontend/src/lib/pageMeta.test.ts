import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    companyMeta, DEFAULT_META, injectHeadTags, renderHeadTags, viewMeta, viewTitle,
} from './pageMeta';
import { EMPTY_VIEW, ViewState } from './viewUrl';

const view = (overrides: Partial<ViewState>): ViewState => ({ ...EMPTY_VIEW, ...overrides });

describe('viewTitle', () => {
    it('is the default title for an unfiltered view', () => {
        expect(viewTitle(EMPTY_VIEW)).toBe(DEFAULT_META.title);
    });

    it('names tags, types and the commute origin', () => {
        expect(viewTitle(view({ tags: ['Rust'], types: ['Fintech'] })))
            .toBe('Fintech companies using Rust in Switzerland | SwissDevMap');
        expect(viewTitle(view({ tags: ['Go'], commute: { from: 'Bern', minutes: 30 } })))
            .toBe('Tech companies using Go within 30 min of Bern | SwissDevMap');
    });

    it('describes a heatmap-only view', () => {
        expect(viewTitle(view({ heatmapTech: 'Go' }))).toBe('Go heatmap of Swiss tech companies | SwissDevMap');
    });

    it('collapses long lists', () => {
        expect(viewTitle(view({ tags: ['A', 'B', 'C', 'D', 'E'] }))).toContain('using A, B, C & 2 more');
    });
});

describe('viewMeta', () => {
    it('includes the company count and a canonical filtered path', () => {
        const meta = viewMeta(view({ tags: ['Rust'] }), 14);
        expect(meta.description).toContain('14 companies match: tech companies using Rust in Switzerland.');
        expect(meta.path).toBe('/?tag=Rust');
    });

    it('uses singular wording for one match', () => {
        expect(viewMeta(view({ tags: ['Rust'] }), 1).description).toContain('1 company matches');
    });

    it('omits the count for commute views and when it is unknown', () => {
        const commute = viewMeta(view({ commute: { from: 'Bern', minutes: 20 } }), 5);
        expect(commute.description).not.toMatch(/\d+ compan/);
        expect(viewMeta(view({ tags: ['Go'] }), null).description).not.toMatch(/\d+ compan/);
    });

    it('describes a heatmap-only view as a heatmap rather than a company match', () => {
        const meta = viewMeta(view({ heatmapTech: 'Go' }), 231);
        expect(meta.description).toBe('Heatmap of where Go is used across 231 Swiss tech companies, on the SwissDevMap interactive map.');
        expect(meta.path).toBe('/?heatmap=Go');
    });

    it('falls back to the default for an unfiltered view', () => {
        expect(viewMeta(EMPTY_VIEW, 100)).toBe(DEFAULT_META);
    });
});

describe('companyMeta', () => {
    const company = {
        id: 'abc', name: 'Acme AG', city: 'Zürich', type: 'Fintech',
        tags: ['Rust', 'Go', 'AWS', 'Docker', 'Kafka', 'Vue', 'Scala'].map((tag) => ({ tag })),
    };

    it('describes the stack and links to the company path', () => {
        const meta = companyMeta(company);
        expect(meta.title).toBe('Acme AG (Zürich) tech stack | SwissDevMap');
        expect(meta.description).toBe('Acme AG in Zürich uses Rust, Go, AWS, Docker, Kafka, Vue and more. See their full tech stack on SwissDevMap.');
        expect(meta.path).toBe('/company/abc');
        expect(meta.image.subtitle).toBe('Fintech · Zürich');
    });

    it('copes with a company that has no tags or city', () => {
        const meta = companyMeta({ id: 'x', name: 'Bare GmbH', tags: [] });
        expect(meta.description).toBe('Bare GmbH is listed. See their full tech stack on SwissDevMap.');
        expect(meta.image.subtitle).toBe('Swiss tech company');
    });
});

describe('renderHeadTags / injectHeadTags', () => {
    const template = [
        '<html><head>',
        '  <title>Old</title>',
        '  <meta name="description" content="old" />',
        '  <meta property="og:title" content="old" />',
        '  <meta name="twitter:card" content="summary" />',
        '  <link rel="stylesheet" href="/a.css" />',
        '</head><body></body></html>',
    ].join('\n');

    it('escapes values taken from user-submitted company names', () => {
        const html = renderHeadTags(companyMeta({ id: '1', name: '"><script>alert(1)</script>', tags: [] }));
        expect(html).not.toContain('<script>');
        expect(html).toContain('&#34;&#62;&#60;script&#62;alert(1)&#60;/script&#62;');
    });

    it('replaces existing SEO tags and keeps everything else', () => {
        const out = injectHeadTags(template, companyMeta({ id: '1', name: 'Acme', tags: [] }));
        expect(out.match(/<title>/g)).toHaveLength(1);
        expect(out).not.toContain('Old');
        expect(out).not.toContain('content="old"');
        expect(out).toContain('<link rel="stylesheet" href="/a.css" />');
        expect(out).toContain('property="og:url" content="https://swissdevmap.ch/company/1"');
        expect(out).toContain('name="twitter:card" content="summary_large_image"');
    });

    it('keeps the static defaults in index.html in step with DEFAULT_META', () => {
        const indexHtml = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
        for (const line of renderHeadTags(DEFAULT_META).split('\n')) {
            expect(indexHtml).toContain(line.trim());
        }
    });
});
