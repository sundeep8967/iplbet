import React from 'react';
import { SQUAD_VIEW_BET } from '../models/squadViewMode';
import SquadViewModeDropdown from './SquadViewModeDropdown';
import RanksView from './RanksView';
import AdhocRanksPanel from './AdhocRanksPanel';

export default function RanksTabView({
  squadViewMode,
  setSquadViewMode,
  t,
  iplRanksProps,
  adhocRanksProps,
}) {
  return (
    <div className="fade-in">
      <SquadViewModeDropdown squadViewMode={squadViewMode} setSquadViewMode={setSquadViewMode} t={t} />
      {squadViewMode === SQUAD_VIEW_BET ? (
        <RanksView {...iplRanksProps} />
      ) : (
        <AdhocRanksPanel {...adhocRanksProps} />
      )}
    </div>
  );
}
