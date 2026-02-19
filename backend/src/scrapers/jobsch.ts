import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from '../db/pool';

const TECH_KEYWORDS: Record<string, string> = {
    react: 'frontend', vue: 'frontend', angular: 'frontend', svelte: 'frontend',
    'next.js': 'frontend', nextjs: 'frontend',
    java: 'backend', kotlin: 'backend', scala: 'backend', python: 'backend',
    go: 'backend', golang: 'backend', rust: 'backend', 'c#': 'backend', 'c++': 'backend',
    'node.js': 'backend', node: 'backend', typescript: 'backend', ruby: 'backend',
    aws: 'cloud', azure: 'cloud', gcp: 'cloud', 'google cloud': 'cloud',
    kubernetes: 'devops', docker: 'devops', terraform: 'devops', kafka: 'devops',
    postgresql: 'backend', postgres: 'backend', mysql: 'backend', mongodb: 'backend', redis: 'backend',
};

function extractTags(text: string): { tag: string; category: string }[] {
    const lower = text.toLowerCase();
    const found: Map<string, string> = new Map();
    for (const [keyword, category] of Object.entries(TECH_KEYWORDS)) {
        const regex = new RegExp(`\\b${keyword.replace(/[+.]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
            const display = ['go', 'golang'].includes(keyword) ? 'Go'
                : keyword.charAt(0).toUpperCase() + keyword.slice(1);
            found.set(display, category);
        }
    }
    return Array.from(found.entries()).map(([tag, category]) => ({ tag, category }));
}

export async function scrapeJobsCh() {
    console.log('🔍 Starting Jobs.ch scraper...');
    const BASE_URL = 'https://www.jobs.ch';
    let scraped = 0;

    try {
        const res = await axios.get(`${BASE_URL}/en/vacancies/?region=zurich&field=it`, {
            headers: { 'User-Agent': 'SwissDevMap-Bot/1.0 (research tool)' },
            timeout: 15000,
        });
        const $ = cheerio.load(res.data);

        const jobLinks: string[] = [];
        $('a[href*="/en/vacancies/"]').each((_i, el) => {
            const href = $(el).attr('href');
            if (href && !jobLinks.includes(href) && href.length > 20) {
                jobLinks.push(href.startsWith('http') ? href : `${BASE_URL}${href}`);
            }
        });

        console.log(`  Found ${jobLinks.length} job links on Jobs.ch`);

        for (const url of jobLinks.slice(0, 30)) {
            try {
                const jobRes = await axios.get(url, {
                    headers: { 'User-Agent': 'SwissDevMap-Bot/1.0' },
                    timeout: 10000,
                });
                const $$ = cheerio.load(jobRes.data);
                const text = $$('body').text();
                const companyName = $$('[class*="company"], [class*="employer"], [data-cy*="company"]').first().text().trim();
                const tags = extractTags(text);

                if (companyName && tags.length > 0) {
                    const existing = await pool.query('SELECT id FROM companies WHERE name ILIKE $1', [companyName]);
                    if (existing.rows.length > 0) {
                        const companyId = existing.rows[0].id;
                        for (const { tag, category } of tags) {
                            await pool.query(
                                `INSERT INTO tech_tags (company_id, tag, category, source)
                 VALUES ($1, $2, $3, 'jobsch')
                 ON CONFLICT (company_id, tag) DO NOTHING`,
                                [companyId, tag, category]
                            );
                        }
                        await pool.query(
                            `INSERT INTO job_postings (company_id, source, source_url, title, raw_text)
               VALUES ($1, 'jobsch', $2, $3, $4)`,
                            [companyId, url, $$('h1').first().text().trim(), text.slice(0, 5000)]
                        );
                        scraped++;
                        console.log(`  ✅ ${companyName}: ${tags.map((t) => t.tag).join(', ')}`);
                    }
                }

                await new Promise((r) => setTimeout(r, 1200));
            } catch {
                // Skip individual failures
            }
        }
    } catch (err) {
        console.error('Jobs.ch scraper failed:', err);
    }

    console.log(`🏁 Jobs.ch scraper done. ${scraped} companies enriched.`);
    return { scraped };
}
