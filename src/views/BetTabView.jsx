import React from 'react';
import { SQUAD_VIEW_BET } from '../models/squadViewMode';
import SquadViewModeDropdown from './SquadViewModeDropdown';
import BetView from './BetView';
import AdhocBetPanel from './AdhocBetPanel';

export default function BetTabView({
  squadViewMode,
  setSquadViewMode,
  t,
  betViewProps,
  adhocBetPanelProps,
}) {
  return (
    <div className="fade-in">
      <SquadViewModeDropdown squadViewMode={squadViewMode} setSquadViewMode={setSquadViewMode} t={t} />
      {squadViewMode === SQUAD_VIEW_BET ? <BetView {...betViewProps} /> : <AdhocBetPanel {...adhocBetPanelProps} />}
    </div>
  );
}
