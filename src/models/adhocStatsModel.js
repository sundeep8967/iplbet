/**
 * Adhoc bet economics: only users who picked are in the pool.
 * Pot = participants × stake_per_head; winners split the pot equally.
 */

/**
 * @param {Object[]} adhocVotes
 * @param {Object[]} adhocResults
 * @param {Object[]} adhocBets  docs with id, stake_per_head
 * @param {Object[]} allUsers
 */
export function computeAdhocSquadStats(adhocVotes = [], adhocResults = [], adhocBets = [], allUsers = []) {
  const photoMap = {};
  allUsers.forEach(u => {
    if (u.displayName && u.photoURL) photoMap[u.displayName] = u.photoURL;
  });
  adhocVotes.forEach(v => {
    if (v.user_name && v.user_photo && !photoMap[v.user_name]) {
      photoMap[v.user_name] = v.user_photo;
    }
  });

  const stats = {};
  allUsers.forEach(u => {
    if (!u.displayName) return;
    stats[u.displayName] = {
      wins: 0,
      earnings: 0,
      spent: 0,
      won: 0,
      photo: photoMap[u.displayName] || null,
    };
  });
  adhocVotes.forEach(v => {
    if (!v.user_name) return;
    if (!stats[v.user_name]) {
      stats[v.user_name] = {
        wins: 0,
        earnings: 0,
        spent: 0,
        won: 0,
        photo: photoMap[v.user_name] || null,
      };
    }
  });

  const latestByBet = new Map();
  adhocResults.forEach(res => {
    const bid = res.adhoc_bet_id;
    const prev = latestByBet.get(bid);
    if (!prev || res.settled_at > prev.settled_at) {
      latestByBet.set(bid, res);
    }
  });

  /** @type {Record<string, Object>} */
  const adhocLogs = {};

  latestByBet.forEach((res, betId) => {
    const bet = adhocBets.find(b => b.id === betId);
    if (!bet) return;

    const stake = Number(bet.stake_per_head) || 0;
    const winnerOpt = res.winning_option;

    const mVotes = adhocVotes.filter(v => v.adhoc_bet_id === betId);
    const participants = [...new Set(mVotes.map(v => v.user_name))];
    if (participants.length === 0) return;

    const pot = participants.length * stake;
    const winners = mVotes.filter(v => v.chosen_option === winnerOpt);
    const winnersCount = winners.length;

    adhocLogs[betId] = {
      pot,
      stakePerHead: stake,
      winnersCount,
      participants,
      winning_option: winnerOpt,
      individualPayout: 0,
    };

    if (winnersCount === 0) {
      participants.forEach(name => {
        const s = stats[name];
        if (!s) return;
        s.earnings -= stake;
        s.spent += stake;
      });
      return;
    }

    const individualPayout = pot / winnersCount;
    adhocLogs[betId].individualPayout = individualPayout;

    participants.forEach(name => {
      const s = stats[name];
      if (!s) return;
      s.earnings -= stake;
      s.spent += stake;
    });

    winners.forEach(v => {
      const s = stats[v.user_name];
      if (!s) return;
      s.wins += 1;
      s.earnings += individualPayout;
      s.won += individualPayout;
    });
  });

  Object.values(stats).forEach(s => {
    s.earnings = Number(s.earnings.toFixed(2));
    s.won = Number(s.won.toFixed(2));
    s.spent = Number(s.spent.toFixed(2));
  });

  return { statsMap: stats, adhocLogs };
}

/**
 * @param {import('firebase/auth').User | null} user
 * @param {ReturnType<typeof computeAdhocSquadStats>} obj
 */
export function computeAdhocUserStats(user, obj) {
  const name = user?.displayName;
  const statsMap = obj?.statsMap || {};
  if (!name || !statsMap[name]) return { wins: 0, earnings: 0, spent: 0, won: 0 };
  return statsMap[name];
}

/**
 * Filter adhoc bets that are NOT settled yet.
 * Used for displaying active action on the Home screen.
 */
export function computeActiveAdhocBets(adhocBets, adhocResults) {
  return adhocBets.filter(bet => {
    const isSettled = adhocResults.some(r => r.adhoc_bet_id === bet.id);
    return !isSettled;
  });
}
