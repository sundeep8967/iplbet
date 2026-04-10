import { isBefore, addDays, subMinutes, addHours } from 'date-fns';
import { IPL_SCHEDULE, BET_AMOUNT, BET_LOCK_MINUTES, MISC_RESULTS } from './constants.js';
import { parseMatchDateTimeUTC } from '../utils/utcDate.js';

/**
 * Compute the list of active (bettable) matches for the next 2 days.
 * Pure function — same inputs always produce same output.
 *
 * @param {Object[]} customMatches  - custom match docs from Firestore
 * @param {number}   _tick          - minute tick to force re-evaluation
 * @returns {Object[]} enriched match objects with `teams` array
 */
export function computeActiveMatches(customMatches, _tick) {
  const now = new Date();
  const twoDaysLater = addDays(now, 2);

  const allSources = [
    ...IPL_SCHEDULE.map(m => ({ ...m, id: `ipl-2025-${m.num}` })),
    ...customMatches,
  ];

  return allSources
    .filter(m => {
      const matchTime = parseMatchDateTimeUTC(m.date, m.time);
      const lockTime = subMinutes(matchTime, BET_LOCK_MINUTES);
      return isBefore(now, lockTime) && isBefore(matchTime, twoDaysLater);
    })
    .map(m => {
      if (!m.teams) {
        const [t1, t2] = m.fixture.split(' vs ');
        return { ...m, teams: [t1, t2] };
      }
      return m;
    });
}

/**
 * Identify the currently ongoing match.
 * A match shows from the moment bets lock (31 mins prior to start)
 * until the match is settled in Firestore (or 5 hrs as a fallback).
 *
 * @param {Object[]} customMatches
 * @param {Object[]} matchResults  - settled results from Firestore
 * @param {number}   _tick
 */
export function computeOngoingMatches(customMatches, matchResults, _tick) {
  const now = new Date();

  const allSources = [
    ...IPL_SCHEDULE.map(m => ({ ...m, id: `ipl-2025-${m.num}` })),
    ...customMatches,
  ];

  return allSources.filter(m => {
    const matchTime = parseMatchDateTimeUTC(m.date, m.time);
    const lockTime = subMinutes(matchTime, BET_LOCK_MINUTES);
    const fallbackEnd = addHours(matchTime, 5); // safety fallback

    // Bets must be locked (past lockTime) and match must not be settled yet
    const isLocked = now >= lockTime;
    const isSettled = matchResults.some(r => r.match_id === m.id);
    const withinFallback = now <= fallbackEnd;

    return isLocked && !isSettled && withinFallback;
  }).map(m => {
    if (!m.teams) {
      const [t1, t2] = m.fixture.split(' vs ');
      return { ...m, teams: [t1, t2] };
    }
    return m;
  });
}

/**
 * Compute per-user wins and earnings from votes and settled results.
 * Pure function — no side effects.
 *
 * COMPULSORY RULE:
 *   - Every user who joined BEFORE a match settles is charged ₹10,
 *     regardless of whether they voted on that match.
 *   - Users who joined AFTER a match settled are NOT charged for it.
 *
 * @param {Object[]} votes
 * @param {Object[]} matchResults
 * @param {Object[]} allUsers  - registered users from Firestore (may have joined_at)
 * @returns {{ statsMap: Object, matchLogs: Object }}
 */
export function computeSquadStats(votes = [], matchResults = [], allUsers = [], transactions = []) {

  // ── Step 1: Build clean lookup maps ────────────────────────────────────────

  // joined_at from Firestore users collection (set once on first login).
  // Only populated once saveUserToDatabase starts writing this field.
  const joinedAtMap = {};   // displayName → ISO string
  const photoMap    = {};   // displayName → photoURL

  allUsers.forEach(u => {
    if (!u.displayName) return;
    if (u.joined_at)  joinedAtMap[u.displayName] = u.joined_at;
    if (u.photoURL)   photoMap[u.displayName]    = u.photoURL;
  });

  // Earliest vote timestamp per user — reliable fallback for existing users
  // who don't have joined_at in Firestore yet.
  const firstVoteMap = {};  // displayName → ISO string

  votes.forEach(v => {
    if (!v.user_name || !v.created_at) return;
    if (!firstVoteMap[v.user_name] || v.created_at < firstVoteMap[v.user_name]) {
      firstVoteMap[v.user_name] = v.created_at;
    }
    if (!photoMap[v.user_name] && v.user_photo) {
      photoMap[v.user_name] = v.user_photo;
    }
  });

  // Effective join date: Earliest of Firestore joined_at OR earliest vote (fallback).
  // We use the earliest because existing users might have just received a recent 'joined_at' 
  // on their next login, but they have older vote records proving they joined earlier.
  const getJoinDate = name => {
    const d1 = joinedAtMap[name] ? new Date(joinedAtMap[name]).getTime() : Infinity;
    const d2 = firstVoteMap[name] ? new Date(firstVoteMap[name]).getTime() : Infinity;
    const earliest = Math.min(d1, d2);
    return earliest === Infinity ? null : earliest;
  };

  // ── Step 2: Seed stats for ALL known users ─────────────────────────────────

  const stats = {};

  // All registered users (even those who haven't voted yet).
  allUsers.forEach(u => {
    if (!u.displayName) return;
    stats[u.displayName] = { wins: 0, earnings: 0, spent: 0, won: 0, photo: photoMap[u.displayName] || null };
  });

  // Any voter not yet in allUsers snapshot (edge case).
  votes.forEach(v => {
    if (!stats[v.user_name]) {
      stats[v.user_name] = { wins: 0, earnings: 0, spent: 0, won: 0, photo: photoMap[v.user_name] || null };
    }
  });

  // ── Step 3: Deduplicate match results ──────────────────────────────────────

  const latestByMatch = new Map();
  matchResults.forEach(res => {
    const existing = latestByMatch.get(res.match_id);
    if (!existing || res.settled_at > existing.settled_at) {
      latestByMatch.set(res.match_id, res);
    }
  });

  // ── Step 4: Apply compulsory charges and distribute winnings ───────────────

  const matchLogs = {}; // Stores EXACT math for each match to sync with HistoryView

  latestByMatch.forEach(res => {
    const { match_id: matchId, winner_team: winner } = res;

    // Skip DRAW / CANCELLED matches.
    if (Object.values(MISC_RESULTS).includes(winner)) return;

    const mVotes      = votes.filter(v => v.match_id === matchId);
    const settledTime = new Date(res.settled_at).getTime();

    // Everyone who joined before this match was settled → charged ₹10.
    const activeMembers = Object.keys(stats).filter(name => {
      const joinTimestamp = getJoinDate(name);
      return joinTimestamp && joinTimestamp <= settledTime;
    });

    if (activeMembers.length === 0) return;

    const winnersCount = mVotes.filter(v => v.chosen_team === winner).length;

    const pot              = activeMembers.length * BET_AMOUNT;
    const individualPayout = winnersCount > 0 ? (pot / winnersCount) : 0;

    // Log the exact math for this match
    matchLogs[matchId] = {
      pot,
      winnersCount,
      individualPayout,
      winner,
      activeMembers
    };

    if (winnersCount === 0) return;

    // Deduct ₹10 from every active member (compulsory).
    activeMembers.forEach(name => {
      stats[name].earnings -= BET_AMOUNT;
      stats[name].spent    += BET_AMOUNT;
    });

    // Distribute the exact individualPayout among match winners
    mVotes.forEach(v => {
      if (v.chosen_team === winner && stats[v.user_name]) {
        stats[v.user_name].wins     += 1;
        stats[v.user_name].earnings += individualPayout;
        stats[v.user_name].won      += individualPayout;
      }
    });
  });

  // ── Step 5: Append manual transactions (deposits/bonuses/withdrawals) ───────
  
  transactions.forEach(tx => {
    const userStats = stats[tx.user_name];
    if (userStats) {
      if (tx.amount > 0) {
        userStats.earnings += tx.amount;
        userStats.won += tx.amount; // Treating positive adjustments as 'won' / added value
      } else {
        userStats.earnings += tx.amount;
        userStats.spent += Math.abs(tx.amount); // Treating negative as spent/withdrawn
      }
    }
  });

  // ── Step 6: Round all monetary values ─────────────────────────────────────

  Object.values(stats).forEach(s => {
    s.earnings = Number(s.earnings.toFixed(2));
    s.won      = Number(s.won.toFixed(2));
    s.spent    = Number(s.spent.toFixed(2));
  });

  return { statsMap: stats, matchLogs };
}



/**
 * Extract a single user's stats from the full squad stats map.
 *
 * @param {import('firebase/auth').User | null} user
 * @param {ReturnType<typeof computeSquadStats>} squadStats
 * @returns {{ wins: number, earnings: number }}
 */
export function computeUserStats(user, squadStatsObj) {
  const name = user?.displayName;
  const statsMap = squadStatsObj?.statsMap || {};
  if (!name || !statsMap[name]) return { wins: 0, earnings: 0, spent: 0, won: 0 };
  return statsMap[name];
}
