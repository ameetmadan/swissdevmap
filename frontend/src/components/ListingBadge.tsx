import { badgeSnippets } from '../lib/listing';
import CopySnippet from './CopySnippet';

/** Lets a company link back from its own site, which is how a listing turns into a referral. */
export default function ListingBadge({ listingUrl, defaultOpen = false }: { listingUrl: string; defaultOpen?: boolean }) {
    const { html, markdown } = badgeSnippets(listingUrl);

    return (
        <details className="listing-badge" open={defaultOpen}>
            <summary>Add the “Listed on SwissDevMap” badge to your site</summary>
            <img className="listing-badge-preview" src="/badge.svg" alt="Listed on SwissDevMap badge" width="192" height="28" />
            <CopySnippet label="HTML" text={html} />
            <CopySnippet label="Markdown" text={markdown} />
        </details>
    );
}
