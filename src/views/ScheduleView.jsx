import React, { useState } from 'react';
import { isBefore, format, parse } from 'date-fns';
import { IPL_SCHEDULE, IPL_TEAMS, MONTHS, selectStyle, MISC_RESULTS } from '../models/constants';

/**
 * AddMatchModal — local sub-component, used only within ScheduleView.
 * Collects new match data from the admin and calls onAdd.
 */
function AddMatchModal({ onClose, onAdd, t }) {
  const [team1,  setTeam1]  = useState('');
  const [team2,  setTeam2]  = useState('');
  const [day,    setDay]    = useState('');
  const [month,  setMonth]  = useState('April');
  const [hour,   setHour]   = useState('7');
  const [minute, setMinute] = useState('30');
  const [ampm,   setAmpm]   = useState('PM');
  const [saving, setSaving] = useState(false);
  const [isCustomTeams, setIsCustomTeams] = useState(false);

  const handleSubmit = async () => {
    if (!team1 || !team2 || !day || team1 === team2) {
      alert('Please fill all fields and pick two different teams!');
      return;
    }
    setSaving(true);
    try {
      await onAdd({ team1, team2, day, month, hour, minute, ampm });
      onClose();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const team2Opts  = IPL_TEAMS.filter(t => t !== team1);
  const labelStyle = { fontSize: '0.72rem', fontWeight: 800, display: 'block', marginBottom: '0.35rem', letterSpacing: '0.05em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.5rem 2rem', width: '100%', maxWidth: '480px', border: '3px solid var(--border)', borderBottom: 'none', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0 }}>➕ {t('add_manual_match')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Team 1 */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.35rem' }}>
            <label style={{...labelStyle, marginBottom: 0}}>TEAM 1</label>
            <button onClick={() => { setIsCustomTeams(!isCustomTeams); setTeam1(''); setTeam2(''); }} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}>
              {isCustomTeams ? 'Pick IPL Team' : 'Type Custom Name'}
            </button>
          </div>
          {isCustomTeams ? (
            <input
              type="text"
              value={team1}
              onChange={e => setTeam1(e.target.value)}
              style={selectStyle}
              placeholder="e.g. Local Superstars..."
            />
          ) : (
            <select value={team1} onChange={e => { setTeam1(e.target.value); setTeam2(''); }} style={selectStyle}>
              <option value="">Select a team…</option>
              {IPL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Team 2 */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>TEAM 2</label>
          {isCustomTeams ? (
            <input
              type="text"
              value={team2}
              onChange={e => setTeam2(e.target.value)}
              style={selectStyle}
              placeholder="e.g. Backyard Boys..."
            />
          ) : (
            <select value={team2} onChange={e => setTeam2(e.target.value)} style={{ ...selectStyle, opacity: !team1 ? 0.5 : 1 }} disabled={!team1}>
              <option value="">Select a team…</option>
              {team2Opts.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Date row */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>DAY</label>
            <select value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
              <option value="">--</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>MONTH</label>
            <select value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1.2 }}>
            <label style={labelStyle}>YEAR</label>
            <input value="2026" disabled style={{ ...selectStyle, background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--muted)' }} />
          </div>
        </div>

        {/* Time row */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>HOUR</label>
            <select value={hour} onChange={e => setHour(e.target.value)} style={selectStyle}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>MINUTE</label>
            <select value={minute} onChange={e => setMinute(e.target.value)} style={selectStyle}>
              {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>AM / PM</label>
            <select value={ampm} onChange={e => setAmpm(e.target.value)} style={selectStyle}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {team1 && team2 && day && (
          <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
            📅 {team1} vs {team2}<br />
            <span style={{ fontWeight: 500 }}>{month} {day}, 2026 · {hour}:{minute} {ampm}</span>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', background: saving ? 'var(--muted)' : 'var(--teal)', fontSize: '0.9rem' }}
        >
          {saving ? 'Saving…' : '✅ Add Match'}
        </button>
      </div>
    </div>
  );
}

function SettleModal({ match, onClose, onConfirm, onAutoSettle, autoState, t }) {
  const busy = autoState === 'loading';

  return (
    <div className="modal-overlay fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
       <div className="glass-card" style={{ background: 'var(--card)', padding: '1.5rem', width: '90%', maxWidth: '350px' }}>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Confirm Winner 🏆</h3>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '1.5rem', opacity: 0.8 }}>Choose the winning team for:<br/><strong>{match.fixture}</strong></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <button className="btn-primary" style={{ padding: '0.6rem' }} onClick={() => onConfirm(match.teams[0])}>🏅 {match.teams[0]}</button>
             <button className="btn-primary" style={{ padding: '0.6rem' }} onClick={() => onConfirm(match.teams[1])}>🏅 {match.teams[1]}</button>
             
             <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" style={{ flex: 1, padding: '0.6rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={() => onConfirm(MISC_RESULTS.DRAW)}>🤝 Draw</button>
                <button className="btn-primary" style={{ flex: 1, padding: '0.6rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={() => onConfirm(MISC_RESULTS.CANCELLED)}>🌧️ Cancel</button>
             </div>

             <div style={{ margin: '0.5rem 0', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800 }}>— OR —</div>

             <button
               className="btn-primary"
               disabled={busy || autoState === 'done'}
               style={{
                 padding: '0.6rem',
                 background: autoState === 'loading' ? 'var(--muted)'
                           : autoState === 'done'    ? 'var(--teal)'
                           : autoState === 'not_found' ? 'var(--error)'
                           : 'var(--orange)',
                 transition: 'background 0.2s',
               }}
               onClick={async () => {
                 const ok = await onAutoSettle(match);
                 if (ok) onClose();
               }}
             >
                {busy ? t('loading') : autoState === 'done' ? t('won') : autoState === 'not_found' ? t('missed') : autoState === 'error' ? t('action_failed') : t('sync_schedule')}
              </button>

              <button className="btn-primary" style={{ background: 'transparent', color: 'var(--muted)', marginTop: '0.5rem', boxShadow: 'none' }} onClick={onClose}>{t('cancel') || 'Cancel'}</button>
           </div>
       </div>
    </div>
  )
}

export default function ScheduleView({ isAdmin, onAddMatch, allMatches, matchResults, votes = [], squadStats = {}, onSettle, onDeleteMatch, t }) {
  const [showModal, setShowModal]     = useState(false);
  const [settlingMatch, setSettlingMatch] = useState(null);
  const [autoSettling, setAutoSettling]   = useState({}); // matchId → 'loading'|'done'|'not_found'|'error'
  const now      = new Date();
  const todayStr = format(now, 'MMMM d');
  const scrollRef = React.useRef(null);

  const handleAutoSettle = async (m) => {
    setAutoSettling(s => ({ ...s, [m.id]: 'loading' }));
    try {
      const [team1, team2] = m.fixture.split(' vs ');
      const res  = await fetch('/api/scrape-result', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ team1, team2, date: m.date }),
      });
      const data = await res.json();
      if (data.winner) {
        const existingResult = matchResults.find(r => r.match_id === m.id);
        await onSettle(m.id, data.winner, existingResult?.id);
        setAutoSettling(s => ({ ...s, [m.id]: 'done' }));
        return true;
      } else {
        setAutoSettling(s => ({ ...s, [m.id]: 'not_found' }));
        return false;
      }
    } catch (err) {
      console.error(err);
      setAutoSettling(s => ({ ...s, [m.id]: 'error' }));
      return false;
    }
  };

  const autoLabel = (id) => {
    const state = autoSettling[id];
    if (state === 'loading')   return '🔍 Searching…';
    if (state === 'done')      return '✅ Settled!';
    if (state === 'not_found') return '⚠️ Not found';
    if (state === 'error')     return '❌ Error';
    return '🤖 Auto';
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0 }}>{t('schedule_title')}</h3>
        {isAdmin && (
          <button
            className="btn-primary"
            style={{ fontSize: '0.72rem', padding: '0.45rem 0.9rem', background: 'var(--teal)', whiteSpace: 'nowrap' }}
            onClick={() => setShowModal(true)}
          >
            + Add Match
          </button>
        )}
      </div>

      {showModal && (
        <AddMatchModal
          onClose={() => setShowModal(false)}
          onAdd={async (data) => { await onAddMatch(data); setShowModal(false); }}
          t={t}
        />
      )}
      {settlingMatch && (
        <SettleModal 
          match={settlingMatch} 
          autoState={autoSettling[settlingMatch.id]}
          onAutoSettle={handleAutoSettle}
          onClose={() => setSettlingMatch(null)} 
          onConfirm={(winner) => {
             const existingResult = matchResults.find(r => r.match_id === settlingMatch.id);
             onSettle(settlingMatch.id, winner, existingResult?.id);
             setSettlingMatch(null);
          }} 
          t={t}
        />
      )}

      <div className="schedule-list">
        {allMatches.map((m, index) => {
          const matchDate  = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
          const isPast     = isBefore(matchDate, now);
          const isToday    = m.date === todayStr;
          const isNextFirst = !isPast && (
            index === 0 ||
            isBefore(parse(`${allMatches[index - 1].date} 2026 ${allMatches[index - 1].time}`, 'MMMM d yyyy h:mm a', new Date()), now)
          );
          
          const result = matchResults.find(r => r.match_id === m.id);

          return (
            <div
              key={m.id}
              ref={isNextFirst ? scrollRef : null}
              className="schedule-card"
              style={{
                borderColor: isPast ? 'var(--error)' : 'var(--teal)',
                background:  isPast ? 'var(--bg)' : 'var(--card)',
                borderWidth: isToday ? '3px' : '2px',
                opacity:     isPast ? 0.7 : 1,
              }}
            >
              <div className="schedule-info">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="match-num-badge" style={{ background: isPast ? 'var(--border)' : 'var(--yellow)' }}>
                    {m.is_custom ? 'CUSTOM MATCH' : `MATCH ${m.num}`}
                  </span>
                  {isToday && (
                    <span style={{ background: 'var(--orange)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      TODAY 🔥
                    </span>
                  )}
                  {isPast ? (
                    <span style={{ color: 'var(--error)', fontSize: '0.6rem', fontWeight: 'bold' }}>● OVER</span>
                  ) : (
                    <span style={{ color: 'var(--teal)', fontSize: '0.6rem', fontWeight: 'bold' }}>
                      ● {isToday ? 'LIVE / UPCOMING' : 'UPCOMING'}
                    </span>
                  )}
                </div>
                <h5 style={{ color: isPast ? 'var(--muted)' : 'inherit', display: 'flex', alignItems: 'center' }}>
                  {m.fixture}
                  {isAdmin && m.is_custom && (
                    <button 
                      onClick={() => onDeleteMatch(m.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', marginLeft: 'auto', fontSize: '0.9rem' }}
                      title="Delete Match"
                    >
                      🗑️
                    </button>
                  )}
                </h5>
                <p>{m.date} · {m.time}</p>

                {(() => {
                  const matchVotes = votes.filter(v => v.match_id === m.id);
                  if (matchVotes.length === 0) return null;
                  
                  const teams = m.teams || m.fixture.split(' vs ');
                  const team1Pickers = matchVotes.filter(v => v.chosen_team === teams[0]);
                  const team2Pickers = matchVotes.filter(v => v.chosen_team === teams[1]);

                  const renderTeamPickers = (pickers, teamName) => {
                    if (pickers.length === 0) return null;
                    return (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6, marginBottom: '4px' }}>{teamName}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {pickers.map(v => {
                            const photo = squadStats[v.user_name]?.photo || v.user_photo;
                            return (
                              <div key={v.user_name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <img src={photo} referrerPolicy="no-referrer" alt={v.user_name} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid var(--border)' }} />
                                <span style={{ fontSize: '0.5rem', fontWeight: 700, opacity: 0.8 }}>{v.user_name.split(' ')[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed var(--border)', display: 'flex', gap: '1rem' }}>
                      {renderTeamPickers(team1Pickers, teams[0])}
                      {renderTeamPickers(team2Pickers, teams[1])}
                    </div>
                  );
                })()}
                
                {result && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      background: result.winner_team === MISC_RESULTS.CANCELLED ? 'var(--error)' : 'var(--yellow)',
                      color: result.winner_team === MISC_RESULTS.CANCELLED ? 'white' : 'inherit',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 800
                    }}>
                      {result.winner_team === MISC_RESULTS.DRAW ? '🤝 MATCH DRAWN' :
                       result.winner_team === MISC_RESULTS.CANCELLED ? '🌧️ MATCH CANCELLED' :
                       `🏆 ${result.winner_team} WON`}
                    </div>
                    {isAdmin && (
                      <button style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setSettlingMatch(m)}>
                         Change
                      </button>
                    )}
                  </div>
                )}

                {isAdmin && isPast && !result && m.teams && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '6px' }}>
                    {/* Manual settle */}
                    <button
                      className="btn-primary"
                      style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.62rem', background: 'var(--surface)', color: 'var(--text)' }}
                      onClick={() => setSettlingMatch(m)}
                    >
                      🏅 Manual
                    </button>
                    {/* Auto-settle via Playwright scraper (Vercel Serverless enabled) */}
                    <button
                      className="btn-primary"
                      disabled={autoSettling[m.id] === 'loading' || autoSettling[m.id] === 'done'}
                      style={{
                        flex: 2,
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.62rem',
                        background: autoSettling[m.id] === 'loading' ? 'var(--muted)'
                                  : autoSettling[m.id] === 'done'    ? 'var(--teal)'
                                  : autoSettling[m.id] === 'not_found' ? 'var(--error)'
                                  : 'var(--orange)',
                        transition: 'background 0.2s',
                      }}
                      onClick={() => handleAutoSettle(m)}
                    >
                      {autoLabel(m.id)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
