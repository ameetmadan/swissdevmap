import { describe, expect, it } from 'vitest';
import type { Company } from '../store/mapStore';
import { buildIndex, normalize, search } from './search';

const company = (id: string, name: string, city: string, tags: string[], lat = 47, lng = 8): Company => ({
    id, name, city, lat, lng, website: '', tags: tags.map((tag) => ({ tag, category: 'backend' })),
});

const index = buildIndex([
    company('1', 'Acme AG', 'Zürich', ['Rust', 'Go'], 47.0, 8.0),
    company('2', 'Zürcher Kantonalbank', 'Zürich', ['Java'], 47.2, 8.2),
    company('3', 'Rustic Software', 'Genève', ['Rust'], 46.2, 6.1),
    company('4', 'Beta SA', 'Bern', ['Go', 'Rust', 'AWS']),
    company('5', 'Gotthard Systems', 'Luzern', []),
]);

const labels = (query: string, kind?: string) =>
    search(index, query).filter((o) => !kind || o.kind === kind).map((o) => o.label);

describe('normalize', () => {
    it('folds case and diacritics', () => {
        expect(normalize('  Zürich ')).toBe('zurich');
        expect(normalize('Genève')).toBe('geneve');
    });
});

describe('search', () => {
    it('returns nothing for a blank query', () => {
        expect(search(index, '')).toEqual([]);
        expect(search(index, '   ')).toEqual([]);
    });

    it('matches regardless of diacritics', () => {
        expect(labels('zurich', 'city')).toEqual(['Zürich']);
        expect(labels('geneve', 'city')).toEqual(['Genève']);
    });

    it('orders groups companies, technologies, cities', () => {
        const kinds = search(index, 'r').map((o) => o.kind);
        expect(kinds).toEqual([...kinds].sort((a, b) => ['company', 'technology', 'city'].indexOf(a) - ['company', 'technology', 'city'].indexOf(b)));
    });

    it('ranks exact, then prefix, then word-prefix, then substring', () => {
        const idx = buildIndex([
            company('a', 'Xgo', 'X', []), company('b', 'Acme Go', 'X', []),
            company('c', 'Gopher', 'X', []), company('d', 'Go', 'X', []),
        ]);
        expect(search(idx, 'go').map((o) => o.label)).toEqual(['Go', 'Gopher', 'Acme Go', 'Xgo']);
    });

    it('ranks technologies by how many companies use them', () => {
        expect(labels('s', 'technology')).toEqual(['Rust', 'AWS']);
        expect(search(index, 'rust').find((o) => o.kind === 'technology')?.detail).toBe('3 companies');
        expect(search(index, 'aws').find((o) => o.kind === 'technology')?.detail).toBe('1 company');
    });

    it('places a city at the centroid of its companies', () => {
        const city = search(index, 'zurich').find((o) => o.kind === 'city');
        expect(city).toMatchObject({ city: 'Zürich', lat: 47.1, lng: 8.1, detail: '2 companies' });
    });

    it('caps each group', () => {
        const many = buildIndex(Array.from({ length: 20 }, (_, i) => company(String(i), `Acme ${i}`, 'X', [])));
        expect(search(many, 'acme', 5).filter((o) => o.kind === 'company')).toHaveLength(5);
    });

    it('returns an empty list when nothing matches', () => {
        expect(search(index, 'qqqq')).toEqual([]);
    });
});
