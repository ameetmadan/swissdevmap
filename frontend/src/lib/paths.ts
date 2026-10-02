/** Canonical path for a company page: the slug when it has one, the id for older rows. */
export const companyPath = (company: { id: string; slug?: string | null }): string =>
    `/company/${company.slug ?? company.id}`;
