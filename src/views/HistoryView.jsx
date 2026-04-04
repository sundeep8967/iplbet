import React from 'react';
import { IPL_SCHEDULE } from '../models/constants';

export default function HistoryView({ userName, votes, matchResults, onClose }) {
  const userVotes = votes
    .filter(v => v.user_name === userName)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif" }}>{userName}'s Bets 📜</h3>
        <button
          onClick={onClose}
          style={{ background: 'var(--card)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {userVotes.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: 'center' }}>No bets placed yet.</p>
        ) : userVotes.map(v => {
          const result = matchResults.find(r => r.match_id === v.match_id);
          let statusText  = 'PENDING ⏳';
          let statusColor = 'var(--muted)';

          if (result) {
            if (result.winner_team === v.chosen_team) {
              statusText  = 'WON ✅';
              statusColor = 'var(--teal)';
            } else {
              statusText  = 'LOST ❌';
              statusColor = 'var(--error)';
            }
          }

          const matchName = v.match_id.replace('ipl-2025-', 'Match ');
          const matchObj  = IPL_SCHEDULE.find(m => `ipl-2025-${m.num}` === v.match_id);
          const fixture   = matchObj ? matchObj.fixture : '';

          return (
            <div
              key={v.match_id}
              className="glass-card"
              style={{ padding: '1rem', borderLeft: `6px solid ${statusColor}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{matchName}</span>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: statusColor }}>{statusText}</span>
              </div>
              {fixture && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.7, marginBottom: '0.6rem' }}>
                  {fixture}
                </div>
              )}
              <div style={{ fontSize: '0.9rem' }}>
                Picked: <strong>{v.chosen_team}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
