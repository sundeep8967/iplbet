import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot,
  query, orderBy, where,
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
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
}

/**
 * Subscribe to real-time match results (newest first).
 * @param {(results: Object[]) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeResults(callback) {
  const q = query(collection(db, 'match_results'), orderBy('settled_at', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())));
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
export async function finalizeWinner(matchId, winner) {
  if (!winner || !confirm(`Settle ${winner}?`)) return;
  await addDoc(collection(db, 'match_results'), {
    match_id:    matchId,
    winner_team: winner,
    settled_at:  new Date().toISOString(),
  });
  alert('Settled!');
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
