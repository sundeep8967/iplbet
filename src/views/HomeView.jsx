import React from 'react';
import { Share2 } from 'lucide-react';
import { parse } from 'date-fns';

export default function HomeView({ user, stats, onShare, votes, matchResults, allMatches }) {
  const BET_AMOUNT = 10;
  
  const myVotes = React.useMemo(() => {
    if (!user) return [];
    
    const allSettledMatches = allMatches.filter(m => {
      const isSettled = matchResults.some(r => r.match_id === m.id);
      const isActivelyBetOn = votes.some(v => v.match_id === m.id);
      return isSettled && isActivelyBetOn;
    });
    const allKnownUsers = Array.from(new Set(votes.map(vo => vo.user_name)));

    // Create a list of entries for this user: either their vote or a 'missed match' entry
    const entries = allSettledMatches.map(m => {
      const userVote = votes.find(v => v.match_id === m.id && v.user_name === user.displayName);
      const result   = matchResults.find(r => r.match_id === m.id);
      let payout     = 0;
      let chosen_team = userVote ? userVote.chosen_team : 'NONE (MISSED)';

      if (result) {
        const mVotes = votes.filter(vo => vo.match_id === m.id);
        const winnersCount = mVotes.filter(vo => vo.chosen_team === result.winner_team).length;

        if (winnersCount > 0) {
          const pot = allKnownUsers.length * BET_AMOUNT;
          const isWinner = userVote && userVote.chosen_team === result.winner_team;

          if (isWinner) {
            payout = (pot / winnersCount) - BET_AMOUNT;
          } else {
            payout = -BET_AMOUNT;
          }
        } else {
          payout = 0; // No one won, so no money is taken from anyone.
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
      .filter(v => v.user_name === user.displayName && !matchResults.some(r => r.match_id === v.match_id))
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
  }, [votes, user, matchResults, allMatches]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif" }}>ChaiBet Global 🏏</h2>
        <button
          onClick={onShare}
          style={{ background: 'var(--yellow)', border: '2px solid var(--dark)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 var(--dark)' }}
        >
          <Share2 size={18} />
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0', background: 'var(--yellow)', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <img 
          src="/squad_photo.png" 
          alt="The Squad" 
          style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} 
        />
        <div style={{ padding: '1rem' }}>
          <h4 style={{ fontWeight: 800, margin: 0 }}>LIVE HOT TAKES 🔥</h4>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem', marginBottom: 0 }}>Pick your winners and climb the global leaderboard!</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>💰</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Profits</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: stats.earnings >= 0 ? 'var(--teal)' : 'var(--error)' }}>
            ₹{stats.earnings.toFixed(2)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>🏆</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Wins</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{stats.wins}</div>
        </div>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>📈</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Total Won</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--teal)' }}>₹{(stats.won || 0).toFixed(2)}</div>
        </div>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>📉</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Total Paid</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--error)' }}>₹{(stats.spent || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="glass-card fade-in" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
         <h4 style={{ fontFamily: "'Baloo 2', sans-serif", borderBottom: '2.5px dashed var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
           MY BETS 📜
         </h4>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           {myVotes.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No bets placed yet.</p>}
            {myVotes.map(v => (
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
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: v.payout > 0 ? 'var(--teal)' : 'var(--error)' }}>
                             {v.payout > 0 ? '🎉 WON' : (v.isMissed ? '💸 AUTO-DEDUCT' : '💔 LOST')}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: v.payout > 0 ? 'var(--teal)' : 'var(--error)' }}>
                             {v.payout > 0 ? '+' : ''}₹{v.payout.toFixed(2)}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
