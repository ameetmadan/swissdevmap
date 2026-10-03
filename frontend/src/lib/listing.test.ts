import { describe, expect, it } from 'vitest';
import { badgeSnippets, BADGE_URL, correctionUrl, listingUrl } from './listing';

describe('badgeSnippets', () => {
    it('links the badge to the listing', () => {
        const { html, markdown } = badgeSnippets('https://swissdevmap.ch/company/acme-ag-zurich');
        expect(html).toBe(`<a href="https://swissdevmap.ch/company/acme-ag-zurich"><img src="${BADGE_URL}" alt="Listed on SwissDevMap" width="192" height="28"></a>`);
        expect(markdown).toBe(`[![Listed on SwissDevMap](${BADGE_URL})](https://swissdevmap.ch/company/acme-ag-zurich)`);
    });

    it('does not let a crafted URL break out of the href attribute', () => {
        const { html } = badgeSnippets('https://x.test/"><script>alert(1)</script>');
        expect(html).not.toContain('<script>');
    });

    it('keeps rel=nofollow out, since the backlink is what we want', () => {
        expect(badgeSnippets('https://x.test').html).not.toContain('nofollow');
    });
});

describe('listingUrl', () => {
    it('is the production URL, slug first', () => {
        expect(listingUrl({ id: 'abc', slug: 'acme-ag-zurich' })).toBe('https://swissdevmap.ch/company/acme-ag-zurich');
        expect(listingUrl({ id: 'abc' })).toBe('https://swissdevmap.ch/company/abc');
    });
});

describe('correctionUrl', () => {
    const url = new URL(correctionUrl({ id: 'abc-123', name: 'Acme & Söhne' }, 'https://swissdevmap.ch/company/acme'));

    it('opens a new GitHub issue with a descriptive title', () => {
        expect(`${url.origin}${url.pathname}`).toBe('https://github.com/ameetmadan/swissdevmap/issues/new');
        expect(url.searchParams.get('title')).toBe('Data correction: Acme & Söhne');
    });

    it('carries the company id and page but nothing personal', () => {
        const body = url.searchParams.get('body') ?? '';
        expect(body).toContain('Company ID: abc-123');
        expect(body).toContain('Page: https://swissdevmap.ch/company/acme');
        expect(body).not.toMatch(/@|email|phone/i);
    });
});
