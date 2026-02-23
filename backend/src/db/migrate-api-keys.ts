/**
 * migrate-api-keys.ts
 *
 * One-off migration: creates the api_keys table if it doesn't exist.
 * Run once after deploying the API key auth feature:
 *
 *   npx ts-node backend/src/db/migrate-api-keys.ts
 */

import { pool } from './pool';

async function migrate() {
    console.log('⏳ Running api_keys migration…');

    await pool.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE IF NOT EXISTS api_keys (
            id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            label        TEXT NOT NULL,
            key_hash     TEXT NOT NULL UNIQUE,
            enabled      BOOLEAN NOT NULL DEFAULT TRUE,
            created_at   TIMESTAMPTZ DEFAULT NOW(),
            last_used_at TIMESTAMPTZ
        );

        CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    `);

    console.log('✅ api_keys table is ready.');
    await pool.end();
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
