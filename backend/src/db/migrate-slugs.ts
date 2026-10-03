/**
 * migrate-slugs.ts
 *
 * Adds companies.slug and gives every existing company one. Safe to run repeatedly: companies that
 * already have a slug keep it, so URLs never change. Run it BEFORE deploying the API that selects
 * the column:
 *
 *   npx tsx backend/src/db/migrate-slugs.ts
 */

import { pool } from './pool';
import { companySlugBase, MAX_SLUG_ATTEMPTS, slugCandidate } from '../lib/slug';

async function migrate() {
    console.log('⏳ Running slug migration…');

    await pool.query(`
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
    `);

    const { rows } = await pool.query(
        'SELECT id, name, city FROM companies WHERE slug IS NULL ORDER BY created_at NULLS FIRST, id'
    );

    let assigned = 0;
    for (const company of rows) {
        const base = companySlugBase(company.name, company.city);
        for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
            const result = await pool.query(
                `UPDATE companies SET slug = $2
                 WHERE id = $1 AND slug IS NULL
                   AND NOT EXISTS (SELECT 1 FROM companies WHERE slug = $2)`,
                [company.id, slugCandidate(base, attempt)]
            );
            if (result.rowCount) {
                assigned++;
                break;
            }
        }
    }

    console.log(`✅ slug column ready — ${assigned} of ${rows.length} missing slugs assigned.`);
    await pool.end();
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
