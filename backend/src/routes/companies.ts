import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /api/companies?tag=React&city=Zürich
router.get('/', async (req: Request, res: Response) => {
  const { tag, city } = req.query;

  let query = `
    SELECT
      c.id, c.name, c.uid, c.website, c.city, c.lat, c.lng,
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
    params.push(tag as string);
    conditions.push(`c.id IN (
      SELECT company_id FROM tech_tags WHERE tag ILIKE $${params.length}
    )`);
  }
  if (city) {
    params.push(city as string);
    conditions.push(`c.city ILIKE $${params.length}`);
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

// GET /api/companies/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, json_agg(json_build_object('tag', t.tag, 'category', t.category)) AS tags
       FROM companies c
       LEFT JOIN tech_tags t ON t.company_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/companies
router.post('/', async (req: Request, res: Response) => {
  const { name, uid, website, city, lat, lng, tags } = req.body;

  // Basic validation
  if (!name || !lat || !lng) {
    return res.status(400).json({ error: 'Missing required fields: name, lat, lng' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert company
    const companyRes = await client.query(
      `INSERT INTO companies (name, uid, website, city, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, uid, website, city, lat, lng`,
      [name, uid || null, website || null, city || null, lat, lng]
    );
    const company = companyRes.rows[0];

    // Insert tags if provided
    if (Array.isArray(tags) && tags.length > 0) {
      for (const { tag, category } of tags) {
        if (tag && category) {
          await client.query(
            `INSERT INTO tech_tags (company_id, tag, category, source)
             VALUES ($1, $2, $3, 'user_submission')
             ON CONFLICT (company_id, tag) DO NOTHING`,
            [company.id, tag, category]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Fetch complete object with tags to return
    // (Reusing the get-by-id logic effectively, but let's keep it simple and just return what we have + tags)
    // Actually, let's fetch it cleanly to ensure format matches get-by-id
    const { rows } = await client.query(
      `SELECT c.*, json_agg(json_build_object('tag', t.tag, 'category', t.category)) AS tags
       FROM companies c
       LEFT JOIN tech_tags t ON t.company_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [company.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating company:', err);
    res.status(500).json({ error: 'Failed to create company' });
  } finally {
    client.release();
  }
});

export default router;
