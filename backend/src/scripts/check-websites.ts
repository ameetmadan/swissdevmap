
import { pool } from '../db/pool';
import axios from 'axios';

async function checkWebsites() {
    try {
        console.log('Connecting to database...');
        const res = await pool.query('SELECT name, website FROM companies ORDER BY name ASC');
        const companies = res.rows;

        console.log(`Found ${companies.length} companies. checking websites...\n`);

        let successCount = 0;
        let failCount = 0;

        for (const company of companies) {
            if (!company.website) {
                console.log(`[SKIP] ${company.name}: No website`);
                continue;
            }

            const website = company.website.trim();
            if (!website) {
                console.log(`[SKIP] ${company.name}: Empty website`);
                continue;
            }

            try {
                const response = await axios.get(website, {
                    timeout: 10000, // 10s timeout
                    validateStatus: () => true, // Accept all status codes to inspect them manually
                    headers: {
                        // Use a standard browser User-Agent to avoid being blocked by simple bot protection
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    }
                });

                const contentType = response.headers['content-type'];
                const isHtml = contentType && contentType.toLowerCase().includes('text/html');
                const isSuccess = response.status >= 200 && response.status < 300;

                if (isSuccess && isHtml) {
                    console.log(`[OK]   ${company.name.padEnd(25)} ${website} (Status: ${response.status})`);
                    successCount++;
                } else {
                    // If status is OK but not HTML, maybe it's a redirect or API endpoint?
                    // If status is redirect (3xx), axios follows by default, so we see final status.
                    // If we see 3xx here, it means axios didn't follow or we configured it not to.
                    // But default axios follows redirects.
                    console.log(`[FAIL] ${company.name.padEnd(25)} ${website} (Status: ${response.status}, Type: ${contentType || 'unknown'})`);
                    failCount++;
                }
            } catch (error: any) {
                // Network errors, timeout, etc.
                console.log(`[ERR]  ${company.name.padEnd(25)} ${website} (${error.message})`);
                failCount++;
            }
        }

        console.log(`\nSummary: ${successCount} accessible, ${failCount} issues.`);

    } catch (err) {
        console.error('Script error:', err);
    } finally {
        await pool.end();
    }
}

checkWebsites();
