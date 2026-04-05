import React from 'react';

export default function RanksView({ squadStats, onViewHistory }) {
  const sorted = Object.keys(squadStats).sort(
    (a, b) => squadStats[b].earnings - squadStats[a].earnings
  );

  return (
    <div className="fade-in">
      <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: '16px', overflow: 'hidden', height: '160px', border: '3px solid var(--border)' }}>
        <img 
          src="/squad_photo.png" 
          alt="Squad at Match" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '1rem', color: 'white' }}>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0, textShadow: '2px 2px 0 var(--dark)' }}>SQUAD RANKS 🏆</h3>
        </div>
      </div>
      <div className="glass-card" style={{ padding: '1rem' }}>
        {sorted.map((name, i) => {
          const stats = squadStats[name];
          const isPos = stats.earnings >= 0;
          return (
            <div
              key={name}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1.5px dashed var(--border)' }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: i < 3 ? 'var(--orange)' : 'var(--muted)' }}>#{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>{name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 600 }}>
                    Won: <span style={{ color: 'var(--teal)' }}>₹{stats.won.toFixed(2)}</span> · Paid: <span style={{ color: 'var(--error)' }}>₹{stats.spent.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    {isPos ? 'Net Profit' : 'Net Loss'}
                  </div>
                  <div style={{ fontWeight: 800, color: isPos ? 'var(--teal)' : 'var(--error)' }}>
                    {isPos ? '+' : '-'}₹{Math.abs(stats.earnings).toFixed(2)}
                  </div>
                </div>
                <button
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '2px solid var(--border)', borderRadius: '8px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => onViewHistory(name)}
                >
                  History
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
