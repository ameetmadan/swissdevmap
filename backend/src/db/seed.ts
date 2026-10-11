import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { Company } from './seed-data.example';
import { insertCompany } from './insertCompany';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ── Step 0: Load the company dataset ─────────────────────────────────────────
// The real list is private and gitignored, so it is loaded at runtime instead of imported:
// a static import would break builds on a clean checkout where seed-data.ts does not exist.
const DEFAULT_SEED_FILE = path.resolve(__dirname, 'seed-data.ts');

async function loadCompanies(): Promise<Company[]> {
    const file = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SEED_FILE;
    if (!fs.existsSync(file)) {
        throw new Error(
            `Seed data not found at ${file}.\n` +
            'Copy backend/src/db/seed-data.example.ts to backend/src/db/seed-data.ts and edit it, ' +
            'or pass a file: npm run seed --workspace=backend -- <path>'
        );
    }
    const { companies } = await import(file);
    if (!Array.isArray(companies)) throw new Error(`${file} must export a "companies" array.`);
    return companies;
}

// ── Step 1: Apply schema DDL (CREATE TABLE IF NOT EXISTS) ─────────────────────
async function ensureSchema(pool: Pool) {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    // For development iteration: drop tables to ensuring schema changes (like new columns) are applied
    await pool.query(`
        DROP TABLE IF EXISTS job_postings CASCADE;
        DROP TABLE IF EXISTS tech_tags CASCADE;
        DROP TABLE IF EXISTS companies CASCADE;
    `);
    await pool.query(sql);
    console.log('📐 Schema applied (tables created if missing).');
}

// ── Step 2: Truncate all data (CASCADE handles FK order) ─────────────────────
async function truncateTables(pool: Pool) {
    await pool.query(`
    TRUNCATE TABLE job_postings, tech_tags, companies RESTART IDENTITY CASCADE
  `);
    console.log('🗑️  Existing data truncated.');
}

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
    // 1. Connect to the target DB (docker compose already created it)
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // 2. Load the dataset before touching any table, so a missing file never wipes the data
        const companies = await loadCompanies();

        // 3. Create tables / extensions if they don't exist
        await ensureSchema(pool);

        // 4. Wipe existing data so re-runs are idempotent
        await truncateTables(pool);

        // 5. Insert companies + their tags inside a single transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const company of companies) {
                const { id: companyId } = await insertCompany(client, {
                    name: company.name,
                    uid: company.uid,
                    website: company.website,
                    city: company.city,
                    lat: company.lat,
                    lng: company.lng,
                    type: company.type,
                });

                for (const { tag, category } of company.tags) {
                    await client.query(
                        `INSERT INTO tech_tags (company_id, tag, category, source)
             VALUES ($1, $2, $3, 'seed')
             ON CONFLICT (company_id, tag) DO NOTHING`,
                        [companyId, tag, category]
                    );
                }
                console.log(`  ✅ ${company.name} (${company.tags.length} tags)`);
            }

            await client.query('COMMIT');
            console.log(`\n🎉 Seed complete — ${companies.length} Swiss companies loaded.`);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
