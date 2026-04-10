import React from 'react';
import { MISC_RESULTS, BET_AMOUNT } from '../models/constants';
import { parseMatchDateTimeUTC } from '../utils/utcDate';

export default function HistoryView({ userName, votes, matchResults, allMatches, matchLogs, onClose, t }) {

  const displayHistory = React.useMemo(() => {
    const allSettledMatches = allMatches.filter(m => matchResults.some(r => r.match_id === m.id));

    const entries = allSettledMatches.map(m => {
      const userVote = votes.find(v => v.match_id === m.id && v.user_name === userName);
      const result = matchResults.find(r => r.match_id === m.id);
      let payout = 0;
      let status = 'pending';
      let chosen_team = userVote ? userVote.chosen_team : 'NONE (MISSED)';

      if (result) {
        // Is it DRAW / CANCELLED?
        if (Object.values(MISC_RESULTS).includes(result.winner_team)) {
          status = 'cancelled';
          payout = 0;
        } else {
          const log = matchLogs?.[m.id];
          if (log) {
            const wasActive = log.activeMembers.includes(userName);
            
            if (!wasActive) {
              status = 'not_joined';
              payout = 0;
            } else if (log.winnersCount === 0) {
              status = 'no_winners';
              payout = 0;
            } else {
              const isWinner = userVote && userVote.chosen_team === log.winner;
              if (isWinner) {
                payout = log.individualPayout - BET_AMOUNT;
                status = 'won';
              } else {
                payout = -BET_AMOUNT;
                status = 'lost';
              }
            }
          }
        }
      }

      return {
        match_id: m.id,
        match: m,
        chosen_team,
        payout,
        status,
        isMissed: !userVote
      };
    });

    // Also include pending votes
    const pendingVotes = votes
      .filter(v => v.user_name === userName && !matchResults.some(r => r.match_id === v.match_id))
      .map(v => ({
        ...v,
        match: allMatches.find(m => m.id === v.match_id),
        payout: undefined,
        status: 'pending'
      }));

    return [...entries, ...pendingVotes].sort((a,b) => {
        const dateA = a.match ? parseMatchDateTimeUTC(a.match.date, a.match.time) : 0;
        const dateB = b.match ? parseMatchDateTimeUTC(b.match.date, b.match.time) : 0;
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
          <p style={{ opacity: 0.5, textAlign: 'center' }}>{t('no_bets_yet')}</p>
        ) : displayHistory.map(v => (
          <div key={`${v.match_id}-${v.isMissed}`} className="glass-card" style={{ padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: v.isMissed ? 0.7 : 1, borderStyle: v.isMissed ? 'dashed' : 'solid' }}>
             <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6 }}>{v.match?.date} · {v.match?.fixture}</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {v.chosen_team}
                  {v.isMissed && <span style={{ fontSize: '0.6rem', background: 'var(--error)', color: 'white', padding: '2px 5px', borderRadius: '4px' }}>{t('missed')} ⚠️</span>}
                </div>
             </div>
             <div style={{ textAlign: 'right' }}>
                {v.status === 'pending' ? (
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>⏳ {t('pending')}</span>
                ) : v.status === 'not_joined' ? (
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', opacity: 0.6 }}>Not Joined Yet</span>
                ) : v.status === 'no_winners' ? (
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>No Winners (Refunded)</span>
                ) : v.status === 'cancelled' ? (
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>Cancelled</span>
                ) : (
                   <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: v.payout > 0 ? 'var(--teal)' : 'var(--error)' }}>
                         {v.payout > 0 ? t('won') : (v.isMissed ? t('auto_deduct') : t('lost'))}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: v.payout > 0 ? 'var(--teal)' : 'var(--error)' }}>
                         {v.payout > 0 ? '+' : ''}₹{Number(v.payout).toFixed(2)}
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
