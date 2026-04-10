import React from 'react';
import { SQUAD_VIEW_BET, SQUAD_VIEW_ADHOC_BET } from '../models/squadViewMode';

export default function SquadModeToggle({ mode, setMode, t }) {
  const btnStyle = (active) => ({
    flex: 1,
    padding: '0.65rem 0.5rem',
    fontSize: '0.78rem',
    fontWeight: 900,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: active ? '2.5px solid var(--dark)' : '1px solid var(--border)',
    background: active ? 'var(--teal)' : 'var(--surface)',
    color: active ? 'white' : 'var(--muted)',
    boxShadow: active ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
    transform: active ? 'translateY(-1px)' : 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  });

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      marginBottom: '1.25rem', 
      background: 'rgba(255,255,255,0.4)', 
      padding: '5px', 
      borderRadius: '16px',
      border: '1px solid var(--border)'
    }}>
      <button 
        style={btnStyle(mode === SQUAD_VIEW_BET)}
        onClick={() => setMode(SQUAD_VIEW_BET)}
      >
        🏏 {t('squad_view_bet')}
      </button>
      <button 
        style={btnStyle(mode === SQUAD_VIEW_ADHOC_BET)}
        onClick={() => setMode(SQUAD_VIEW_ADHOC_BET)}
      >
        🎯 {t('squad_view_adhoc_bet')}
      </button>
    </div>
  );
}
