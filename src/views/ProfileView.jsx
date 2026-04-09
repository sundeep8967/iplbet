import React, { useState, useEffect } from 'react';
import { IPL_SCHEDULE, TEAM_ACRONYMS } from '../models/constants';
import { subscribePreferences, setNotificationPreference } from '../services/firestoreService';

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
              {team === result.winner_team ? '✅ ' : ''}{TEAM_ACRONYMS[team] || team.split(' ').pop()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ProfileView ─────────────────────────────────────────────────────────
export default function ProfileView({ 
  user, logout, onSync, onSettle, onOverrideResult, 
  activeMatches, matchResults, isAdmin, 
  adminList, allUsers, transactions, onAddAdmin, onRemoveAdmin, onAddTransaction,
  onViewHistory, t, language, onLanguageChange 
}) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [manualSettleId, setManualSettleId] = useState(null);
  const [manualWinner, setManualWinner] = useState('');
  const [autoSettling, setAutoSettling] = useState({});

  // Ledger state
  const [ledgerUser, setLedgerUser] = useState('');
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerDesc, setLedgerDesc] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribePreferences(user.uid, (pref) => {
      // Default to true if no preference exists
      setEmailEnabled(pref ? pref.sendEmails : true);
    });
    return () => unsub();
  }, [user]);

  const toggleEmailPreference = async () => {
    if (!user) return;
    const newState = !emailEnabled;
    setEmailEnabled(newState);
    await setNotificationPreference(user.uid, user.email, newState);
  };

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

      <button className="btn-primary" style={{ background: 'var(--teal)', marginBottom: '1.5rem' }} onClick={onViewHistory}>
        {t('my_bets')} 📜
      </button>

      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{t('language')} 🌍</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['en', 'te', 'kn'].map(langKey => (
            <button 
              key={langKey}
              onClick={() => onLanguageChange(langKey)}
              style={{
                flex: 1, padding: '10px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer',
                border: language === langKey ? '2px solid var(--teal)' : '1px solid var(--border)',
                background: language === langKey ? 'rgba(20,184,166,0.1)' : 'var(--bg)',
                color: language === langKey ? 'var(--teal)' : 'var(--text)'
              }}
            >
              {langKey === 'te' ? t('telugu') : langKey === 'kn' ? t('kannada') : t('english')}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Email Alerts 🔔</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Reminders 30m before match</div>
        </div>
        <button 
          onClick={toggleEmailPreference}
          style={{
            background: emailEnabled ? 'var(--teal)' : 'var(--bg)',
            border: '2px solid var(--border)',
            borderRadius: '20px',
            width: '46px',
            height: '24px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '2px',
            left: emailEnabled ? '24px' : '2px',
            width: '16px',
            height: '16px',
            background: 'white',
            borderRadius: '50%',
            transition: 'left 0.2s',
            boxShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }} />
        </button>
      </div>

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
              const isSettlingManual = manualSettleId === m.id;
              const teams = m.fixture.split(' vs ');

              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', background: 'var(--surface)', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>Match {m.num}: {teams.map(t => TEAM_ACRONYMS[t] || t.split(' ').pop()).join(' v ')}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Manual settle mode or normal mode */}
                    {!isSettlingManual ? (
                      <>
                        <button
                          className="btn-primary"
                          style={{ flex: 1, fontSize: '0.65rem', padding: '0.5rem', background: 'var(--bg)', color: 'var(--text)' }}
                          onClick={() => setManualSettleId(m.id)}
                        >
                          ✍️ Manual Settle
                        </button>
                        <button
                          className="btn-primary"
                          disabled={busy || state === 'done'}
                          style={{ flex: 1, fontSize: '0.65rem', padding: '0.5rem', background: busy ? 'var(--muted)' : 'var(--orange)', transition: 'background 0.2s' }}
                          onClick={() => handleAutoSettle(m)}
                        >
                          {autoLabel(m.id)}
                        </button>
                      </>
                    ) : (
                      <div style={{ width: '100%' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--muted)', marginBottom: '0.6rem' }}>CHOOSE WINNER:</p>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          {teams.map(t => (
                            <button
                              key={t}
                              className="btn-primary"
                              style={{ 
                                flex: 1, 
                                fontSize: '0.65rem', 
                                padding: '0.5rem', 
                                background: manualWinner === t ? 'var(--teal)' : 'var(--card)',
                                border: manualWinner === t ? '2px solid var(--dark)' : '1px solid var(--border)'
                              }}
                              onClick={() => setManualWinner(t)}
                            >
                              {TEAM_ACRONYMS[t] || t}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-primary"
                            disabled={!manualWinner}
                            style={{ flex: 2, fontSize: '0.65rem', padding: '0.55rem', background: 'var(--teal)' }}
                            onClick={async () => {
                              await onSettle(m.id, manualWinner);
                              setManualSettleId(null);
                              setManualWinner('');
                            }}
                          >
                            CONFIRM ✅
                          </button>
                          <button
                            className="btn-primary"
                            style={{ flex: 1, fontSize: '0.65rem', padding: '0.55rem', background: 'var(--error)' }}
                            onClick={() => { setManualSettleId(null); setManualWinner(''); }}
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Ledger Management (Deposits & Withdrawals) ── */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px dashed var(--border)', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>🏦 WALLET LEDGER:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem', background: 'var(--surface)', padding: '1rem', borderRadius: '12px' }}>
              <select
                value={ledgerUser}
                onChange={e => setLedgerUser(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.75rem' }}
              >
                <option value="" disabled>Select User...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.displayName}>{u.displayName}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  placeholder="Amount (e.g. 500 or -50)" 
                  value={ledgerAmount} 
                  onChange={e => setLedgerAmount(e.target.value)} 
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.75rem' }} 
                />
                <input 
                  type="text" 
                  placeholder="Reason..." 
                  value={ledgerDesc} 
                  onChange={e => setLedgerDesc(e.target.value)} 
                  style={{ flex: 2, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.75rem' }} 
                />
              </div>
              <button
                className="btn-primary"
                style={{ background: 'var(--orange)', fontSize: '0.75rem', marginTop: '0.5rem' }}
                onClick={() => {
                  if (ledgerUser && ledgerAmount && ledgerDesc) {
                    onAddTransaction(ledgerUser, parseFloat(ledgerAmount), ledgerDesc, user.email);
                    setLedgerUser('');
                    setLedgerAmount('');
                    setLedgerDesc('');
                  }
                }}
              >
                Add Transaction ➕
              </button>
            </div>
            {/* Show last 5 transactions */}
            {transactions && transactions.length > 0 && (
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {[...transactions].reverse().slice(0, 5).map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800 }}>{tx.user_name}</div>
                      <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>{tx.description}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: tx.amount > 0 ? 'var(--teal)' : 'var(--error)' }}>
                      {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Admin Management ── */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px dashed var(--border)', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>🔧 MANAGE ADMINS:</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              <select
                id="newAdminEmail"
                style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.75rem' }}
                defaultValue=""
              >
                <option value="" disabled>Select User to Add...</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.email}>{u.displayName} ({u.email})</option>
                ))}
              </select>
              <button
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.7rem' }}
                onClick={() => {
                  const el = document.getElementById('newAdminEmail');
                  if (el.value.trim()) {
                    onAddAdmin(el.value.trim());
                    el.value = '';
                  }
                }}
              >
                Add ➕
              </button>
            </div>
            {adminList && adminList.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', border: '1.5px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{a.email}</span>
                <button
                  style={{ background: 'var(--error)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => onRemoveAdmin(a.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      <button className="btn-primary" onClick={logout} style={{ background: 'var(--surface)' }}>
        {t('logout')} 👋
      </button>
    </div>
  );
}
