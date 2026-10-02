import { describe, expect, it } from 'vitest';
import type { Company } from '../store/mapStore';
import { landingPath, landingPaths, parseLandingPath, resolveLanding, MIN_COMPANIES } from './landing';
import { tagSlug } from './slug';

let n = 0;
const co = (name: string, city: string, tags: string[], lat = 47, lng = 8): Company => ({
    id: `id-${n++}`, slug: name.toLowerCase().replace(/\W+/g, '-'), name, city, lat, lng, website: '',
    tags: tags.map((tag) => ({ tag, category: 'backend' })),
});

const companies = [
    co('A', 'Zürich', ['Rust', 'Go', 'AWS'], 47.37, 8.54),
    co('B', 'Zürich', ['Rust', 'Go'], 47.38, 8.53),
    co('C', 'Zürich', ['Rust', 'Java'], 47.36, 8.55),
    co('D', 'Zürich', ['Java'], 47.37, 8.5),
    co('E', 'Zug', ['Rust', 'Go'], 47.17, 8.51),
    co('F', 'Zug', ['Rust'], 47.18, 8.52),
    co('G', 'Zug', ['Rust'], 47.16, 8.5),
    co('H', 'Genève', ['Go'], 46.2, 6.14),
    co('I', 'Genève', ['Python'], 46.21, 6.15),
];

describe('slugs and paths', () => {
    it('keeps symbols apart', () => {
        expect(tagSlug('C++')).toBe('c-plus-plus');
        expect(tagSlug('C#')).toBe('c-sharp');
        expect(tagSlug('Node.js')).toBe('node-js');
    });

    it('builds and parses all three shapes', () => {
        expect(landingPath({ tag: 'Rust' })).toBe('/tech/rust');
        expect(landingPath({ city: 'Zürich' })).toBe('/city/zurich');
        expect(landingPath({ tag: 'Rust', city: 'Zürich' })).toBe('/tech/rust/city/zurich');
        expect(parseLandingPath('/tech/rust')).toEqual({ tagSlug: 'rust' });
        expect(parseLandingPath('/city/zurich/')).toEqual({ citySlug: 'zurich' });
        expect(parseLandingPath('/tech/rust/city/zurich')).toEqual({ tagSlug: 'rust', citySlug: 'zurich' });
    });

    it('rejects everything else', () => {
        for (const p of ['/', '/tech', '/tech/Rust', '/tech/rust/zurich', '/company/x', '/city/a/b', '/tech/../x']) {
            expect(parseLandingPath(p)).toBeNull();
        }
    });
});

describe('resolveLanding', () => {
    it('builds a tech page with counts, cities and co-occurring technologies', () => {
        const res = resolveLanding(companies, { tagSlug: 'rust' });
        if (res.kind !== 'page') throw new Error('expected a page');
        const { model } = res;
        expect(model.count).toBe(6);
        expect(model.h1).toBe('Swiss companies using Rust');
        expect(model.title).toBe('Companies using Rust in Switzerland (6) | SwissDevMap');
        expect(model.intro).toContain('6 companies in Switzerland use Rust.');
        expect(model.intro).toContain('Zug (3) and Zürich (3)');
        // Go appears in 4 of the 6 Rust companies; AWS and Java in only one or two.
        expect(model.intro).toContain('They often pair it with Go.');
        expect(model.liveMapPath).toBe('/?tag=Rust');
        expect(model.relatedCities.map((l) => l.path)).toEqual(['/tech/rust/city/zug', '/tech/rust/city/zurich']);
        expect(model.companies.map((c) => c.name)).toEqual(['A', 'B', 'C', 'E', 'F', 'G']);
    });

    it('only links related technologies that have a page of their own', () => {
        const res = resolveLanding(companies, { tagSlug: 'rust' });
        if (res.kind !== 'page') throw new Error('expected a page');
        // Go has 4 companies; Java 2 and AWS 1 fall below the minimum.
        expect(res.model.relatedTech.map((l) => l.path)).toEqual(['/tech/go']);
    });

    it('builds a city page with nearby cities', () => {
        const res = resolveLanding(companies, { citySlug: 'zurich' });
        if (res.kind !== 'page') throw new Error('expected a page');
        expect(res.model.h1).toBe('Tech companies in Zürich');
        expect(res.model.relatedCities.map((l) => l.label)).toEqual(['Zug']);
        expect(res.model.intro).toContain('Popular technologies there: Rust (3)');
    });

    it('builds a tech+city page', () => {
        const res = resolveLanding(companies, { tagSlug: 'rust', citySlug: 'zug' });
        if (res.kind !== 'page') throw new Error('expected a page');
        expect(res.model.intro).toBe('3 companies in Zug use Rust, out of 3 tech companies listed there.');
        expect(res.model.path).toBe('/tech/rust/city/zug');
    });

    it('redirects a thin page to its widest valid parent', () => {
        // Go in Zürich has only 2 companies; Go overall has 4.
        expect(resolveLanding(companies, { tagSlug: 'go', citySlug: 'zurich' })).toEqual({ kind: 'redirect', to: '/tech/go' });
        // Python has 1 company and Genève 2, so nothing qualifies and the live map is the fallback.
        expect(resolveLanding(companies, { tagSlug: 'python' })).toEqual({ kind: 'redirect', to: '/?tag=Python' });
        expect(resolveLanding(companies, { citySlug: 'geneve' })).toEqual({ kind: 'redirect', to: '/' });
    });

    it('reports unknown tags and cities as missing', () => {
        expect(resolveLanding(companies, { tagSlug: 'cobol' }).kind).toBe('missing');
        expect(resolveLanding(companies, { citySlug: 'atlantis' }).kind).toBe('missing');
    });
});

describe('landingPaths', () => {
    it('lists every slice with at least the minimum number of companies', () => {
        expect(MIN_COMPANIES).toBe(3);
        expect(landingPaths(companies)).toEqual([
            '/city/zug', '/city/zurich', '/tech/go', '/tech/rust', '/tech/rust/city/zug', '/tech/rust/city/zurich',
        ]);
    });
});
