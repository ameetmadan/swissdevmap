import { Router, Request, Response } from 'express';
import axios from 'axios';
import { pool } from '../db/pool';

const router = Router();

const SBB_API = 'https://transport.opendata.ch/v1';

interface SBBStation {
    name: string;
    coordinate: { x: number; y: number };
}

interface SBBConnection {
    to: { station: SBBStation; arrival: string };
    duration: string; // e.g. "00d00:28:00"
}

// Parse SBB duration string "00d00:HH:MM:SS" → minutes
function parseDurationMinutes(duration: string): number {
    const parts = duration.split(':');
    if (parts.length < 2) return 9999;
    return parseInt(parts[0].replace('00d00', ''), 10) * 60 + parseInt(parts[1], 10);
}

// GET /api/commute?from=Zürich&minutes=30
router.get('/', async (req: Request, res: Response) => {
    const { from, minutes } = req.query;
    const maxMinutes = parseInt((minutes as string) || '30', 10);

    if (!from) {
        return res.status(400).json({ error: '`from` city query param required' });
    }

    try {
        // Step 1: Get all Swiss cities with companies from DB
        const { rows: cityRows } = await pool.query(
            `SELECT DISTINCT city FROM companies ORDER BY city`
        );

        const destinations = cityRows.map((r: { city: string }) => r.city);

        // Step 2: Query SBB API for each destination in parallel (max 8 at a time)
        const reachableCities: Set<string> = new Set();

        const chunks: string[][] = [];
        for (let i = 0; i < destinations.length; i += 8) {
            chunks.push(destinations.slice(i, i + 8));
        }

        for (const chunk of chunks) {
            await Promise.all(
                chunk.map(async (dest) => {
                    if ((from as string).toLowerCase() === dest.toLowerCase()) {
                        reachableCities.add(dest);
                        return;
                    }
                    try {
                        const resp = await axios.get(`${SBB_API}/connections`, {
                            params: { from, to: dest, limit: 1 },
                            timeout: 5000,
                        });
                        const connections: SBBConnection[] = resp.data.connections || [];
                        if (connections.length > 0) {
                            const dur = parseDurationMinutes(connections[0].duration);
                            if (dur <= maxMinutes) {
                                reachableCities.add(dest);
                            }
                        }
                    } catch {
                        // Skip destinations that fail (API limit, unknown station, etc.)
                    }
                })
            );
        }

        // Step 3: Return companies in reachable cities
        if (reachableCities.size === 0) {
            return res.json({ reachableCities: [], companies: [] });
        }

        const cityList = Array.from(reachableCities);
        const placeholders = cityList.map((_, i) => `$${i + 1}`).join(', ');

        const { rows: companies } = await pool.query(
            `SELECT c.id, c.name, c.city, c.lat, c.lng,
              json_agg(json_build_object('tag', t.tag, 'category', t.category)) AS tags
       FROM companies c
       LEFT JOIN tech_tags t ON t.company_id = c.id
       WHERE c.city = ANY(ARRAY[${placeholders}])
       GROUP BY c.id`,
            cityList
        );

        res.json({
            reachableCities: cityList,
            companies,
            query: { from, maxMinutes },
        });
    } catch (err) {
        console.error('Commute filter error:', err);
        res.status(500).json({ error: 'Commute filter failed' });
    }
});

export default router;
