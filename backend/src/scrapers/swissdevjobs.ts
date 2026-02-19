import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from '../db/pool';

// Known tech keywords to detect in job postings
const TECH_KEYWORDS: Record<string, string> = {
    // Frontend
    react: 'frontend', vue: 'frontend', angular: 'frontend', svelte: 'frontend',
    nextjs: 'frontend', nuxt: 'frontend', 'next.js': 'frontend',
    // Backend
    node: 'backend', 'node.js': 'backend', express: 'backend', fastify: 'backend',
    java: 'backend', spring: 'backend', kotlin: 'backend', scala: 'backend',
    python: 'backend', django: 'backend', fastapi: 'backend', flask: 'backend',
    go: 'backend', golang: 'backend', rust: 'backend', 'c#': 'backend',
    'c++': 'backend', ruby: 'backend', rails: 'backend', php: 'backend',
    typescript: 'backend', elixir: 'backend', clojure: 'backend',
    // Cloud
    aws: 'cloud', azure: 'cloud', gcp: 'cloud', 'google cloud': 'cloud',
    // Devops
    kubernetes: 'devops', docker: 'devops', terraform: 'devops', ansible: 'devops',
    jenkins: 'devops', gitlab: 'devops', github: 'devops', kafka: 'devops',
    spark: 'devops', airflow: 'devops',
    // Data
    postgresql: 'backend', postgres: 'backend', mysql: 'backend', mongodb: 'backend',
    redis: 'backend', elasticsearch: 'backend', clickhouse: 'backend',
    // Mobile
    swift: 'frontend', 'react native': 'frontend', flutter: 'frontend',
};

function extractTags(text: string): { tag: string; category: string }[] {
    const lower = text.toLowerCase();
    const found: Map<string, string> = new Map();

    for (const [keyword, category] of Object.entries(TECH_KEYWORDS)) {
        // Match whole words / boundaries
        const regex = new RegExp(`\\b${keyword.replace(/[+.]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
            // Normalize display name
            const display = keyword === 'go' || keyword === 'golang' ? 'Go'
                : keyword.charAt(0).toUpperCase() + keyword.slice(1);
            found.set(display, category);
        }
    }

    return Array.from(found.entries()).map(([tag, category]) => ({ tag, category }));
}

async function upsertCompanyTags(
    companyId: string,
    tags: { tag: string; category: string }[],
    source: string
) {
    for (const { tag, category } of tags) {
        await pool.query(
            `INSERT INTO tech_tags (company_id, tag, category, source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, tag) DO NOTHING`,
            [companyId, tag, category, source]
        );
    }
}

export async function scrapeSwissDevJobs() {
    console.log('🔍 Starting SwissDevJobs scraper...');
    const BASE_URL = 'https://swissdevjobs.ch';
    let scraped = 0;

    try {
        const res = await axios.get(`${BASE_URL}/jobs`, {
            headers: { 'User-Agent': 'SwissDevMap-Bot/1.0 (research tool)' },
            timeout: 15000,
        });
        const $ = cheerio.load(res.data);

        // Extract job cards — selector based on SwissDevJobs.ch structure
        const jobLinks: string[] = [];
        $('a[href*="/jobs/"]').each((_i, el) => {
            const href = $(el).attr('href');
            if (href && !jobLinks.includes(href)) {
                jobLinks.push(href.startsWith('http') ? href : `${BASE_URL}${href}`);
            }
        });

        console.log(`  Found ${jobLinks.length} job links`);

        for (const url of jobLinks.slice(0, 30)) {
            try {
                const jobRes = await axios.get(url, {
                    headers: { 'User-Agent': 'SwissDevMap-Bot/1.0' },
                    timeout: 10000,
                });
                const $$ = cheerio.load(jobRes.data);
                const text = $$('body').text();
                const companyName = $$('[class*="company"], [class*="employer"]').first().text().trim();
                const tags = extractTags(text);

                if (companyName && tags.length > 0) {
                    // Find or create company
                    let companyId: string = '';
                    const existing = await pool.query('SELECT id FROM companies WHERE name ILIKE $1', [companyName]);
                    if (existing.rows.length > 0) {
                        companyId = existing.rows[0].id;
                    } else {
                        // We don't have coordinates for unknown companies — skip for now
                        console.log(`  ℹ️  Unknown company: ${companyName} (no coords — skipping)`);
                        // Store job posting without company link
                        await pool.query(
                            `INSERT INTO job_postings (source, source_url, title, raw_text)
               VALUES ($1, $2, $3, $4)`,
                            ['swissdevjobs', url, $$('h1').first().text().trim(), text.slice(0, 5000)]
                        );
                        continue;
                    }

                    await upsertCompanyTags(companyId, tags, 'swissdevjobs');
                    await pool.query(
                        `INSERT INTO job_postings (company_id, source, source_url, title, raw_text)
             VALUES ($1, $2, $3, $4, $5)`,
                        [companyId, 'swissdevjobs', url, $$('h1').first().text().trim(), text.slice(0, 5000)]
                    );
                    scraped++;
                    console.log(`  ✅ ${companyName}: ${tags.map((t) => t.tag).join(', ')}`);
                }

                await new Promise((r) => setTimeout(r, 1000)); // be polite
            } catch {
                // Skip individual job failures
            }
        }
    } catch (err) {
        console.error('SwissDevJobs scraper failed:', err);
    }

    console.log(`🏁 SwissDevJobs scraper done. ${scraped} postings processed.`);
    return { scraped };
}
