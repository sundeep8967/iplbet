import React, { useState } from 'react';
import { IPL_SCHEDULE } from '../models/constants';

// ── Override picker for a single settled match ────────────────────────────────
function OverrideRow({ result, onOverride }) {
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);

  const matchObj = IPL_SCHEDULE.find(m => `ipl-2025-${m.num}` === result.match_id);
  const teams    = matchObj ? matchObj.fixture.split(' vs ') : null;

  const handlePick = async (team) => {
    if (team === result.winner_team) { setOpen(false); return; }
    setSaving(true);
    try {
      await onOverride(result.match_id, team);
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', marginBottom: '2px' }}>
            {result.match_id.replace('ipl-2025-', 'Match ')}
            {result.override && (
              <span style={{ marginLeft: '6px', background: 'var(--orange)', color: 'white', fontSize: '0.55rem', padding: '1px 5px', borderRadius: '4px' }}>
                OVERRIDDEN
              </span>
            )}
            {result.auto && !result.override && (
              <span style={{ marginLeft: '6px', background: 'var(--muted)', color: 'white', fontSize: '0.55rem', padding: '1px 5px', borderRadius: '4px' }}>
                AUTO
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🏆 {result.winner_team}
          </div>
        </div>
        {teams && (
          <button
            style={{ marginLeft: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setOpen(o => !o)}
          >
            ✏️ Override
          </button>
        )}
      </div>

      {open && teams && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {teams.map(team => (
            <button
              key={team}
              disabled={saving}
              onClick={() => handlePick(team)}
              style={{
                flex: 1, padding: '6px', fontSize: '0.65rem', fontWeight: 800,
                borderRadius: '8px', border: '2px solid', cursor: 'pointer',
                borderColor: team === result.winner_team ? 'var(--teal)' : 'var(--border)',
                background:  team === result.winner_team ? 'var(--teal)' : 'var(--card)',
                color:       team === result.winner_team ? 'white' : 'var(--text)',
                opacity:     saving ? 0.5 : 1,
              }}
            >
              {team === result.winner_team ? '✅ ' : ''}{team.split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ProfileView ─────────────────────────────────────────────────────────
export default function ProfileView({
  user,
  logout,
  onSync,
  onSettle,
  onOverrideResult,
  activeMatches,
  matchResults,
  isAdmin,
  onViewHistory,
}) {
  const [autoSettling, setAutoSettling] = useState({});

  // Deduplicated latest results for the override panel
  const latestResults = (() => {
    const byMatch = new Map();
    matchResults.forEach(r => {
      const ex = byMatch.get(r.match_id);
      if (!ex || r.settled_at > ex.settled_at) byMatch.set(r.match_id, r);
    });
    return Array.from(byMatch.values())
      .sort((a, b) => b.settled_at.localeCompare(a.settled_at))
      .slice(0, 15);
  })();

  // Auto-settle a single match by calling the local settle server
  const handleAutoSettle = async (match) => {
    setAutoSettling(s => ({ ...s, [match.id]: 'loading' }));
    try {
      const [team1, team2] = match.fixture.split(' vs ');
      const res  = await fetch('/api/scrape-result', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ team1, team2, date: match.date }),
      });
      const data = await res.json();
      if (data.winner) {
        await onSettle(match.id, data.winner);
        setAutoSettling(s => ({ ...s, [match.id]: 'done' }));
      } else {
        setAutoSettling(s => ({ ...s, [match.id]: 'not_found' }));
      }
    } catch (err) {
      console.error(err);
      setAutoSettling(s => ({ ...s, [match.id]: 'error' }));
    }
  };

  const autoLabel = (id) => {
    const state = autoSettling[id];
    if (state === 'loading')   return '🔍 Searching…';
    if (state === 'done')      return '✅ Settled!';
    if (state === 'not_found') return '⚠️ Not found';
    if (state === 'error')     return '❌ Server error';
    return '🤖 Auto Settle';
  };

  return (
    <div className="fade-in" style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={user.photoURL}
          alt="profile"
          style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--orange)', marginBottom: '1rem' }}
        />
        {isAdmin && (
          <div style={{ position: 'absolute', bottom: '15px', right: '-10px', background: 'var(--teal)', color: 'white', fontSize: '0.6rem', padding: '3px 6px', borderRadius: '8px', fontWeight: 900, border: '2px solid var(--border)' }}>
            ADMIN
          </div>
        )}
      </div>

      <h3 style={{ fontFamily: "'Baloo 2', sans-serif" }}>{user.displayName}</h3>
      <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '1rem' }}>{user.email}</p>

      <button className="btn-primary" style={{ background: 'var(--teal)', marginBottom: '2rem' }} onClick={onViewHistory}>
        My Bet History 📜
      </button>

      {isAdmin && (
        <div className="glass-card fade-in" style={{ textAlign: 'left', padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--bg)' }}>
          <h4 style={{ fontFamily: "'Baloo 2', sans-serif", borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--orange)' }}>
            👑 ADMIN DASHBOARD
          </h4>

          {/* ── Settle active matches ── */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.75rem' }}>SETTLE RECENT MATCHES:</p>
            {activeMatches.length === 0 && (
              <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>No active matches to settle right now.</p>
            )}
            {activeMatches.map(m => {
              const state = autoSettling[m.id];
              const busy  = state === 'loading';
              return (
                <div key={m.id} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {/* Manual settle */}
                  <button
                    className="btn-primary"
                    style={{ flex: 2, fontSize: '0.65rem', padding: '0.5rem', background: 'var(--surface)', color: 'var(--text)' }}
                    onClick={() => onSettle(m.id, prompt(`Winner of ${m.fixture}?`))}
                  >
                    ✍️ Manual · Match {m.num}
                  </button>
                  {/* Auto settle */}
                  <button
                    className="btn-primary"
                    disabled={busy || state === 'done'}
                    style={{ flex: 3, fontSize: '0.65rem', padding: '0.5rem', background: busy ? 'var(--muted)' : 'var(--orange)', transition: 'background 0.2s' }}
                    onClick={() => handleAutoSettle(m)}
                  >
                    {autoLabel(m.id)}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Override settled results ── */}
          {latestResults.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--error)' }}>
                ✏️ OVERRIDE SETTLED RESULTS:
              </p>
              <p style={{ fontSize: '0.62rem', opacity: 0.6, marginBottom: '0.75rem' }}>
                Tap Override on any row to correct a wrong result. Stats recalculate instantly.
              </p>
              {latestResults.map(result => (
                <OverrideRow
                  key={result.match_id + result.settled_at}
                  result={result}
                  onOverride={onOverrideResult}
                />
              ))}
            </div>
          )}


        </div>
      )}

      <button className="btn-primary" onClick={logout} style={{ background: 'var(--surface)' }}>
        Log Out 👋
      </button>
    </div>
  );
}
