import React from 'react';

export default function RanksView({ squadStats, onViewHistory }) {
  const sorted = Object.keys(squadStats).sort(
    (a, b) => squadStats[b].earnings - squadStats[a].earnings
  );

  return (
    <div className="fade-in">
      <h3 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '1rem' }}>SQUAD RANKS 🏆</h3>
      <div className="glass-card" style={{ padding: '1rem' }}>
        {sorted.map((name, i) => (
          <div
            key={name}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1.5px dashed var(--border)' }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: i < 3 ? 'var(--orange)' : 'var(--muted)' }}>#{i + 1}</div>
              <div style={{ fontWeight: 700 }}>{name}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, color: squadStats[name].earnings >= 0 ? 'var(--teal)' : 'var(--error)' }}>
                ₹{squadStats[name].earnings}
              </div>
              <button
                style={{ background: 'var(--bg)', color: 'var(--text)', border: '2px solid var(--border)', borderRadius: '8px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                onClick={() => onViewHistory(name)}
              >
                History
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
