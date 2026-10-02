import { describe, expect, it } from 'vitest';
import { buildSitemap } from './sitemap';

describe('buildSitemap', () => {
    it('lists each path as an absolute URL', () => {
        const xml = buildSitemap(['/', '/company/acme-ag-zurich']);
        expect(xml).toContain('<loc>https://swissdevmap.ch/</loc>');
        expect(xml).toContain('<loc>https://swissdevmap.ch/company/acme-ag-zurich</loc>');
        expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    });

    it('drops duplicates and escapes XML-special characters', () => {
        const xml = buildSitemap(['/a?x=1&y=2', '/a?x=1&y=2']);
        expect(xml.match(/<url>/g)).toHaveLength(1);
        expect(xml).toContain('<loc>https://swissdevmap.ch/a?x=1&#38;y=2</loc>');
    });
});
