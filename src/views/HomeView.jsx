import React from 'react';
import { Share2 } from 'lucide-react';

export default function HomeView({ user, stats, onShare }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif" }}>ChaiBet Global 🏏</h2>
        <button
          onClick={onShare}
          style={{ background: 'var(--yellow)', border: '2px solid var(--dark)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 var(--dark)' }}
        >
          <Share2 size={18} />
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--yellow)', marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 800 }}>LIVE HOT TAKES 🔥</h4>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pick your winners and climb the global leaderboard!</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>💰</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>PROFITS</div>
          <div style={{ fontWeight: 800, color: stats.earnings >= 0 ? 'var(--teal)' : 'var(--error)' }}>
            ₹{stats.earnings}
          </div>
        </div>
        <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>🏆</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>TOTAL WINS</div>
          <div style={{ fontWeight: 800 }}>{stats.wins}</div>
        </div>
      </div>
    </div>
  );
}
