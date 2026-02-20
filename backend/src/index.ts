import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import companiesRouter from './routes/companies';
import heatmapRouter from './routes/heatmap';
import commuteRouter from './routes/commute';
import { scrapeJobsCh } from './scrapers/jobsch';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'SwissDevMap API', timestamp: new Date().toISOString() });
});

// ─── Core API Routes ────────────────────────────────────────────────────────────
app.use('/api/companies', companiesRouter);
app.use('/api/heatmap', heatmapRouter);
app.use('/api/commute', commuteRouter);

// ─── Manual Scraper Triggers ────────────────────────────────────────────────────
app.post('/api/scrape/jobsch', async (_req, res) => {
    console.log('\n🚀 Scrape triggered: Jobs.ch');
    scrapeJobsCh()
        .then((result) => console.log('Jobs.ch done', result))
        .catch(console.error);
    res.json({ message: 'Jobs.ch scraper started — check server logs for progress.' });
});

// ─── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
  ██████╗ ██╗    ██╗███╗   ███╗
  ██╔══██╗██║    ██║████╗ ████║
  ██║  ██║██║ █╗ ██║██╔████╔██║
  ██║  ██║██║███╗██║██║╚██╔╝██║
  ██████╔╝╚███╔███╔╝██║ ╚═╝ ██║
  ╚═════╝  ╚══╝╚══╝ ╚═╝     ╚═╝
  SwissDevMap API — running on :${PORT}
  `);
});

export default app;
