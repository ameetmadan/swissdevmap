/**
 * migrate-tags.ts
 *
 * Merges tag spellings the scraper used to produce ("Aws", "Gcp", "Postgresql", "Nextjs", ...) into the
 * canonical ones from lib/technologies.ts. A company that already has the canonical tag just loses the
 * variant. Safe to run repeatedly:
 *
 *   npx tsx backend/src/db/migrate-tags.ts
 */

import { pool } from './pool';
import { TECHNOLOGIES } from '../lib/technologies';

async function migrate() {
    console.log('⏳ Running tag migration…');
    const client = await pool.connect();
    let renamed = 0;
    let merged = 0;

    try {
        await client.query('BEGIN');
        for (const { tag, aliases } of TECHNOLOGIES) {
            const variants = [...new Set([tag.toLowerCase(), ...aliases])];
            // One variant per statement: two variants on the same company would otherwise both rename
            // to the canonical tag in one go and collide on the (company_id, tag) unique constraint.
            for (const variant of variants) {
                const result = await client.query(
                    `UPDATE tech_tags t SET tag = $1
                     WHERE lower(t.tag) = $2 AND t.tag <> $1
                       AND NOT EXISTS (SELECT 1 FROM tech_tags o WHERE o.company_id = t.company_id AND o.tag = $1)`,
                    [tag, variant]
                );
                renamed += result.rowCount ?? 0;
            }
            // Whatever is left already has the canonical tag on the same company.
            const mergeResult = await client.query(
                `DELETE FROM tech_tags WHERE lower(tag) = ANY($2) AND tag <> $1`,
                [tag, variants]
            );
            merged += mergeResult.rowCount ?? 0;
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

    console.log(`✅ Tag migration complete — ${renamed} renamed, ${merged} duplicates removed.`);
}

migrate()
    .catch((err) => {
        console.error('Tag migration failed:', err);
        process.exit(1);
    })
    .finally(() => pool.end());
