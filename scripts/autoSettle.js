/**
 * autoSettle.js
 *
 * Orchestrator: finds unsettled matches that ended 4.5+ hours ago,
 * scrapes Google for the result, and writes to Firestore.
 *
 * Uses Firebase Admin SDK (service account) so it can run as a standalone
 * Node.js script — outside the browser, on a server or scheduler.
 *
 * Setup (one-time):
 *   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save as scripts/serviceAccount.json  (already gitignored)
 *   3. Run: node scripts/autoSettle.js
 *
 * Schedule (cron example — runs every 30 min from 7 PM to 1 AM IST):
 *   30 13,14,15,16,17,18,19 * * * cd /path/to/iplbet && node scripts/autoSettle.js
 */

import { createRequire }   from 'module';
import { parse, isBefore, addHours } from 'date-fns';

import { scrapeMatchResult } from './scrapeMatchResult.js';

// ── Firebase Admin Setup ──────────────────────────────────────────────────────
// We use createRequire because firebase-admin still ships as CJS
const require = createRequire(import.meta.url);
const admin   = require('firebase-admin');

// Path to the service account JSON you downloaded from Firebase Console
const SERVICE_ACCOUNT_PATH = new URL('./serviceAccount.json', import.meta.url).pathname;

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    (await import('fs')).default.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8')
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ── IPL Schedule (source of truth for match timing) ───────────────────────────
// Import from your model so there's only one place to update
const { IPL_SCHEDULE } = await import('../src/models/constants.js');

// How many hours after match start before we try to settle
const HOURS_AFTER_START = 4.5;

// ─────────────────────────────────────────────────────────────────────────────

async function getAlreadySettledMatchIds() {
  const snap = await db.collection('match_results').get();
  return new Set(snap.docs.map(d => d.data().match_id));
}

async function settleMatch(matchId, winnerTeam) {
  await db.collection('match_results').add({
    match_id:    matchId,
    winner_team: winnerTeam,
    settled_at:  new Date().toISOString(),
    auto:        true,   // flag so you know this was auto-settled
  });
  console.log(`  ✅ Settled: ${matchId} → ${winnerTeam}`);
}

async function run() {
  console.log('\n🤖 Auto-settle starting…');
  console.log(`   Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n`);

  const settledIds = await getAlreadySettledMatchIds();
  const now        = new Date();

  // Only process IPL_SCHEDULE matches (custom matches are ignored for now)
  const candidates = IPL_SCHEDULE
    .map(m => ({
      ...m,
      id:        `ipl-2025-${m.num}`,
      matchTime: parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date()),
    }))
    .filter(m => {
      if (settledIds.has(m.id)) return false;                      // already done
      const settleAfter = addHours(m.matchTime, HOURS_AFTER_START);
      return isBefore(settleAfter, now);                           // 4.5h window passed
    });

  if (candidates.length === 0) {
    console.log('✅ No unsettled matches ready. Exiting.');
    return;
  }

  console.log(`📋 Found ${candidates.length} match(es) to settle:\n`);

  for (const match of candidates) {
    const [team1, team2] = match.fixture.split(' vs ');
    console.log(`⚡ Match ${match.num}: ${match.fixture} (${match.date})`);

    try {
      const winner = await scrapeMatchResult(team1, team2, match.date);

      if (winner) {
        await settleMatch(match.id, winner);
      } else {
        console.log(`  ⚠️  Result not found yet — will retry next run.`);
      }
    } catch (err) {
      console.error(`  ❌ Error processing match ${match.num}:`, err.message);
    }

    // Be polite — wait 3 seconds between searches to avoid bot detection
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('\n🏁 Auto-settle run complete.');
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
