import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// GET /api/heatmap?tech=React
// Returns GeoJSON FeatureCollection for Mapbox heatmap layer
router.get('/', async (req: Request, res: Response) => {
    const { tech } = req.query;

    if (!tech) {
        return res.status(400).json({ error: 'tech query param required (e.g. ?tech=React)' });
    }

    try {
        // Count occurrences per company for intensity weighting
        const { rows } = await pool.query(
            `SELECT c.id, c.name, c.lat, c.lng, c.city,
              COUNT(t.tag) AS intensity
       FROM companies c
       JOIN tech_tags t ON t.company_id = c.id
       WHERE t.tag ILIKE $1
       GROUP BY c.id`,
            [tech as string]
        );

        const geojson = {
            type: 'FeatureCollection',
            features: rows.map((row) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(row.lng), parseFloat(row.lat)],
                },
                properties: {
                    id: row.id,
                    name: row.name,
                    city: row.city,
                    intensity: parseInt(row.intensity, 10),
                },
            })),
        };

        res.json(geojson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// GET /api/heatmap/summary — aggregate tag counts across all companies
router.get('/summary', async (_req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(`
      SELECT tag, category, COUNT(*) AS company_count
      FROM tech_tags
      GROUP BY tag, category
      ORDER BY company_count DESC
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database query failed' });
    }
});

export default router;
