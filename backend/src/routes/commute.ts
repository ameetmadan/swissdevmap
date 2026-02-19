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

// Normalizes city names for comparison (e.g. "Zürich" -> "zurich")
function normalizeCity(city: string): string {
    return city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Parse SBB duration string "00d00:HH:MM:SS" → minutes
function parseDurationMinutes(duration: string): number {
    // Expected format: DDdHH:MM:SS (e.g., "00d00:45:00")
    try {
        const parts = duration.split(':');
        if (parts.length < 2) return 9999;

        // precise parsing
        const dayHours = parts[0].split('d');
        const days = parseInt(dayHours[0] || '0', 10);
        const hours = parseInt(dayHours[1] || '0', 10);
        const minutes = parseInt(parts[1] || '0', 10);

        return (days * 24 * 60) + (hours * 60) + minutes;
    } catch {
        return 9999;
    }
}

// GET /api/commute?from=Zürich&minutes=30
router.get('/', async (req: Request, res: Response) => {
    const { from, minutes } = req.query;
    console.log(`[Commute] Request received. from=${from}, minutes=${minutes}`);

    const maxMinutes = parseInt((minutes as string) || '30', 10);
    console.log(`[Commute] Parsed maxMinutes: ${maxMinutes}`);

    if (!from) {
        console.warn('[Commute] Missing "from" parameter');
        return res.status(400).json({ error: '`from` city query param required' });
    }

    const fromCity = from as string;

    try {
        // Step 1: Get all Swiss cities with companies from DB
        const { rows: cityRows } = await pool.query(
            `SELECT DISTINCT city FROM companies ORDER BY city`
        );

        const destinations = cityRows.map((r: { city: string }) => r.city);
        console.log(`[Commute] Found ${destinations.length} destination cities in DB:`, destinations);

        // Step 2: Query SBB API for each destination in parallel (max 8 at a time)
        const reachableCities: Set<string> = new Set();

        const chunks: string[][] = [];
        for (let i = 0; i < destinations.length; i += 8) {
            chunks.push(destinations.slice(i, i + 8));
        }

        console.log(`[Commute] Splitting into ${chunks.length} chunks for processing`);

        for (const [index, chunk] of chunks.entries()) {
            console.log(`[Commute] Processing chunk ${index + 1}/${chunks.length}:`, chunk);
            await Promise.all(
                chunk.map(async (dest) => {
                    const normalizedFrom = normalizeCity(fromCity);
                    const normalizedDest = normalizeCity(dest);

                    if (normalizedFrom === normalizedDest) {
                        console.log(`[Commute] City match (local): ${dest} (normalized: ${normalizedDest})`);
                        reachableCities.add(dest);
                        return;
                    }

                    try {
                        const apiUrl = `${SBB_API}/connections?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(dest)}&limit=1`;
                        console.log(`[Commute] Fetching SBB: ${apiUrl}`);

                        const resp = await axios.get(`${SBB_API}/connections`, {
                            params: { from: fromCity, to: dest, limit: 1 },
                            timeout: 5000,
                        });

                        const connections: SBBConnection[] = resp.data.connections || [];
                        if (connections.length > 0) {
                            const durationStr = connections[0].duration; // e.g. 00d00:42:00
                            const dur = parseDurationMinutes(durationStr);

                            console.log(`[Commute] SBB Result for ${dest}: durationStr=${durationStr}, minutes=${dur}, max=${maxMinutes}`);

                            if (dur <= maxMinutes) {
                                console.log(`[Commute] Adding reachable city: ${dest}`);
                                reachableCities.add(dest);
                            } else {
                                console.log(`[Commute] City ${dest} is too far (${dur} min > ${maxMinutes} min)`);
                            }
                        } else {
                            console.log(`[Commute] No connections found for ${dest}`);
                        }
                    } catch (apiErr: any) {
                        console.error(`[Commute] SBB API Error for ${dest}:`, apiErr.message);
                    }
                })
            );
        }

        // Step 3: Return companies in reachable cities
        console.log(`[Commute] Final reachable cities (${reachableCities.size}):`, Array.from(reachableCities));

        if (reachableCities.size === 0) {
            return res.json({ reachableCities: [], companies: [] });
        }

        const cityList = Array.from(reachableCities);
        // Note: The placeholders logic below was incorrect in original code if using ANY(ARRAY[...])
        // It used ANY(ARRAY[$1, $2...]) but passed cityList as values. 
        // Correct usage for Postgres 'ANY' with array parameter is typically `ANY($1)` where $1 is the array.
        // However, the original code used `ANY(ARRAY[${placeholders}])` constructing the array literal in SQL from parameters.
        // Let's debug this query construction too.

        const placeholders = cityList.map((_, i) => `$${i + 1}`).join(', ');
        const query = `
            SELECT c.id, c.name, c.city, c.lat, c.lng,
                   json_agg(json_build_object('tag', t.tag, 'category', t.category)) AS tags
            FROM companies c
            LEFT JOIN tech_tags t ON t.company_id = c.id
            WHERE c.city = ANY(ARRAY[${placeholders}])
            GROUP BY c.id
        `;

        console.log(`[Commute] Executing DB Query for companies...`);

        const { rows: companies } = await pool.query(query, cityList);

        console.log(`[Commute] Found ${companies.length} companies in reachable cities.`);

        res.json({
            reachableCities: cityList,
            companies,
            query: { from, maxMinutes },
        });
    } catch (err: any) {
        console.error('[Commute] Commute filter CRITICAL error:', err);
        res.status(500).json({ error: 'Commute filter failed', details: err.message });
    }
});

export default router;
