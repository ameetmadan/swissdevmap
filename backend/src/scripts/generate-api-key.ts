/**
 * generate-api-key.ts
 *
 * Manually generates a new API key, stores its SHA-256 hash in the database,
 * and prints the raw key ONCE. Share the raw key with the intended recipient;
 * it is never stored and cannot be recovered.
 *
 * Usage:
 *   npx ts-node backend/src/scripts/generate-api-key.ts --label "Alice"
 *
 * Options:
 *   --label <name>   Human-readable label for the key (required)
 */

import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { pool } from '../db/pool';

function parseArgs(): { label: string } {
    const args = process.argv.slice(2);
    const labelIdx = args.indexOf('--label');
    if (labelIdx === -1 || !args[labelIdx + 1]) {
        console.error('❌  Usage: npx ts-node generate-api-key.ts --label "Recipient Name"');
        process.exit(1);
    }
    return { label: args[labelIdx + 1] };
}

async function main() {
    const { label } = parseArgs();

    // Generate a cryptographically random 32-byte key, prefixed for easy identification
    const rawKey = 'sdm_' + crypto.randomBytes(32).toString('hex');

    // SHA-256 hash — this is all we store
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    await pool.query(
        `INSERT INTO api_keys (label, key_hash) VALUES ($1, $2)`,
        [label, keyHash]
    );

    console.log(`
✅  API key generated for "${label}"

   Key (copy and share this — it will NOT be shown again):

   ${rawKey}

   Store it securely. To revoke it, set enabled = FALSE in the api_keys table.
`);

    await pool.end();
}

main().catch((err) => {
    console.error('❌ Failed to generate key:', err);
    process.exit(1);
});
