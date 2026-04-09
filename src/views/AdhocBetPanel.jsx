import React, { useState, useEffect, useMemo } from 'react';
import { format, isBefore } from 'date-fns';

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function latestResultForBet(betId, adhocResults) {
  const list = adhocResults.filter((r) => r.adhoc_bet_id === betId);
  if (list.length === 0) return null;
  return list.sort((a, b) => (b.settled_at || '').localeCompare(a.settled_at || ''))[0];
}

export default function AdhocBetPanel({
  user,
  isAdmin,
  adhocBets,
  adhocVotes,
  adhocResults,
  adhocLogs,
  handleCreateAdhocBet,
  handleAdhocVote,
  handleUpdateAdhocLock,
  handleFinalizeAdhoc,
  t,
}) {
  const [nowTick, setNowTick] = useState(0);
  const effectiveNow = useMemo(() => new Date(), [nowTick]);
  const [showCreate, setShowCreate] = useState(false);
  const [statement, setStatement] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [stake, setStake] = useState('50');
  const [lockLocal, setLockLocal] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [editLockBetId, setEditLockBetId] = useState(null);
  const [editLockLocal, setEditLockLocal] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNowTick((x) => x + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const submitCreate = async (e) => {
    e.preventDefault();
    await handleCreateAdhocBet({
      statement,
      optionA,
      optionB,
      stakePerHead: stake,
      lockAtIso: new Date(lockLocal).toISOString(),
    });
    setStatement('');
    setOptionA('');
    setOptionB('');
    setStake('50');
    setLockLocal(toDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)));
    setShowCreate(false);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '0.25rem', fontSize: '1.25rem' }}>{t('adhoc_title')}</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>{t('adhoc_subtitle')}</p>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => setShowCreate((s) => !s)}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', fontWeight: 800 }}
      >
        {showCreate ? t('adhoc_cancel_create') : t('adhoc_create')}
      </button>

      {showCreate && (
        <form onSubmit={submitCreate} className="glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>{t('adhoc_statement')}</label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            required
            rows={2}
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontFamily: 'inherit',
            }}
          />
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>{t('adhoc_option_a')}</label>
          <input
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            required
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>{t('adhoc_option_b')}</label>
          <input
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            required
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>{t('adhoc_stake')}</label>
          <input
            type="number"
            min="1"
            step="1"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            required
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>{t('adhoc_lock_time')}</label>
          <input
            type="datetime-local"
            value={lockLocal}
            onChange={(e) => setLockLocal(e.target.value)}
            required
            style={{
              width: '100%',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.65rem', fontWeight: 800 }}>
            {t('adhoc_submit')}
          </button>
        </form>
      )}

      {adhocBets.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center' }}>{t('adhoc_no_bets')}</p>}

      {adhocBets.map((bet) => {
        const lockAt = new Date(bet.lock_at);
        const locked = !isBefore(effectiveNow, lockAt);
        const res = latestResultForBet(bet.id, adhocResults);
        const settled = !!res;
        const myVote = adhocVotes.find((v) => v.adhoc_bet_id === bet.id && v.user_id === user.uid);
        const betVotes = adhocVotes.filter((v) => v.adhoc_bet_id === bet.id);
        const participants = new Set(betVotes.map((v) => v.user_name)).size;
        const isCreator = bet.created_by_uid === user.uid;
        const log = adhocLogs[bet.id];

        return (
          <div key={bet.id} className="glass-card" style={{ padding: '1rem', marginBottom: '0.85rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>
              ₹{bet.stake_per_head} {t('adhoc_per_head')} · {participants} {t('adhoc_participants')}
            </div>
            <div style={{ fontWeight: 900, fontSize: '0.95rem', marginTop: '6px' }}>{bet.statement}</div>
            {isCreator && (
              <div style={{ fontSize: '0.65rem', marginTop: '4px', color: 'var(--teal)', fontWeight: 700 }}>{t('adhoc_you_created')}</div>
            )}
            <div style={{ fontSize: '0.72rem', marginTop: '8px', opacity: 0.85 }}>
              {locked ? (
                <span style={{ color: 'var(--error)', fontWeight: 800 }}>{t('adhoc_locked')}</span>
              ) : (
                <span style={{ color: 'var(--teal)', fontWeight: 800 }}>{t('adhoc_open')}</span>
              )}
              {' · '}
              {t('adhoc_locks_at')} {format(lockAt, 'MMM d, h:mm a')}
            </div>

            {settled && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px',
                  background: 'rgba(52,211,153,0.1)',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                }}
              >
                {t('adhoc_winner')}: {res.winning_option === 'A' ? bet.option_a : bet.option_b}
                {log?.individualPayout > 0 && (
                  <span style={{ display: 'block', marginTop: '4px', fontWeight: 700, opacity: 0.9 }}>
                    {t('adhoc_payout_each')} ₹{Number(log.individualPayout).toFixed(2)}
                  </span>
                )}
              </div>
            )}

            {!settled && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => handleAdhocVote(bet.id, 'A')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '12px',
                    border: '2px solid var(--border)',
                    background: myVote?.chosen_option === 'A' ? 'rgba(79,142,247,0.25)' : 'var(--surface)',
                    fontWeight: 800,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.5 : 1,
                    fontSize: '0.78rem',
                  }}
                >
                  A: {bet.option_a}
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => handleAdhocVote(bet.id, 'B')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '12px',
                    border: '2px solid var(--border)',
                    background: myVote?.chosen_option === 'B' ? 'rgba(79,142,247,0.25)' : 'var(--surface)',
                    fontWeight: 800,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.5 : 1,
                    fontSize: '0.78rem',
                  }}
                >
                  B: {bet.option_b}
                </button>
              </div>
            )}

            {isCreator && !settled && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border)' }}>
                {editLockBetId === bet.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="datetime-local"
                      value={editLockLocal}
                      onChange={(e) => setEditLockLocal(e.target.value)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.5rem', fontWeight: 800 }}
                        onClick={() => {
                          handleUpdateAdhocLock(bet.id, new Date(editLockLocal).toISOString());
                          setEditLockBetId(null);
                        }}
                      >
                        {t('adhoc_save_lock')}
                      </button>
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          fontWeight: 800,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                          borderRadius: '8px',
                        }}
                        onClick={() => setEditLockBetId(null)}
                      >
                        {t('adhoc_cancel_create')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditLockBetId(bet.id);
                      setEditLockLocal(toDatetimeLocalValue(new Date(bet.lock_at)));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontWeight: 800,
                      background: 'var(--surface)',
                      border: '2px solid var(--border)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      color: 'var(--text)',
                    }}
                  >
                    {t('adhoc_edit_lock')}
                  </button>
                )}
              </div>
            )}

            {isAdmin && locked && !settled && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, marginBottom: '8px', color: 'var(--muted)' }}>
                  {t('adhoc_admin_settle')}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleFinalizeAdhoc(bet.id, 'A')}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      fontWeight: 800,
                      background: 'var(--teal)',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    {t('adhoc_settle')} A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalizeAdhoc(bet.id, 'B')}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      fontWeight: 800,
                      background: 'var(--teal)',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    {t('adhoc_settle')} B
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
