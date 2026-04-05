import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import nodemailer from 'nodemailer';

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
      formatted[key] = Object.values(fields[key])[0];
    });
    return formatted;
  });
}

async function runTest() {
  console.log('\n🚀 Starting Email Blast Test...');

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('⚠️ ERROR: You must provide GMAIL_USER and GMAIL_PASS to run this script.');
    console.log('Run the script like this:');
    console.log('GMAIL_USER="your-email@gmail.com" GMAIL_PASS="your-16-char-app-pass" node scripts/testEmail.js');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const [votes, preferences] = await Promise.all([
    fetchFromFirestore('votes'),
    fetchFromFirestore('user_preferences')
  ]);

  // Identify all valid users by finding who has cast a vote before
  const allKnownUsers = Array.from(new Set(votes.map(v => v.user_name)));

  if (allKnownUsers.length === 0) {
    console.log("No known users found in the DB to email!");
    return;
  }

  for (const userName of allKnownUsers) {
    const userVote = votes.find(v => v.user_name === userName);
    if (!userVote || !userVote.user_id) continue;
    
    const pref = preferences.find(p => p.id === userVote.user_id);
    
    if (pref && pref.sendEmails === false) {
      console.log(`🔇 Skipping ${userName} (Has explicitly disabled emails in UI)`);
      continue;
    }

    const emailAddress = pref ? pref.email : null;
    if (!emailAddress) {
      console.log(`⚠️ Missing email address for ${userName}, skipping.`);
      continue;
    }

    console.log(`📩 Sending TEST reminder to ${userName} (${emailAddress})...`);

    const mailOptions = {
      from: `"ChaiBet Reminders" <${process.env.GMAIL_USER}>`,
      to: emailAddress,
      subject: `[TESTING] ChaiBet Match Notification Test! 🏏`,
      html: `
        <div style="font-family: sans-serif; text-align: center; color: #333;">
          <h2 style="color: #ea580c;">🏏 ChaiBet Global</h2>
          <p>Hey <b>${userName}</b>!</p>
          <p>This is a test notification from the ChaiBet system.</p>
          <hr style="border: 1px dashed #ccc; margin: 20px 0;" />
          <p style="font-size: 1.2rem; font-weight: bold;">If you're seeing this, the notification system works perfectly!</p>
          <br/>
          <a href="https://iplbet.vercel.app/" style="background: #14b8a6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 1.1rem;">Visit ChaiBet</a>
          <br/><br/>
          <p style="font-size: 0.8rem; color: #888; margin-top: 30px;">
            You can turn off these reminders temporarily inside the Admin/Profile Dashboard.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(` ✅ Sent OK to ${userName}`);
    } catch (err) {
      console.error(` ❌ Failed to send to ${userName}: ${err.message}`);
    }
  }

  console.log('\n🏁 Test sequence complete.');
}

runTest();
