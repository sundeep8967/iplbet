import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { parse, differenceInMinutes } from 'date-fns';
import { GoogleAuth } from 'google-auth-library';
import nodemailer from 'nodemailer';

// Import schedule to check upcoming matches
const { IPL_SCHEDULE } = await import('../src/models/constants.js');

// ── Firebase REST Auth ────────────────────────────────────────────────────────
let serviceAccount;
const localPath = new URL('./serviceAccount.json', import.meta.url).pathname;

if (existsSync(localPath)) {
  serviceAccount = JSON.parse(readFileSync(localPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error('❌ No Firebase credentials found. Exiting.');
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

async function fetchFromFirestore(collectionId) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const res = await fetch(`${FIRESTORE_BASE}/${collectionId}`, {
    headers: { 'Authorization': `Bearer ${token.token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  
  return (data.documents || []).map(d => {
    const fields = d.fields || {};
    const formatted = { id: d.name.split('/').pop() };
    Object.keys(fields).forEach(key => {
      // Very basic extraction of the underlying value
      formatted[key] = Object.values(fields[key])[0];
    });
    return formatted;
  });
}

// ── Main Logic ────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🔔 Reminder Check Starting…');
  
  // 1. Find any match starting in exactly 20-40 minutes (targeting the 30 min window)
  const now = new Date();
  
  const upcomingMatches = IPL_SCHEDULE.map(m => ({
    ...m,
    id: `ipl-2025-${m.num}`,
    matchTime: parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date())
  })).filter(m => {
    const minsUntilMatch = differenceInMinutes(m.matchTime, now);
    // The cron runs at exact 30-min intervals. Give a 15 min buffer to catch the match.
    return minsUntilMatch > 15 && minsUntilMatch <= 45;
  });

  if (upcomingMatches.length === 0) {
    console.log('✅ No matches starting in 30 minutes. Exiting.');
    return;
  }

  // 2. We have a match! Fetch data
  const targetMatch = upcomingMatches[0];
  console.log(`⏰ Upcoming Match: ${targetMatch.fixture} at ${targetMatch.time}`);

  console.log('Fetching users, votes, and preferences from Firestore...');
  const [votes, preferences] = await Promise.all([
    fetchFromFirestore('votes'),
    fetchFromFirestore('user_preferences')
  ]);

  // Which users have already voted for THIS match?
  const votedUserNames = new Set(votes.filter(v => v.match_id === targetMatch.id).map(v => v.user_name));
  
  // Determine who needs an email based on all users who have EVER voted (known users)
  const allKnownUsers = Array.from(new Set(votes.map(v => v.user_name)));

  // 3. Configure Email Transport
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('⚠️ GMAIL_USER or GMAIL_PASS missing from env! Cannot send emails.');
    console.log('Would have emailed the following missing users:');
    allKnownUsers.forEach(u => {
      if (!votedUserNames.has(u)) console.log(` - ${u}`);
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  // 4. Send Emails
  for (const userName of allKnownUsers) {
    if (votedUserNames.has(userName)) continue; // Already voted

    // Look up their explicit email address & preferences from the db
    // (votes contains their last known profile)
    const userVote = votes.find(v => v.user_name === userName);
    if (!userVote || !userVote.user_id) continue;
    
    // Find preference
    const pref = preferences.find(p => p.id === userVote.user_id);
    
    if (pref && pref.sendEmails === false) {
      console.log(`🔇 Skipping ${userName} (Opted out)`);
      continue;
    }

    const emailAddress = pref ? pref.email : null;
    if (!emailAddress) {
      console.log(`⚠️ Missing email address for ${userName}, skipping.`);
      continue;
    }

    console.log(`📩 Sending reminder to ${userName} (${emailAddress})...`);

    const [team1, team2] = targetMatch.fixture.split(' vs ');

    const mailOptions = {
      from: `"ChaiBet Reminders" <${process.env.GMAIL_USER}>`,
      to: emailAddress,
      subject: `[30 MIN WARNING] Place your bet: ${team1} vs ${team2}!`,
      html: `
        <div style="font-family: sans-serif; text-align: center; color: #333;">
          <h2 style="color: #ea580c;">🏏 ChaiBet Global</h2>
          <p>Hey <b>${userName}</b>!</p>
          <p>The match between <b>${team1}</b> and <b>${team2}</b> starts in less than 30 minutes!</p>
          <hr style="border: 1px dashed #ccc; margin: 20px 0;" />
          <p style="font-size: 1.2rem; font-weight: bold;">You haven't placed your bet yet.</p>
          <p style="color: #ef4444;">If you don't vote, you'll be automatically deducted ₹10!</p>
          <br/>
          <a href="https://iplbet.vercel.app/" style="background: #14b8a6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 1.1rem;">Cast Your Vote Now</a>
          <br/><br/>
          <p style="font-size: 0.8rem; color: #888; margin-top: 30px;">
            You can turn off these reminders inside the Admin/Profile Dashboard.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(` ✅ Sent OK`);
    } catch (err) {
      console.error(` ❌ Failed to send: ${err.message}`);
    }
  }

  console.log('\n🏁 Reminder sequence complete.');
}

run();
