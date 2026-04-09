import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';

export default function AdhocAuditView({ adhocBets, adhocVotes, allUsers, t }) {
  const [selectedBetId, setSelectedBetId] = useState(null);

  useEffect(() => {
    if (adhocBets.length && !selectedBetId) {
      setSelectedBetId(adhocBets[0].id);
    }
  }, [adhocBets, selectedBetId]);

  const bet = adhocBets.find((b) => b.id === selectedBetId);
  const betVotes = useMemo(() => adhocVotes.filter((v) => v.adhoc_bet_id === selectedBetId), [adhocVotes, selectedBetId]);

  return (
    <div className="glass-card fade-in" style={{ textAlign: 'left', padding: '1.5rem', background: 'var(--bg)' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--text)', opacity: 0.8 }}>
        🎲 {t('audit_adhoc_title')}
      </p>

      {adhocBets.length === 0 ? (
        <p style={{ fontSize: '0.65rem', opacity: 0.5 }}>{t('adhoc_no_bets')}</p>
      ) : (
        <>
          <label style={{ fontSize: '0.7rem', fontWeight: 800, display: 'block', marginBottom: '6px' }}>{t('adhoc_select_bet')}</label>
          <select
            value={selectedBetId || ''}
            onChange={(e) => setSelectedBetId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginBottom: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontWeight: 700,
            }}
          >
            {adhocBets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.statement.slice(0, 56)}
                {b.statement.length > 56 ? '…' : ''}
              </option>
            ))}
          </select>

          {bet && (
            <div
              className="glass-card fade-in"
              style={{
                background: 'var(--surface)',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  marginBottom: '1rem',
                  color: 'var(--teal)',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.5rem',
                }}
              >
                {bet.statement}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                A: {bet.option_a} · B: {bet.option_b}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allUsers.length === 0 && <p style={{ fontSize: '0.6rem', opacity: 0.5 }}>Waiting for users...</p>}
                {allUsers.map((u) => {
                  const v = betVotes.find((x) => x.user_name === u.displayName);
                  const hasVoted = !!v;
                  const label = !v ? null : v.chosen_option === 'A' ? bet.option_a : bet.option_b;

                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: 'var(--bg)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={u.photoURL} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid var(--teal)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{u.displayName.split(' ')[0]}</span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: hasVoted ? 'var(--text)' : 'var(--error)',
                            opacity: hasVoted ? 1 : 0.5,
                          }}
                        >
                          {hasVoted ? format(new Date(v.created_at), 'MMM d, hh:mm:ss a') : `${t('audit_no_pick')} ❌`}
                        </div>
                        {hasVoted && (
                          <div
                            style={{
                              fontSize: '0.5rem',
                              color: 'var(--teal)',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {t('audit_picked_prefix')} {label}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
