import React, { useMemo } from 'react';

export default function AdhocRanksPanel({ adhocSquadStats, onViewHistory, t }) {
  const sortedRanks = useMemo(
    () => Object.keys(adhocSquadStats).sort((a, b) => adhocSquadStats[b].earnings - adhocSquadStats[a].earnings),
    [adhocSquadStats]
  );

  return (
    <div className="fade-in">
      <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: '16px', overflow: 'hidden', height: '160px', border: '3px solid var(--border)' }}>
        <img src="/squad_photo.png" alt="Squad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '1rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0, textShadow: '2px 2px 0 var(--dark)' }}>{t('adhoc_leaderboard')}</h3>
          {sortedRanks.length > 0 && (
            <div style={{ textAlign: 'right', textShadow: '1px 1px 0 var(--dark)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Inv / Player</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--yellow)' }}>
                ₹{adhocSquadStats[sortedRanks[0]].spent.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="glass-card" style={{ padding: '1rem' }}>
        {sortedRanks.length === 0 ? (
          <p style={{ opacity: 0.5 }}>{t('adhoc_no_ranks')}</p>
        ) : (
          sortedRanks.map((name, i) => {
            const stats = adhocSquadStats[name];
            const isPos = stats.earnings >= 0;
            return (
              <div
                key={name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1.5px dashed var(--border)',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, color: i < 3 ? 'var(--orange)' : 'var(--muted)' }}>#{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 600 }}>
                      {t('wins')}: {stats.wins} · {t('total_won')}{' '}
                      <span style={{ color: 'var(--teal)' }}>₹{stats.won.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      {isPos ? t('profits') : t('total_paid')}
                    </div>
                    <div style={{ fontWeight: 800, color: isPos ? 'var(--teal)' : 'var(--error)' }}>
                      {isPos ? '+' : '-'}₹{Math.abs(stats.earnings).toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                    onClick={() => onViewHistory(name)}
                  >
                    {t('view_history')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
