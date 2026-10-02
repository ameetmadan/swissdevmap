import type { PoolClient } from 'pg';
import { companySlugBase, MAX_SLUG_ATTEMPTS, slugCandidate } from '../lib/slug';

export interface NewCompany {
    name: string;
    uid?: string | null;
    website?: string | null;
    city?: string | null;
    lat: number;
    lng: number;
    type?: string | null;
}

/**
 * Inserts a company and gives it a unique slug. Each attempt is its own INSERT ... ON CONFLICT DO
 * NOTHING, so losing a race for a slug never aborts the surrounding transaction. The slug is only
 * assigned here, which is what keeps it stable for the life of the row.
 */
export async function insertCompany(client: PoolClient, company: NewCompany): Promise<{ id: string; slug: string }> {
    const base = companySlugBase(company.name, company.city);

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
        const slug = slugCandidate(base, attempt);
        const { rows } = await client.query(
            `INSERT INTO companies (name, uid, website, city, lat, lng, type, slug)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (slug) DO NOTHING
             RETURNING id, slug`,
            [
                company.name, company.uid ?? null, company.website ?? null, company.city ?? null,
                company.lat, company.lng, company.type ?? null, slug,
            ]
        );
        if (rows.length > 0) return rows[0];
    }
    throw new Error(`Could not find a free slug for "${company.name}"`);
}
