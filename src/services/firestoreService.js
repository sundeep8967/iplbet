import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot,
  query, orderBy, where, updateDoc, doc, deleteDoc, setDoc, getDoc, getDocs, limit
} from 'firebase/firestore';
import { IPL_SCHEDULE } from '../models/constants';

// ─── SUBSCRIPTIONS ──────────────────────────────────────────────────────────

/**
 * Subscribe to real-time votes (newest first).
 * Includes client-side deduplication to handle legacy duplicate records.
 * @param {(votes: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeVotes(callback) {
  const q = query(collection(db, 'votes'), orderBy('created_at', 'desc'));
  return onSnapshot(q, snap => {
    const allVotes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const uniqueVotesMap = new Map();
    
    // Since records are ordered by created_at DESC, the first one we see
    // for a (user, match) pair is the authoritative latest pick.
    allVotes.forEach(v => {
      const userId = v.user_id || v.uid;
      const key = `${userId}_${v.match_id}`;
      if (userId && v.match_id && !uniqueVotesMap.has(key)) {
        uniqueVotesMap.set(key, v);
      }
    });

    callback(Array.from(uniqueVotesMap.values()));
  });
}

/**
 * Subscribe to real-time match results (newest first).
 * @param {(results: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeResults(callback) {
  const q = query(collection(db, 'match_results'), orderBy('settled_at', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/**
 * Subscribe to custom (admin-added) matches.
 * @param {(matches: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeCustomMatches(callback) {
  const q = query(collection(db, 'matches'), where('is_custom', '==', true));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

/**
 * Subscribe to the dynamic list of admin users.
 * @param {(admins: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeAdmins(callback) {
  const q = query(collection(db, 'admins'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(doc => ({ id: doc.id, email: doc.data().email })));
  });
}

/**
 * Subscribe to the current user's email notification preferences.
 * @param {string} uid
 * @param {(pref: Object | null) => void} callback
 */
export function subscribePreferences(uid, callback) {
  if (!uid) return callback(null);
  const ref = doc(db, 'user_preferences', uid);
  return onSnapshot(ref, snap => {
    if (!snap.exists()) callback(null);
    else callback({ id: snap.id, ...snap.data() });
  });
}

/**
 * Subscribe to all users in the system.
 * @param {(users: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeAllUsers(callback) {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}

/**
 * Subscribe to the manual transactions ledger collection.
 * @param {(txs: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeTransactions(callback) {
  const q = query(collection(db, 'transactions'), orderBy('created_at', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}

/**
 * @param {(bets: Object[]) => void} callback
 */
export function subscribeAdhocBets(callback) {
  const q = query(collection(db, 'adhoc_bets'), orderBy('created_at', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * @param {(votes: Object[]) => void} callback
 */
export function subscribeAdhocVotes(callback) {
  return onSnapshot(collection(db, 'adhoc_votes'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * @param {(results: Object[]) => void} callback
 */
export function subscribeAdhocResults(callback) {
  const q = query(collection(db, 'adhoc_results'), orderBy('settled_at', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Append-only audit trail for adhoc picks (newest first).
 * @param {(events: Object[]) => void} callback
 */
export function subscribeAdhocPickEvents(callback) {
  const q = query(collection(db, 'adhoc_pick_events'), orderBy('created_at', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ─── MUTATIONS ───────────────────────────────────────────────────────────────

/**
 * Cast a vote for a team in a match.
 * Uses a deterministic doc ID (matchId_userId) to guarantee exactly
 * one vote document per user per match — no more duplicates.
 * @param {import('firebase/auth').User} user
 * @param {string} matchId
 * @param {string} team
 */
export async function addVote(user, matchId, team) {
  const docId = `${matchId}_${user.uid}`;
  await setDoc(doc(db, 'votes', docId), {
    user_id:     user.uid,
    user_name:   user.displayName,
    user_photo:  user.photoURL,
    match_id:    matchId,
    chosen_team: team,
    created_at:  new Date().toISOString(),
  });
  console.log(`[Vote] ${user.displayName} → ${team} (match: ${matchId})`);
}

/**
 * Remove a vote using the same deterministic doc ID.
 * @param {string} matchId
 * @param {string} userId
 */
export async function removeVote(matchId, userId) {
  if (!matchId || !userId) return;
  const docId = `${matchId}_${userId}`;
  await deleteDoc(doc(db, 'votes', docId));
  console.log(`[Vote] Unpicked for match ${matchId}`);
}


/**
 * Add a custom match to Firestore.
 * @param {{ team1: string, team2: string, day: string, month: string, hour: string, minute: string, ampm: string }} data
 */
export async function addCustomMatch({ team1, team2, day, month, hour, minute, ampm }) {
  const fixture = `${team1} vs ${team2}`;
  const date    = `${month} ${day}`;
  const time    = `${hour}:${minute} ${ampm}`;
  await addDoc(collection(db, 'matches'), {
    num: Date.now(), date, fixture,
    t1: team1, t2: team2, time,
    is_custom: true,
    created_at: new Date().toISOString(),
  });
}

/**
 * Delete a custom match from Firestore.
 * @param {string} matchId
 */
export async function deleteMatch(matchId) {
  if (confirm('Delete this match permanently?')) {
    await deleteDoc(doc(db, 'matches', matchId));
  }
}


/**
 * Bulk-upload the static IPL schedule to Firestore (admin only).
 */
export async function uploadSchedule() {
  if (!confirm('Upload all 40 matches?')) return;
  for (const m of IPL_SCHEDULE) {
    const [t1, t2] = m.fixture.split(' vs ');
    await addDoc(collection(db, 'matches'), {
      ...m, t1, t2, created_at: new Date().toISOString(),
    });
  }
  alert('Synced!');
}

/**
 * Settle a match with its winning team.
 * @param {string} matchId
 * @param {string | null} winner
 */
export async function finalizeWinner(matchId, winner, existingResultId = null) {
  if (!winner) return;
  try {
    if (existingResultId) {
      await updateDoc(doc(db, 'match_results', existingResultId), {
        winner_team: winner,
        settled_at:  new Date().toISOString(),
      });
    } else {
      await addDoc(collection(db, 'match_results'), {
        match_id:    matchId,
        winner_team: winner,
        settled_at:  new Date().toISOString(),
      });
    }
    console.log(`Successfully settled match for ${winner}`);
  } catch (e) {
    console.error("Error settling match:", e);
  }
}

/**
 * Override an existing (auto or manual) match result with a corrected winner.
 * Writes a new doc with a fresh timestamp — computeSquadStats will automatically
 * use this as the authoritative result since it picks the latest per match_id.
 *
 * @param {string} matchId
 * @param {string} winner  full team name
 */
export async function overrideMatchResult(matchId, winner) {
  await addDoc(collection(db, 'match_results'), {
    match_id:    matchId,
    winner_team: winner,
    settled_at:  new Date().toISOString(),
    override:    true,   // audit flag
  });
}

/**
 * Share the app link via Web Share API or clipboard fallback.
 */
export async function shareLink() {
  const text = 'Join ChaiBet and vote on IPL matches! 🍵🏏\n\n';
  const url  = window.location.origin;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'ChaiBet', text, url });
      return;
    } catch (_) { /* fall through */ }
  }
  navigator.clipboard.writeText(`${text} ${url}`);
  alert('App Link copied to clipboard!');
}

/**
 * Add an admin to Firestore.
 * @param {string} email
 */
export async function addAdminUser(email) {
  await addDoc(collection(db, 'admins'), {
    email,
    created_at: new Date().toISOString()
  });
}

/**
 * Remove an admin from Firestore.
 * @param {string} adminId
 */
export async function removeAdminUser(adminId) {
  await deleteDoc(doc(db, 'admins', adminId));
}

/**
 * Save or update a user's basic info to Firestore registry.
 * @param {import('firebase/auth').User} user
 */
export async function saveUserToDatabase(user) {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const now = new Date().toISOString();
  const updateData = {
    email:       user.email,
    displayName: user.displayName,
    photoURL:    user.photoURL,
    last_login:  now,
  };
  // Set joined_at only once — on first registration ever.
  // This is the authoritative "join date" for compulsory charging.
  if (!snap.exists() || !snap.data().joined_at) {
    updateData.joined_at = now;
  }
  await setDoc(userRef, updateData, { merge: true });
}

/**
 * Set the explicit email opt-out/opt-in flag for a given user.
 */
export async function setNotificationPreference(uid, userEmail, sendEmails) {
  await setDoc(doc(db, 'user_preferences', uid), {
    email: userEmail,
    sendEmails
  }, { merge: true });
}

/**
 * Add a manual transaction to the ledger (Deposit, Bonus, Withdrawal).
 * @param {string} userName
 * @param {number} amount
 * @param {string} description
 * @param {string} createdByAdmin
 */
export async function addTransaction(userName, amount, description, createdByAdmin) {
  await addDoc(collection(db, 'transactions'), {
    user_name: userName,
    amount,
    description,
    type: amount > 0 ? 'deposit' : 'withdrawal',
    created_at: new Date().toISOString(),
    created_by: createdByAdmin,
  });
}

async function appendAdhocPickEvent(betId, user, payload) {
  await addDoc(collection(db, 'adhoc_pick_events'), {
    adhoc_bet_id: betId,
    user_id: user.uid,
    user_name: user.displayName,
    created_at: new Date().toISOString(),
    ...payload,
  });
}

/**
 * @param {import('firebase/auth').User} user
 * @param {{ statement: string, optionA: string, optionB: string, stakePerHead: number, lockAtIso: string }} data
 */
export async function createAdhocBet(user, { statement, optionA, optionB, stakePerHead, lockAtIso }) {
  const stake = Number(stakePerHead);
  if (!statement?.trim() || !optionA?.trim() || !optionB?.trim()) {
    throw new Error('Statement and both options are required.');
  }
  if (optionA.trim() === optionB.trim()) {
    throw new Error('Options must be different.');
  }
  if (!Number.isFinite(stake) || stake <= 0) {
    throw new Error('Stake per head must be a positive number.');
  }
  const lock = new Date(lockAtIso);
  if (Number.isNaN(lock.getTime())) {
    throw new Error('Invalid lock time.');
  }
  await addDoc(collection(db, 'adhoc_bets'), {
    statement: statement.trim(),
    option_a: optionA.trim(),
    option_b: optionB.trim(),
    stake_per_head: stake,
    lock_at: lock.toISOString(),
    created_by_uid: user.uid,
    created_by_name: user.displayName,
    created_at: new Date().toISOString(),
  });
}

/**
 * Creator may move lock time until the bet is settled.
 */
export async function updateAdhocBetLock(betId, lockAtIso, creatorUid) {
  const ref = doc(db, 'adhoc_bets', betId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Bet not found.');
  const d = snap.data();
  if (d.created_by_uid !== creatorUid) {
    throw new Error('Only the creator can change the lock time.');
  }
  const settledSnap = await getDocs(
    query(collection(db, 'adhoc_results'), where('adhoc_bet_id', '==', betId), limit(1))
  );
  if (!settledSnap.empty) {
    throw new Error('Cannot change lock time after the bet is settled.');
  }
  const lock = new Date(lockAtIso);
  if (Number.isNaN(lock.getTime())) throw new Error('Invalid lock time.');
  await updateDoc(ref, { lock_at: lock.toISOString() });
}

/**
 * @param {import('firebase/auth').User} user
 * @param {'A'|'B'} option
 */
export async function addAdhocVote(user, betId, option) {
  if (option !== 'A' && option !== 'B') return;
  const betSnap = await getDoc(doc(db, 'adhoc_bets', betId));
  if (!betSnap.exists()) throw new Error('Bet not found.');
  const lockAt = new Date(betSnap.data().lock_at);
  if (new Date() >= lockAt) {
    throw new Error('This adhoc bet is locked.');
  }
  const docId = `${betId}_${user.uid}`;
  await setDoc(doc(db, 'adhoc_votes', docId), {
    adhoc_bet_id: betId,
    user_id: user.uid,
    user_name: user.displayName,
    user_photo: user.photoURL,
    chosen_option: option,
    created_at: new Date().toISOString(),
  });
  await appendAdhocPickEvent(betId, user, { chosen_option: option, action: 'pick' });
}

export async function removeAdhocVote(betId, user) {
  const betSnap = await getDoc(doc(db, 'adhoc_bets', betId));
  if (!betSnap.exists()) throw new Error('Bet not found.');
  const lockAt = new Date(betSnap.data().lock_at);
  if (new Date() >= lockAt) {
    throw new Error('This adhoc bet is locked.');
  }
  const docId = `${betId}_${user.uid}`;
  await deleteDoc(doc(db, 'adhoc_votes', docId));
  await appendAdhocPickEvent(betId, user, { action: 'unpick' });
}

/**
 * Admin-only on client; must be after lock_at.
 */
export async function finalizeAdhocWinner(betId, winningOption, existingResultId = null) {
  if (winningOption !== 'A' && winningOption !== 'B') return;
  const betSnap = await getDoc(doc(db, 'adhoc_bets', betId));
  if (!betSnap.exists()) throw new Error('Bet not found.');
  const lockAt = new Date(betSnap.data().lock_at);
  if (new Date() < lockAt) {
    throw new Error('Cannot settle before lock time.');
  }
  if (existingResultId) {
    await updateDoc(doc(db, 'adhoc_results', existingResultId), {
      winning_option: winningOption,
      settled_at: new Date().toISOString(),
    });
  } else {
    await addDoc(collection(db, 'adhoc_results'), {
      adhoc_bet_id: betId,
      winning_option: winningOption,
      settled_at: new Date().toISOString(),
    });
  }
}
/**
 * Delete an adhoc bet and its associated results/votes.
 */
export async function deleteAdhocBet(betId) {
  if (confirm('Delete this adhoc bet permanently?')) {
    await deleteDoc(doc(db, 'adhoc_bets', betId));
    // Implementation note: In a production app, you might want to 
    // also delete all adhoc_votes and adhoc_results associated with this ID.
    // For now, removing the bet document itself will make it disappear from the UI.
  }
}
