import React from 'react';

export default function ProfileView({
  user,
  logout,
  onSync,
  isAdmin,
  onAddCustomMatch,
  onViewHistory,
}) {
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
          <h4 style={{ fontFamily: "'Baloo 2', sans-serif", borderBottom: '2.5px dashed var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--orange)' }}>
            👑 ADMIN DASHBOARD
          </h4>

          <button
            className="btn-primary"
            style={{ fontSize: '0.75rem', padding: '0.6rem', background: 'var(--muted)', width: '100%' }}
            onClick={onSync}
          >
            ⚠️ Danger: Factory Reset &amp; Re-Sync Schedule
          </button>
        </div>
      )}

      <button className="btn-primary" onClick={logout} style={{ background: 'var(--card)' }}>
        Log Out 👋
      </button>
    </div>
  );
}
