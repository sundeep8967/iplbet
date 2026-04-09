import React from 'react';
import { SQUAD_VIEW_BET, SQUAD_VIEW_ADHOC_BET } from '../models/squadViewMode';

export default function SquadViewModeDropdown({ squadViewMode, setSquadViewMode, t }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label
        htmlFor="squad-view-mode"
        style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}
      >
        {t('squad_view_mode_label')}
      </label>
      <select
        id="squad-view-mode"
        value={squadViewMode}
        onChange={(e) => setSquadViewMode(e.target.value)}
        style={{
          width: '100%',
          padding: '0.65rem 0.75rem',
          borderRadius: '12px',
          border: '2px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontWeight: 800,
          fontSize: '0.82rem',
          cursor: 'pointer',
        }}
      >
        <option value={SQUAD_VIEW_BET}>{t('squad_view_bet')}</option>
        <option value={SQUAD_VIEW_ADHOC_BET}>{t('squad_view_adhoc_bet')}</option>
      </select>
    </div>
  );
}
