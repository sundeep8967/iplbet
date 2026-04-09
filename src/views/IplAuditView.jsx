import React, { useState, useEffect, useMemo } from 'react';
import { parse, isBefore, isAfter, addHours, format, addDays, subDays, subMinutes } from 'date-fns';
import { TEAM_ACRONYMS } from '../models/constants';

export default function IplAuditView({ allMatches, votes, matchResults, allUsers, t }) {
  const [selectedAuditMatchId, setSelectedAuditMatchId] = useState(null);

  const auditMatchesCandidates = useMemo(() => {
    const now = new Date();
    return allMatches
      .filter((m) => {
        const mTime = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
        return isAfter(mTime, subDays(now, 1)) && isBefore(mTime, addDays(now, 2));
      })
      .sort((a, b) => {
        const tA = parse(`${a.date} 2026 ${a.time}`, 'MMMM d yyyy h:mm a', new Date());
        const tB = parse(`${b.date} 2026 ${b.time}`, 'MMMM d yyyy h:mm a', new Date());
        return tB - tA;
      });
  }, [allMatches]);

  useEffect(() => {
    if (!selectedAuditMatchId && auditMatchesCandidates.length > 0) {
      const ongoing = auditMatchesCandidates.find((m) => {
        const mTime = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
        const now = new Date();
        return isBefore(subMinutes(mTime, 31), now) && isBefore(now, addHours(mTime, 5));
      });
      setSelectedAuditMatchId(ongoing ? ongoing.id : auditMatchesCandidates[0].id);
    }
  }, [auditMatchesCandidates, selectedAuditMatchId, allMatches]);

  return (
    <div className="glass-card fade-in" style={{ textAlign: 'left', padding: '1.5rem', background: 'var(--bg)' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--text)', opacity: 0.8 }}>
        🏃 {t('audit_ipl_title')}
      </p>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '1rem', scrollbarWidth: 'none' }}>
        {auditMatchesCandidates.length === 0 && (
          <p style={{ fontSize: '0.65rem', opacity: 0.5 }}>{t('audit_no_recent_matches')}</p>
        )}
        {auditMatchesCandidates.map((m) => {
          const isSelected = selectedAuditMatchId === m.id;
          const mTime = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
          const isUpcoming = isBefore(new Date(), subMinutes(mTime, 31));
          const isOngoing = isBefore(subMinutes(mTime, 31), new Date()) && isBefore(new Date(), addHours(mTime, 5));
          const isSettled = matchResults.some((r) => r.match_id === m.id);
          const isPast = isAfter(new Date(), addHours(mTime, 5));
          const isDone = isSettled || isPast;
          const acronyms = m.fixture.split(' vs ').map((team) => TEAM_ACRONYMS[team] || team.split(' ').pop());

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedAuditMatchId(m.id)}
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: isSelected ? 'var(--teal)' : 'var(--border)',
                background: isSelected ? 'var(--teal)' : 'var(--surface)',
                color: isSelected ? 'white' : 'var(--text)',
                fontSize: '0.65rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 4px 12px rgba(0, 150, 136, 0.3)' : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                minWidth: '95px',
              }}
            >
              <span style={{ fontSize: '0.55rem', opacity: isSelected ? 0.9 : 0.6 }}>
                {m.date.split(' ').slice(0, 2).join(' ')} · {m.time}
              </span>
              <span>{acronyms.join(' v ')}</span>
              {isOngoing && (
                <span
                  style={{
                    fontSize: '0.5rem',
                    background: '#ff4444',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    marginTop: '2px',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  LIVE
                </span>
              )}
              {isUpcoming && (
                <span
                  style={{
                    fontSize: '0.5rem',
                    background: 'var(--teal)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    marginTop: '2px',
                  }}
                >
                  UPCOMING
                </span>
              )}
              {isDone && !isOngoing && (
                <span
                  style={{
                    fontSize: '0.5rem',
                    background: 'var(--muted)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    marginTop: '2px',
                  }}
                >
                  DONE
                </span>
              )}
            </button>
          );
        })}
      </div>

      {(() => {
        const activeAuditMatch = allMatches.find((m) => m.id === selectedAuditMatchId) || auditMatchesCandidates[0];
        if (!activeAuditMatch) return null;

        const matchVotes = votes.filter((v) => v.match_id === activeAuditMatch.id);

        return (
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
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{activeAuditMatch.fixture}</span>
              <span style={{ opacity: 0.6 }}>{activeAuditMatch.date}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allUsers.length === 0 && <p style={{ fontSize: '0.6rem', opacity: 0.5 }}>Waiting for users...</p>}
              {allUsers.map((u) => {
                const v = matchVotes.find((vote) => vote.user_name === u.displayName);
                const hasVoted = !!v;

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
                          {t('audit_picked_prefix')}{' '}
                          {TEAM_ACRONYMS[v.chosen_team] || v.chosen_team.split(' ').pop()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
