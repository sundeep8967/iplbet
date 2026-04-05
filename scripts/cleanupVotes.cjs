const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function cleanupVotes() {
  console.log('Fetching all votes...');
  const snap = await db.collection('votes').get();
  console.log(`Found ${snap.size} total votes.`);

  const votes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const uniqueVotesMap = new Map();
  const duplicatesToDelete = [];

  // Sort by created_at descending (newest first)
  votes.sort((a, b) => {
    const tA = new Date(a.created_at || 0);
    const tB = new Date(b.created_at || 0);
    return tB - tA;
  });

  votes.forEach(v => {
    const userId = v.user_id || v.uid;
    const matchId = v.match_id;

    if (!userId || !matchId) {
      console.warn(`[SKIP] Missing metadata for doc ${v.id}`);
      return;
    }

    const key = `${userId}_${matchId}`;

    if (uniqueVotesMap.has(key)) {
      // Already found a newer vote for this user/match
      duplicatesToDelete.push(v.id);
    } else {
      uniqueVotesMap.set(key, v);
    }
  });

  if (duplicatesToDelete.length === 0) {
    console.log('No duplicates found. Database is clean!');
    return;
  }

  console.log(`Identified ${duplicatesToDelete.length} duplicates to delete.`);

  // Batch delete (limit 500 per batch)
  const batchSize = 500;
  for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
    const batch = db.batch();
    const chunk = duplicatesToDelete.slice(i, i + batchSize);
    chunk.forEach(id => {
      const ref = db.collection('votes').doc(id);
      batch.delete(ref);
    });
    await batch.commit();
    console.log(`Deleted batch ${i / batchSize + 1} (${chunk.length} docs).`);
  }

  console.log('Cleanup complete!');
}

cleanupVotes().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
