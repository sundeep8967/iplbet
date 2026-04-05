import { isBefore, addDays, parse } from 'date-fns';
import { IPL_SCHEDULE, BET_AMOUNT } from './constants';

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
      const matchTime = parse(
        `${m.date} 2026 ${m.time}`,
        'MMMM d yyyy h:mm a',
        new Date()
      );
      return isBefore(now, matchTime) && isBefore(matchTime, twoDaysLater);
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
 * Compute per-user wins and earnings from votes and settled results.
 * Pure function — no side effects.
 *
 * @param {Object[]} votes
 * @param {Object[]} matchResults
 * @returns {{ [userName: string]: { wins: number, earnings: number, photo: string } }}
 */
export function computeSquadStats(votes, matchResults) {
  const stats = {};

  // Seed all users who have ever voted
  votes.forEach(v => {
    if (!stats[v.user_name]) {
      stats[v.user_name] = { wins: 0, earnings: 0, photo: v.user_photo, spent: 0, won: 0 };
    }
  });

  // Deduplicate: if a match was overridden, only use the latest result
  const latestByMatch = new Map();
  matchResults.forEach(res => {
    const existing = latestByMatch.get(res.match_id);
    if (!existing || res.settled_at > existing.settled_at) {
      latestByMatch.set(res.match_id, res);
    }
  });

  latestByMatch.forEach(res => {
    const { match_id: matchId, winner_team: winner } = res;
    const mVotes = votes.filter(v => v.match_id === matchId);
    
    const allMembers = Object.keys(stats);
    if (allMembers.length === 0) return;

    const winnersCount = mVotes.filter(v => v.chosen_team === winner).length;

    if (winnersCount > 0) {
      // Automatically cash in 10rs from EVERY known member ONLY if someone won!
      allMembers.forEach(userName => {
        stats[userName].earnings -= BET_AMOUNT;
        stats[userName].spent += BET_AMOUNT;
      });

      const pot = allMembers.length * BET_AMOUNT;
      const individualPayout = pot / winnersCount;
      mVotes.forEach(v => {
        if (v.chosen_team === winner) {
          stats[v.user_name].wins += 1;
          // Add the equal division back to the winner (they already paid the 10rs fee above)
          stats[v.user_name].earnings += individualPayout;
          stats[v.user_name].won += individualPayout;
        }
      });
    }
  });

  // Format all monetary values to 2 decimal places properly
  Object.values(stats).forEach(s => {
    s.earnings = Number(s.earnings.toFixed(2));
    s.won = Number(s.won.toFixed(2));
    s.spent = Number(s.spent.toFixed(2));
  });

  return stats;
}

/**
 * Extract a single user's stats from the full squad stats map.
 *
 * @param {import('firebase/auth').User | null} user
 * @param {ReturnType<typeof computeSquadStats>} squadStats
 * @returns {{ wins: number, earnings: number }}
 */
export function computeUserStats(user, squadStats) {
  const name = user?.displayName;
  if (!name || !squadStats[name]) return { wins: 0, earnings: 0, spent: 0, won: 0 };
  return squadStats[name];
}
