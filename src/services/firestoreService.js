import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot,
  query, orderBy, where, updateDoc, doc, deleteDoc, setDoc
} from 'firebase/firestore';
import { IPL_SCHEDULE } from '../models/constants';

// ─── SUBSCRIPTIONS ──────────────────────────────────────────────────────────

/**
 * Subscribe to real-time votes (newest first).
 * @param {(votes: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeVotes(callback) {
  const q = query(collection(db, 'votes'), orderBy('created_at', 'desc'));
  return onSnapshot(q, snap => {
    const allVotes = snap.docs.map(doc => doc.data());
    const uniqueVotesMap = new Map();
    allVotes.forEach(v => {
       const key = `${v.user_name}_${v.match_id}`;
       if (!uniqueVotesMap.has(key)) {
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

// ─── MUTATIONS ───────────────────────────────────────────────────────────────

/**
 * Cast a vote for a team in a match.
 * @param {import('firebase/auth').User} user
 * @param {string} matchId
 * @param {string} team
 */
export async function addVote(user, matchId, team) {
  await addDoc(collection(db, 'votes'), {
    user_id:      user.uid,
    user_name:    user.displayName,
    user_photo:   user.photoURL,
    match_id:     matchId,
    chosen_team:  team,
    created_at:   new Date().toISOString(),
  });
  console.log(`Voted successfully for ${team}!`);
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
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    last_login: new Date().toISOString()
  }, { merge: true });
}
