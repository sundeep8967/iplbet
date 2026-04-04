/**
 * settleServer.js
 *
 * Tiny local Express server that bridges the React admin UI to the Playwright
 * scraper. The browser can't run Playwright, so the UI calls POST /api/scrape-result
 * and this server runs the scraper and returns the result.
 *
 * Start alongside Vite:   npm run settle:server
 * Runs on:                http://localhost:3001
 * Proxied via Vite as:    /api  →  http://localhost:3001
 *
 * Usage:
 *   Terminal 1: npm run dev
 *   Terminal 2: npm run settle:server
 */

import express from 'express';
import { scrapeMatchResult } from './scrapeMatchResult.js';

const app  = express();
const PORT = 3001;

app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/**
 * POST /api/scrape-result
 * Body: { team1: string, team2: string, date: string }
 * Returns: { winner: string | null }
 */
app.post('/api/scrape-result', async (req, res) => {
  const { team1, team2, date } = req.body;

  if (!team1 || !team2 || !date) {
    return res.status(400).json({ error: 'Missing team1, team2, or date' });
  }

  console.log(`\n📡 Settle request: ${team1} vs ${team2} on ${date}`);

  try {
    const winner = await scrapeMatchResult(team1, team2, date);
    console.log(`   Result: ${winner ?? 'not found'}`);
    res.json({ winner });
  } catch (err) {
    console.error('Scraper error:', err.message);
    res.status(500).json({ error: err.message, winner: null });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 ChaiBet Settle Server running at http://localhost:${PORT}`);
  console.log(`   POST /api/scrape-result  →  runs Playwright & returns winner\n`);
});
