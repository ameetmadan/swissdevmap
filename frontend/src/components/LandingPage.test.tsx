import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LandingContent } from './LandingPage';
import { landingBodyHtml, resolveLanding } from '../lib/landing';
import type { Company } from '../store/mapStore';

const co = (id: string, name: string, city: string, tags: string[], lat: number, lng: number): Company => ({
    id, slug: id, name, city, lat, lng, website: '', tags: tags.map((tag) => ({ tag, category: 'backend' })),
});

const companies = [
    co('a', 'Alpha', 'Zurich', ['Rust', 'Go'], 47.37, 8.54), co('b', 'Beta', 'Zurich', ['Rust', 'Go'], 47.38, 8.53),
    co('c', 'Gamma', 'Zurich', ['Rust', 'Go'], 47.36, 8.55), co('d', 'Delta', 'Zug', ['Rust', 'Go'], 47.17, 8.51),
    co('e', 'Epsilon', 'Zug', ['Rust'], 47.18, 8.52), co('f', 'Zeta', 'Zug', ['Rust'], 47.16, 8.5),
];

// The edge function sends landingBodyHtml() to crawlers and React replaces it on mount, so the two
// must agree. Test data avoids characters the two escapers spell differently (&, quotes, <).
describe('landing markup parity', () => {
    for (const params of [{ tagSlug: 'rust' }, { citySlug: 'zurich' }, { tagSlug: 'rust', citySlug: 'zug' }]) {
        it(`matches for ${JSON.stringify(params)}`, () => {
            const res = resolveLanding(companies, params);
            if (res.kind !== 'page') throw new Error('expected a page');
            const rendered = renderToStaticMarkup(
                <MemoryRouter><LandingContent model={res.model} /></MemoryRouter>,
            );
            expect(rendered).toBe(landingBodyHtml(res.model));
        });
    }
});
