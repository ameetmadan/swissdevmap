import { chromium } from 'playwright';
import { pool } from '../db/pool';

// Wappalyzer-style pattern rules
const FINGERPRINTS: Array<{
    pattern: RegExp | ((headers: Record<string, string>, html: string, scripts: string[]) => boolean);
    tag: string;
    category: string;
}> = [
        // Frontend Frameworks
        { pattern: /__NEXT_DATA__/, tag: 'Next.js', category: 'frontend' },
        { pattern: /window\.__nuxt__/, tag: 'Nuxt.js', category: 'frontend' },
        { pattern: /ng-version=/, tag: 'Angular', category: 'frontend' },
        { pattern: /__vue_/, tag: 'Vue', category: 'frontend' },
        { pattern: /react\.production\.min\.js|ReactDOM/, tag: 'React', category: 'frontend' },
        { pattern: /gatsby-/, tag: 'Gatsby', category: 'frontend' },
        { pattern: /svelte/, tag: 'Svelte', category: 'frontend' },
        // Backend / Server
        {
            pattern: (headers) => (headers['x-powered-by'] || '').toLowerCase().includes('express'),
            tag: 'Node.js', category: 'backend',
        },
        {
            pattern: (headers) => (headers['x-powered-by'] || '').toLowerCase().includes('php'),
            tag: 'PHP', category: 'backend',
        },
        {
            pattern: (headers) => (headers['server'] || '').toLowerCase().includes('nginx'),
            tag: 'Nginx', category: 'devops',
        },
        {
            pattern: (headers) => (headers['server'] || '').toLowerCase().includes('apache'),
            tag: 'Apache', category: 'devops',
        },
        {
            pattern: (headers) => (headers['x-powered-by'] || '').toLowerCase().includes('asp.net'),
            tag: 'ASP.NET', category: 'backend',
        },
        // Cloud / CDN
        {
            pattern: (headers) => !!(headers['x-amz-cf-id'] || headers['x-cache']?.includes('CloudFront')),
            tag: 'AWS', category: 'cloud',
        },
        {
            pattern: (headers) => !!(headers['x-azure-ref'] || headers['server']?.includes('Microsoft')),
            tag: 'Azure', category: 'cloud',
        },
        {
            pattern: (headers) => !!(headers['server']?.includes('Google') || headers['x-goog-hash']),
            tag: 'GCP', category: 'cloud',
        },
        {
            pattern: (headers) => !!(headers['cf-ray'] || headers['server']?.toLowerCase().includes('cloudflare')),
            tag: 'Cloudflare', category: 'devops',
        },
        // Analytics / DX
        { pattern: /gtag\(|google-analytics/, tag: 'Google Analytics', category: 'devops' },
        { pattern: /segment\.com\/analytics/, tag: 'Segment', category: 'devops' },
        { pattern: /smartlookCallback|smartlook/, tag: 'Smartlook', category: 'devops' },
        { pattern: /wp-content|wordpress/, tag: 'WordPress', category: 'backend' },
        // CSS frameworks
        { pattern: /bootstrap\.min\.css|bootstrap\.css/, tag: 'Bootstrap', category: 'frontend' },
        { pattern: /tailwindcss|tailwind\./, tag: 'Tailwind CSS', category: 'frontend' },
    ];

const COMPANIES_TO_FINGERPRINT = [
    { name: 'Swisscom', url: 'https://www.swisscom.ch' },
    { name: 'Logitech', url: 'https://www.logitech.com' },
    { name: 'Proton', url: 'https://proton.me' },
    { name: 'ABB', url: 'https://www.abb.com' },
    { name: 'Google Zürich', url: 'https://careers.google.com/locations/zurich/' },
    { name: 'UBS', url: 'https://www.ubs.com' },
    { name: 'Roche', url: 'https://www.roche.com' },
    { name: 'Novartis', url: 'https://www.novartis.com' },
    { name: 'SIX Group', url: 'https://www.six-group.com' },
    { name: 'Ergon Informatik', url: 'https://www.ergon.ch' },
    { name: 'Open Systems', url: 'https://www.open-systems.com' },
    { name: 'Adnovum', url: 'https://www.adnovum.ch' },
    { name: 'Tamedia', url: 'https://www.tamedia.ch' },
    { name: 'Nestlé Digital Hub', url: 'https://www.nestle.com' },
    { name: 'EPFL Innovation Park', url: 'https://www.innovationpark.ch' },
    { name: 'Zühlke Engineering', url: 'https://www.zuehlke.com' },
    { name: 'Sensirion', url: 'https://www.sensirion.com' },
    { name: 'Sunrise UPC', url: 'https://www.sunrise.ch' },
    { name: 'Doodle', url: 'https://doodle.com' },
    { name: 'Cembra Money Bank', url: 'https://www.cembra.ch' },
];

function applyFingerprints(
    headers: Record<string, string>,
    html: string,
    scripts: string[]
): { tag: string; category: string }[] {
    const found: Map<string, string> = new Map();
    const combined = html + ' ' + scripts.join(' ');

    for (const { pattern, tag, category } of FINGERPRINTS) {
        let matched = false;
        if (typeof pattern === 'function') {
            matched = pattern(headers, html, scripts);
        } else {
            matched = pattern.test(combined);
        }
        if (matched) {
            found.set(tag, category);
        }
    }

    return Array.from(found.entries()).map(([tag, category]) => ({ tag, category }));
}

export async function runFingerprinting() {
    console.log('🕵️  Starting Wappalyzer-style fingerprinting...');
    const browser = await chromium.launch({ headless: true });
    const results: Record<string, string[]> = {};

    for (const company of COMPANIES_TO_FINGERPRINT) {
        const page = await browser.newPage();
        const capturedHeaders: Record<string, string> = {};

        page.on('response', (res) => {
            if (res.url() === company.url || res.request().isNavigationRequest()) {
                const headers = res.headers();
                Object.assign(capturedHeaders, headers);
            }
        });

        try {
            await page.goto(company.url, { timeout: 20000, waitUntil: 'domcontentloaded' });
            const html = await page.content();
            const scripts = await page.$$eval('script[src]', (els) =>
                els.map((el) => (el as HTMLScriptElement).src)
            );

            const tags = applyFingerprints(capturedHeaders, html, scripts);
            results[company.name] = tags.map((t) => t.tag);
            console.log(`  ✅ ${company.name}: ${tags.map((t) => t.tag).join(', ') || 'none detected'}`);

            // Persist to DB
            const existing = await pool.query('SELECT id FROM companies WHERE name ILIKE $1', [company.name]);
            if (existing.rows.length > 0) {
                const companyId = existing.rows[0].id;
                for (const { tag, category } of tags) {
                    await pool.query(
                        `INSERT INTO tech_tags (company_id, tag, category, source)
             VALUES ($1, $2, $3, 'fingerprint')
             ON CONFLICT (company_id, tag) DO NOTHING`,
                        [companyId, tag, category]
                    );
                }
            }
        } catch (err) {
            console.warn(`  ⚠️  ${company.name}: failed — ${(err as Error).message}`);
        } finally {
            await page.close();
        }

        await new Promise((r) => setTimeout(r, 1500));
    }

    await browser.close();
    console.log('🏁 Fingerprinting complete.');
    return results;
}
