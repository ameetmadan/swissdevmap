import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /api/stats — headline numbers and when the data last changed, for the "About this data" panel
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM companies) AS companies,
         (SELECT COUNT(DISTINCT city)::int FROM companies WHERE city IS NOT NULL) AS cities,
         (SELECT COUNT(DISTINCT tag)::int FROM tech_tags) AS technologies,
         GREATEST(
           (SELECT MAX(created_at) FROM companies),
           (SELECT MAX(created_at) FROM tech_tags)
         ) AS last_updated`
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

export default router;
