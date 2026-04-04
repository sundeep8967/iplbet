import React from 'react';
import { Share2 } from 'lucide-react';

export default function HomeView({ user, stats, onShare, votes, matchResults, allMatches }) {
  const BET_AMOUNT = 10;
  
  const myVotes = React.useMemo(() => {
    if (!user || !votes.length) return [];
    return votes.filter(v => v.user_name === user.displayName).map(v => {
      const match = allMatches.find(m => m.id === v.match_id);
      const result = matchResults.find(r => r.match_id === v.match_id);
      let payout = undefined;
      
      if (result) {
        const mVotes = votes.filter(vo => vo.match_id === v.match_id);
        const pot = mVotes.length * BET_AMOUNT;
        const winnersCount = mVotes.filter(vo => vo.chosen_team === result.winner_team).length;
        
        if (winnersCount > 0 && winnersCount < mVotes.length) {
          if (v.chosen_team === result.winner_team) {
            payout = Math.floor(pot / winnersCount) - BET_AMOUNT;
          } else {
            payout = -BET_AMOUNT;
          }
        } else {
          payout = 0; // everyone won or lost together, no payout
        }
      }
      return { ...v, match, payout };
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

      <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--yellow)', marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 800 }}>LIVE HOT TAKES 🔥</h4>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pick your winners and climb the global leaderboard!</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>💰</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>PROFITS</div>
          <div style={{ fontWeight: 800, color: stats.earnings >= 0 ? 'var(--teal)' : 'var(--error)' }}>
            ₹{stats.earnings}
          </div>
        </div>
        <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>🏆</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>TOTAL WINS</div>
          <div style={{ fontWeight: 800 }}>{stats.wins}</div>
        </div>
      </div>

      <div className="glass-card fade-in" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
         <h4 style={{ fontFamily: "'Baloo 2', sans-serif", borderBottom: '2.5px dashed var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
           MY BETS 📜
         </h4>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           {myVotes.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No bets placed yet.</p>}
           {myVotes.map(v => (
              <div key={v.match_id} className="glass-card" style={{ padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6 }}>{v.match?.date} · {v.match?.fixture}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{v.chosen_team}</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    {v.payout === undefined ? (
                       <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>⏳ PENDING</span>
                    ) : (
                       <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: v.payout > 0 ? 'var(--teal)' : 'var(--error)' }}>
                             {v.payout > 0 ? '🎉 WON' : '💔 LOST'}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                             {v.payout > 0 ? '+' : ''}₹{v.payout}
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
