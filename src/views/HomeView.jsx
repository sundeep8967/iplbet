import React from 'react';
import { Share2 } from 'lucide-react';
import { parseMatchDateTimeUTC } from '../utils/utcDate';

// Reuse the same locked-picks card shown in BetView
function OngoingMatchCardCompact({ match, votes, user, t }) {
  // Build squad from votes
  const map = new Map();
  votes.forEach(v => { if (!map.has(v.user_name)) map.set(v.user_name, { name: v.user_name, photo: v.user_photo }); });
  if (user && !map.has(user.displayName)) map.set(user.displayName, { name: user.displayName, photo: user.photoURL });
  const squadMembers = Array.from(map.values());

  const matchVotes   = votes.filter(v => v.match_id === match.id);
  const team1Pickers = squadMembers.filter(m => matchVotes.find(v => v.user_name === m.name && v.chosen_team === match.teams[0]));
  const team2Pickers = squadMembers.filter(m => matchVotes.find(v => v.user_name === m.name && v.chosen_team === match.teams[1]));
  const missed       = squadMembers.filter(m => !matchVotes.find(v => v.user_name === m.name));

  const pickerRow = (pickers) => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '36px' }}>
      {pickers.length === 0
        ? <span style={{ fontSize: '0.65rem', opacity: 0.35, margin: 'auto' }}>—</span>
        : pickers.map(m => (
            <div key={m.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <img src={m.photo} referrerPolicy="no-referrer" alt={m.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid var(--teal)' }} />
              <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>{m.name.split(' ')[0]}</span>
            </div>
          ))
      }
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--card), var(--surface))',
      border: '2.5px solid var(--teal)',
      borderRadius: '18px',
      overflow: 'hidden',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 24px rgba(20,184,166,0.18)'
    }}>
      <div style={{ background: 'var(--teal)', padding: '0.55rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.07em' }}>🔴 {t('live_bets_locked')}</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.62rem' }}>{match.date} · {match.time}</span>
      </div>
      <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{match.teams[0]}</div>
          {pickerRow(team1Pickers)}
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.2, margin: 'auto 0', paddingTop: '1rem' }}>VS</div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.5rem' }}>{match.teams[1]}</div>
          {pickerRow(team2Pickers)}
        </div>
      </div>
      {missed.length > 0 && (
        <div style={{ borderTop: '1.5px dashed var(--border)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--error)', whiteSpace: 'nowrap' }}>{t('auto_deduct')} −₹10:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {missed.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src={m.photo} referrerPolicy="no-referrer" alt={m.name}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', opacity: 0.45, filter: 'grayscale(1)' }} />
                <span style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.6 }}>{m.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeView({ user, stats, onShare, votes, matchResults, allMatches, ongoingMatches, matchLogs, t }) {
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
      let status     = 'pending';
      let chosen_team = userVote ? userVote.chosen_team : 'NONE (MISSED)';

      if (result) {
        // Is it DRAW / CANCELLED?
        if (Object.values({ DRAW: 'DRAW', CANCELLED: 'CANCELLED' }).includes(result.winner_team)) {
          status = 'cancelled';
          payout = 0;
        } else {
          const log = matchLogs?.[m.id];
          if (log) {
            const wasActive = log.activeMembers.includes(user.displayName);
            
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
      .filter(v => v.user_name === user.displayName && !matchResults.some(r => r.match_id === v.match_id))
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
  }, [votes, user, matchResults, allMatches]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif" }}>{t('login_title')}</h2>
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
          <h4 style={{ fontWeight: 800, margin: 0 }}>{t('live_hot_takes')}</h4>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem', marginBottom: 0 }}>{t('login_desc')}</p>
        </div>
      </div>

      {/* ONGOING MATCH card — visible between header and stats once bets lock */}
      {/* Ongoing Matches (Locked/Live) */}
      {ongoingMatches.map(m => (
        <OngoingMatchCardCompact key={m.id} match={m} votes={votes} user={user} t={t} />
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>💰</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('profits')}</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: stats.earnings >= 0 ? 'var(--teal)' : 'var(--error)' }}>
            ₹{stats.earnings.toFixed(2)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>🏆</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('wins')}</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{stats.wins}</div>
        </div>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>📈</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('total_won')}</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--teal)' }}>₹{(stats.won || 0).toFixed(2)}</div>
        </div>
        <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--surface)' }}>
          <div style={{ fontSize: '1.2rem' }}>📉</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{t('total_paid')}</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--error)' }}>₹{(stats.spent || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="glass-card fade-in" style={{ padding: '1.5rem', background: 'var(--surface)' }}>
         <h4 style={{ fontFamily: "'Baloo 2', sans-serif", borderBottom: '2.5px dashed var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
           {t('my_bets')}
         </h4>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           {myVotes.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('no_bets')}</p>}
            {myVotes.map(v => (
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
    </div>
  );
}
