import React from 'react';
import { SQUAD_VIEW_BET } from '../models/squadViewMode';
import SquadModeToggle from './SquadModeToggle';
import IplRanksView from './IplRanksView';
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
      <SquadModeToggle mode={squadViewMode} setMode={setSquadViewMode} t={t} />
      {squadViewMode === SQUAD_VIEW_BET ? <IplRanksView {...iplRanksProps} /> : <AdhocRanksPanel {...adhocRanksProps} />}
    </div>
  );
}
