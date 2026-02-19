import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { companies } from './seed-data.example';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ── Step 0: Ensure the database exists ───────────────────────────────────────
async function ensureDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    await pool.query(`
        CREATE DATABASE IF NOT EXISTS ${process.env.DATABASE_NAME}
    `);
    await pool.end();
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
    // 1. Ensure the database exists
    await ensureDatabase();

    // 2. Connect to the target DB
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // 3. Create tables / extensions if they don't exist
        await ensureSchema(pool);

        // 4. Wipe existing data so re-runs are idempotent
        await truncateTables(pool);

        // 5. Insert companies + their tags inside a single transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const company of companies) {
                const res = await client.query(
                    `INSERT INTO companies (name, uid, website, city, lat, lng, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
                    [company.name, company.uid ?? null, company.website, company.city, company.lat, company.lng, company.type ?? null]
                );
                const companyId: string = res.rows[0].id;

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
