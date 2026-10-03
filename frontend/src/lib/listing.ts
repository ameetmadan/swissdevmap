import { companyPath } from './paths';
import { escapeHtml, SITE_URL } from './pageMeta';

export const BADGE_URL = `${SITE_URL}/badge.svg`;

/** Always the production address, so a snippet copied from a preview or dev build still works. */
export const listingUrl = (company: { id: string; slug?: string | null }): string => `${SITE_URL}${companyPath(company)}`;
const ISSUES_NEW_URL = 'https://github.com/ameetmadan/swissdevmap/issues/new';

/** Copy-paste embeds for a company's careers or engineering page. Plain links: a backlink is the point. */
export function badgeSnippets(listingUrl: string): { html: string; markdown: string } {
    return {
        html: `<a href="${escapeHtml(listingUrl)}"><img src="${BADGE_URL}" alt="Listed on SwissDevMap" width="192" height="28"></a>`,
        markdown: `[![Listed on SwissDevMap](${BADGE_URL})](${listingUrl})`,
    };
}

/** A prefilled GitHub issue. It carries the company id and page, and nothing about the reporter. */
export function correctionUrl(company: { id: string; name: string }, pageUrl: string): string {
    const body = [
        `Company: ${company.name}`,
        `Company ID: ${company.id}`,
        `Page: ${pageUrl}`,
        '',
        '**What should change?** (name, city, website, technologies, …)',
        '',
    ].join('\n');
    const params = new URLSearchParams({ title: `Data correction: ${company.name}`, body });
    return `${ISSUES_NEW_URL}?${params.toString()}`;
}
