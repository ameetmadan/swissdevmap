/**
 * apiKey.ts
 *
 * Express middleware that validates API keys.
 *
 * The caller must supply the key in the Authorization header:
 *   Authorization: Bearer <raw-key>
 *
 * The raw key is SHA-256 hashed and compared against the api_keys table.
 * If valid, last_used_at is updated and the request proceeds.
 * Otherwise a 401 is returned.
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';

export async function requireApiKey(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Provide a valid API key via "Authorization: Bearer <key>"',
        });
        return;
    }

    const rawKey = authHeader.slice('Bearer '.length).trim();

    if (!rawKey) {
        res.status(401).json({ error: 'Unauthorized', message: 'API key is empty.' });
        return;
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    try {
        const { rows } = await pool.query(
            `SELECT id FROM api_keys WHERE key_hash = $1 AND enabled = TRUE LIMIT 1`,
            [keyHash]
        );

        if (rows.length === 0) {
            res.status(401).json({ error: 'Unauthorized', message: 'Invalid or revoked API key.' });
            return;
        }

        // Fire-and-forget: update last_used_at (don't block the request on this)
        pool.query(
            `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
            [rows[0].id]
        ).catch((err) => console.error('Failed to update last_used_at:', err));

        next();
    } catch (err) {
        console.error('API key validation error:', err);
        res.status(500).json({ error: 'Internal server error during auth.' });
    }
}
