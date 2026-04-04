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

import { createRequire }          from 'module';
import { readFileSync, existsSync } from 'fs';
import { parse, isBefore, addHours } from 'date-fns';
import { GoogleAuth } from 'google-auth-library';
import { scrapeMatchResult } from './scrapeMatchResult.js';

// ── Service Account & REST Setup ──────────────────────────────────────────────
let serviceAccount;
const localPath = new URL('./serviceAccount.json', import.meta.url).pathname;

if (existsSync(localPath)) {
  serviceAccount = JSON.parse(readFileSync(localPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error('❌ No Firebase credentials found.');
  process.exit(1);
}

const auth = new GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  projectId: serviceAccount.project_id,
  scopes: ['https://www.googleapis.com/auth/datastore']
});

const PROJECT_ID = serviceAccount.project_id;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;


// ── IPL Schedule (source of truth for match timing) ───────────────────────────
// Import from your model so there's only one place to update
const { IPL_SCHEDULE } = await import('../src/models/constants.js');

// How many hours after match start before we try to settle
const HOURS_AFTER_START = 4.5;

// ─────────────────────────────────────────────────────────────────────────────

async function getAlreadySettledMatchIds() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const res = await fetch(`${FIRESTORE_BASE}/match_results`, {
    headers: { 'Authorization': `Bearer ${token.token}` }
  });
  if (!res.ok) return new Set();
  const data = await res.json();
  const ids = (data.documents || []).map(d => d.fields?.match_id?.stringValue).filter(Boolean);
  return new Set(ids);
}

async function settleMatch(matchId, winnerTeam) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  const payload = {
    fields: {
      match_id:    { stringValue: matchId },
      winner_team: { stringValue: winnerTeam },
      settled_at:  { stringValue: new Date().toISOString() },
      auto:        { booleanValue: true }
    }
  };

  const res = await fetch(`${FIRESTORE_BASE}/match_results`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`REST Error HTTP ${res.status}: ${await res.text()}`);
  }
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
