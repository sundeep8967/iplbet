import React from 'react';
import { parse } from 'date-fns';

export default function HistoryView({ userName, votes, matchResults, allMatches, onClose }) {
  const BET_AMOUNT = 10;

  const displayHistory = React.useMemo(() => {
    const allSettledMatches = allMatches.filter(m => matchResults.some(r => r.match_id === m.id));
    const allKnownUsers = Array.from(new Set(votes.map(vo => vo.user_name)));

    const entries = allSettledMatches.map(m => {
      const userVote = votes.find(v => v.match_id === m.id && v.user_name === userName);
      const result = matchResults.find(r => r.match_id === m.id);
      let payout = 0;
      let chosen_team = userVote ? userVote.chosen_team : 'NONE (MISSED)';

      if (result) {
        const mVotes = votes.filter(vo => vo.match_id === m.id);
        const winnersCount = mVotes.filter(vo => vo.chosen_team === result.winner_team).length;

        if (winnersCount > 0) {
          const pot = allKnownUsers.length * BET_AMOUNT;
          const isWinner = userVote && userVote.chosen_team === result.winner_team;

          if (isWinner) {
            payout = Math.floor(pot / winnersCount) - BET_AMOUNT;
          } else {
            payout = -BET_AMOUNT;
          }
        }
      }

      return {
        match_id: m.id,
        match: m,
        chosen_team,
        payout,
        isMissed: !userVote
      };
    });

    // Also include pending votes
    const pendingVotes = votes
      .filter(v => v.user_name === userName && !matchResults.some(r => r.match_id === v.match_id))
      .map(v => ({
        ...v,
        match: allMatches.find(m => m.id === v.match_id),
        payout: undefined
      }));

    return [...entries, ...pendingVotes].sort((a,b) => {
        const dateA = a.match ? parse(`${a.match.date} 2026 ${a.match.time}`, 'MMMM d yyyy h:mm a', new Date()) : 0;
        const dateB = b.match ? parse(`${b.match.date} 2026 ${b.match.time}`, 'MMMM d yyyy h:mm a', new Date()) : 0;
        return dateB - dateA;
    });
  }, [votes, userName, matchResults, allMatches]);

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif" }}>{userName}'s Analytics 📜</h3>
        <button
          onClick={onClose}
          style={{ background: 'var(--card)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {displayHistory.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: 'center' }}>No bets or settled matches yet.</p>
        ) : displayHistory.map(v => (
          <div key={`${v.match_id}-${v.isMissed}`} className="glass-card" style={{ padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: v.isMissed ? 0.7 : 1, borderStyle: v.isMissed ? 'dashed' : 'solid' }}>
             <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6 }}>{v.match?.date} · {v.match?.fixture}</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {v.chosen_team}
                  {v.isMissed && <span style={{ fontSize: '0.6rem', background: 'var(--error)', color: 'white', padding: '2px 5px', borderRadius: '4px' }}>MISSED ⚠️</span>}
                </div>
             </div>
             <div style={{ textAlign: 'right' }}>
                {v.payout === undefined ? (
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>⏳ PENDING</span>
                ) : (
                   <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: v.payout > 0 ? 'var(--teal)' : (v.payout < 0 ? 'var(--error)' : 'var(--muted)') }}>
                         {v.payout > 0 ? '🎉 WON' : (v.payout < 0 ? (v.isMissed ? '💸 AUTO-DEDUCT' : '💔 LOST') : '🤝 NO Payout')}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: v.payout > 0 ? 'var(--teal)' : (v.payout < 0 ? 'var(--error)' : 'inherit') }}>
                         {v.payout > 0 ? '+' : ''}₹{v.payout}
                      </div>
                   </div>
                )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
