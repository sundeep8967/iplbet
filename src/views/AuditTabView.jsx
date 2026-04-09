import React from 'react';
import { SQUAD_VIEW_BET, SQUAD_VIEW_ADHOC_BET } from '../models/squadViewMode';
import SquadViewModeDropdown from './SquadViewModeDropdown';
import IplAuditView from './IplAuditView';
import AdhocAuditView from './AdhocAuditView';

export default function AuditTabView({ squadViewMode, setSquadViewMode, t, iplAuditProps, adhocAuditProps }) {
  return (
    <div className="fade-in">
      <h2 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '0.5rem' }}>{t('audit_tab_heading')}</h2>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '1rem', fontWeight: 600 }}>{t('audit_tab_subtitle')}</p>
      <SquadViewModeDropdown squadViewMode={squadViewMode} setSquadViewMode={setSquadViewMode} t={t} />
      {squadViewMode === SQUAD_VIEW_BET ? <IplAuditView {...iplAuditProps} /> : <AdhocAuditView {...adhocAuditProps} />}
    </div>
  );
}
