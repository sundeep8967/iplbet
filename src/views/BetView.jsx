import React, { useState, useEffect } from 'react';
import { isBefore, parse, subMinutes } from 'date-fns';

/**
 * MatchTimer — local sub-component, used only within BetView.
 * Shows a live countdown to match start time.
 */
function MatchTimer({ match }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now       = new Date();
      const matchTime = parse(`${match.date} 2026 ${match.time}`, 'MMMM d yyyy h:mm a', new Date());
      if (isBefore(now, matchTime)) {
        const diff = matchTime - now;
        const h    = Math.floor(diff / 3_600_000);
        const m    = Math.floor((diff % 3_600_000) / 60_000);
        const s    = Math.floor((diff % 60_000) / 1_000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft('CLOSED');
      }
    };
    update();
    const timer = setInterval(update, 1_000);
    return () => clearInterval(timer);
  }, [match]);

  return (
    <div style={{ color: timeLeft === 'CLOSED' ? 'var(--muted)' : 'var(--error)', fontWeight: 800, fontSize: '0.75rem' }}>
      {timeLeft === 'CLOSED' ? '🔒 CLOSED' : `CLOSES IN: ${timeLeft}`}
    </div>
  );
}

/** Build a deduped list of all squad members from the votes collection */
function buildSquadMembers(votes, user) {
  const map = new Map();
  votes.forEach(v => {
    if (!map.has(v.user_name)) {
      map.set(v.user_name, { name: v.user_name, photo: v.user_photo });
    }
  });
  if (user && !map.has(user.displayName)) {
    map.set(user.displayName, { name: user.displayName, photo: user.photoURL });
  }
  return Array.from(map.values());
}

/** Pinned card shown when a match is locked and in progress until settled */
function OngoingMatchCard({ match, votes, user }) {
  const matchVotes  = votes.filter(v => v.match_id === match.id);
  const squadMembers = buildSquadMembers(votes, user);

  const team1Pickers = squadMembers.filter(m => matchVotes.find(v => v.user_name === m.name && v.chosen_team === match.teams[0]));
  const team2Pickers = squadMembers.filter(m => matchVotes.find(v => v.user_name === m.name && v.chosen_team === match.teams[1]));
  const missed       = squadMembers.filter(m => !matchVotes.find(v => v.user_name === m.name));

  const pickerRow = (pickers) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', minHeight: '34px' }}>
      {pickers.length === 0
        ? <span style={{ fontSize: '0.65rem', opacity: 0.4, margin: 'auto' }}>—</span>
        : pickers.map(m => (
            <div key={m.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <img src={m.photo} referrerPolicy="no-referrer" alt={m.name}
                style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid var(--teal)' }} />
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
      boxShadow: '0 4px 24px rgba(20,184,166,0.15)'
    }}>
      {/* Header */}
      <div style={{ background: 'var(--teal)', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.07em' }}>🔴 LIVE — BETS LOCKED</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.65rem', fontWeight: 700 }}>{match.date} · {match.time}</span>
      </div>

      {/* Teams & Picks */}
      <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Team 1 */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '0.78rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>{match.teams[0]}</div>
          {pickerRow(team1Pickers)}
        </div>

        <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.25, margin: 'auto 0', paddingTop: '1rem' }}>VS</div>

        {/* Team 2 */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '0.78rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>{match.teams[1]}</div>
          {pickerRow(team2Pickers)}
        </div>
      </div>

      {/* Missed row */}
      {missed.length > 0 && (
        <div style={{ borderTop: '1.5px dashed var(--border)', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--error)', whiteSpace: 'nowrap' }}>MISSED −₹10:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {missed.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src={m.photo} referrerPolicy="no-referrer" alt={m.name}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', opacity: 0.5, filter: 'grayscale(1)' }} />
                <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.6 }}>{m.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BetView({ matches, votes, squadStats, user, handleVote, ongoingMatch }) {
  const [showAll, setShowAll] = useState(false);

  const firstDate        = matches.length > 0 ? matches[0].date : null;
  const displayedMatches = (showAll || !firstDate)
    ? matches
    : matches.filter(m => m.date === firstDate);
  const otherMatchesCount = matches.length - displayedMatches.length;

  const squadMembers = buildSquadMembers(votes, user);

  return (
    <div className="fade-in">
      {/* ONGOING MATCH — pinned at the top */}
      {ongoingMatch && (
        <OngoingMatchCard match={ongoingMatch} votes={votes} user={user} />
      )}
      <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: '16px', overflow: 'hidden', height: '140px', border: '3px solid var(--border)' }}>
        <img 
          src="/bg_poster.jpeg" 
          alt="The Ultimate Rivalry" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '0.8rem', color: 'white' }}>
           <h4 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0, textShadow: '2px 2px 0 var(--dark)' }}>NEXT DAYS PICKS 🏏</h4>
        </div>
      </div>

      <div style={{ background: 'var(--orange)', color: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.8rem', fontWeight: 800, border: '3px solid var(--dark)' }}>
        ⚠️ RULE: Everyday, ₹10 is deducted automatically, even if you don't choose! If you win, you get your share of the total pot (₹10 from every member).
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {displayedMatches.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5 }}>No matches open for betting right now. Check back tomorrow!</p>
        ) : displayedMatches.map(m => {
          const matchVotes = votes.filter(v => v.match_id === m.id);
          const myVote     = matchVotes.find(v => v.user_name === user.displayName);

          return (
            <div key={m.id} className="glass-card">
              {/* Match header */}
              <div style={{ padding: '1rem', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{m.date} · {m.time}</div>
                <MatchTimer match={m} />
              </div>

              <div className="card-body" style={{ textAlign: 'center', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>

                  {/* TEAM 1 COLUMN */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.teams[0]}
                    </div>
                    <button
                      className="btn-primary"
                      style={{ 
                        padding: '0.5rem', 
                        width: '100%', 
                        marginBottom: '1rem',
                        background: myVote?.chosen_team === m.teams[0] ? 'var(--teal)' : 'var(--surface)',
                        border: myVote?.chosen_team === m.teams[0] ? '2px solid var(--dark)' : '1px solid var(--border)',
                        color: myVote?.chosen_team === m.teams[0] ? 'white' : 'var(--text)'
                      }}
                      onClick={() => handleVote(m.id, m.teams[0])}
                    >
                      {myVote?.chosen_team === m.teams[0] ? 'PICKED ✅' : 'PICK'}
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      {squadMembers
                        .filter(member => {
                          const uv = matchVotes.find(v => v.user_name === member.name);
                          return uv && uv.chosen_team === m.teams[0];
                        })
                        .map(member => (
                          <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--card)', border: '2px solid var(--border)', borderRadius: '10px' }}>
                            <img src={member.photo} style={{ width: '20px', height: '20px', borderRadius: '50%' }} referrerPolicy="no-referrer" alt={member.name} />
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {member.name.split(' ')[0]}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.2, margin: 'auto 0px' }}>VS</div>

                  {/* TEAM 2 COLUMN */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.teams[1]}
                    </div>
                    <button
                      className="btn-primary"
                      style={{ 
                        padding: '0.5rem', 
                        width: '100%', 
                        marginBottom: '1rem',
                        background: myVote?.chosen_team === m.teams[1] ? 'var(--teal)' : 'var(--surface)',
                        border: myVote?.chosen_team === m.teams[1] ? '2px solid var(--dark)' : '1px solid var(--border)',
                        color: myVote?.chosen_team === m.teams[1] ? 'white' : 'var(--text)'
                      }}
                      onClick={() => handleVote(m.id, m.teams[1])}
                    >
                      {myVote?.chosen_team === m.teams[1] ? 'PICKED ✅' : 'PICK'}
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      {squadMembers
                        .filter(member => {
                          const uv = matchVotes.find(v => v.user_name === member.name);
                          return uv && uv.chosen_team === m.teams[1];
                        })
                        .map(member => (
                          <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--card)', border: '2px solid var(--border)', borderRadius: '10px' }}>
                            <img src={member.photo} style={{ width: '20px', height: '20px', borderRadius: '50%' }} referrerPolicy="no-referrer" alt={member.name} />
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {member.name.split(' ')[0]}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* WAITING SQUAD */}
                {(() => {
                  const waiting = squadMembers.filter(
                    member => !matchVotes.find(v => v.user_name === member.name)
                  );
                  if (waiting.length === 0) return null;
                  return (
                    <div style={{ marginTop: '1.5rem', borderTop: '2.5px dashed var(--border)', paddingTop: '1rem', textAlign: 'left' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.8rem', opacity: 0.6 }}>WAITING...</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {waiting.map(member => (
                          <div key={member.name} title={member.name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--muted)', overflow: 'hidden', opacity: 0.5 }}>
                            <img src={member.photo} style={{ width: '100%', height: '100%' }} referrerPolicy="no-referrer" alt={member.name} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && otherMatchesCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="btn-primary"
          style={{ marginTop: '1.5rem', background: 'var(--card)', color: 'var(--text)' }}
        >
          View More Upcoming Matches ({otherMatchesCount})
        </button>
      )}
    </div>
  );
}
