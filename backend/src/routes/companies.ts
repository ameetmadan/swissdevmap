import { Router, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { companySubmissionLimiter } from '../middleware/rateLimit';
import { insertCompany } from '../db/insertCompany';
import { parseCompanySubmission, ValidationError } from '../lib/companySubmission';
import { isUuid, SLUG_RE } from '../lib/slug';

const router = Router();

// GET /api/companies?tag=React&city=Zürich
router.get('/', async (req: Request, res: Response) => {
  const { tag, city } = req.query;

  let query = `
    SELECT
      c.id, c.name, c.uid, c.website, c.city, c.lat, c.lng, c.type, c.slug,
      COALESCE(
        json_agg(
          json_build_object('tag', t.tag, 'category', t.category)
          ORDER BY t.tag
        ) FILTER (WHERE t.tag IS NOT NULL),
        '[]'
      ) AS tags
    FROM companies c
    LEFT JOIN tech_tags t ON t.company_id = c.id
  `;

  const params: string[] = [];
  const conditions: string[] = [];

  if (tag) {
    const tags = Array.isArray(tag) ? tag : [tag];
    for (const t of tags) {
      params.push(t as string);
      conditions.push(`c.id IN (
        SELECT company_id FROM tech_tags WHERE tag ILIKE $${params.length}
      )`);
    }
  }
  if (city) {
    params.push(city as string);
    conditions.push(`c.city ILIKE $${params.length}`);
  }
  if (req.query.type) {
    const types = Array.isArray(req.query.type) ? req.query.type : [req.query.type];
    // Simply use IN clause for types
    const placeholders = types.map((_, i) => `$${params.length + i + 1}`).join(', ');
    types.forEach(t => params.push(t as string));
    conditions.push(`c.type IN (${placeholders})`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY c.id ORDER BY c.name';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

const MAX_REF_LENGTH = 80;

// GET /api/companies/:ref  (ref is a company id or its slug)
router.get('/:ref', async (req: Request, res: Response) => {
  const { ref } = req.params;
  const byId = isUuid(ref);
  if (!byId && !(ref.length <= MAX_REF_LENGTH && SLUG_RE.test(ref))) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.*,
              COALESCE(
                json_agg(json_build_object('tag', t.tag, 'category', t.category))
                  FILTER (WHERE t.tag IS NOT NULL),
                '[]'
              ) AS tags
       FROM companies c
       LEFT JOIN tech_tags t ON t.company_id = c.id
       WHERE ${byId ? 'c.id' : 'c.slug'} = $1
       GROUP BY c.id`,
      [ref]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

const COMPANY_WITH_TAGS_BY_ID = `
  SELECT c.*,
         COALESCE(
           json_agg(json_build_object('tag', t.tag, 'category', t.category))
             FILTER (WHERE t.tag IS NOT NULL),
           '[]'
         ) AS tags
  FROM companies c
  LEFT JOIN tech_tags t ON t.company_id = c.id
  WHERE c.id = $1
  GROUP BY c.id`;

// POST /api/companies
export async function createCompany(req: Request, res: Response) {
  let submission;
  try {
    submission = parseCompanySubmission(req.body);
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
  const { tags, ...company } = submission;

  let client: PoolClient | undefined;
  let rollbackFailed = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const { id } = await insertCompany(client, company);

    for (const { tag, category } of tags) {
      await client.query(
        `INSERT INTO tech_tags (company_id, tag, category, source)
         VALUES ($1, $2, $3, 'user_submission')
         ON CONFLICT (company_id, tag) DO NOTHING`,
        [id, tag, category]
      );
    }

    // Read the response before COMMIT: a read that fails afterwards would report a saved company as
    // failed, and the rollback could not undo it, so the visitor would retry and create a duplicate.
    const { rows } = await client.query(COMPANY_WITH_TAGS_BY_ID, [id]);
    await client.query('COMMIT');

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating company:', err);
    if (client) {
      await client.query('ROLLBACK').catch((rollbackErr) => {
        rollbackFailed = true;
        console.error('Rollback failed:', rollbackErr);
      });
    }
    res.status(500).json({ error: 'Failed to create company' });
  } finally {
    // Passing true makes the pool discard a connection whose transaction state is unknown.
    client?.release(rollbackFailed);
  }
}

router.post('/', companySubmissionLimiter, createCompany);

export default router;
