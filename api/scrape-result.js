// api/scrape-result.js
// Vercel Serverless Function

import { scrapeMatchResult } from '../scripts/scrapeMatchResult.js';

export const maxDuration = 60; // Set max timeout to 60 seconds (Hobby max as of recent updates is up to 60s, default 10s)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { team1, team2, date } = req.body;

  if (!team1 || !team2 || !date) {
    return res.status(400).json({ error: 'Missing team1, team2, or date' });
  }

  console.log(`\n📡 Vercel serverless scrape request: ${team1} vs ${team2} on ${date}`);

  try {
    const winner = await scrapeMatchResult(team1, team2, date);
    console.log(`   Result: ${winner ?? 'not found'}`);
    res.status(200).json({ winner });
  } catch (err) {
    console.error('Scraper error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error', winner: null });
  }
}
