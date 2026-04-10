import React from 'react';
import { SQUAD_VIEW_BET } from '../models/squadViewMode';
import SquadModeToggle from './SquadModeToggle';
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
      {/* Cover Banner */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', borderRadius: '16px', overflow: 'hidden', height: '140px', border: '3px solid var(--border)' }}>
        <img 
          src="/bg_poster.jpeg" 
          alt="The Ultimate Rivalry" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '0.8rem', color: 'white' }}>
           <h4 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0, textShadow: '2px 2px 0 var(--dark)' }}>NEXT DAYS PICKS 🏏</h4>
        </div>
      </div>

      {/* Disclaimer / Rule Box */}
      <div style={{ background: 'var(--orange)', color: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.78rem', fontWeight: 800, border: '3px solid var(--dark)', lineHeight: '1.4' }}>
        ⚠️ RULE: Everyday, ₹10 is deducted automatically, even if you don't choose! If you win, you get your share of the total pot (₹10 from every member).
      </div>

      <SquadModeToggle mode={squadViewMode} setMode={setSquadViewMode} t={t} />
      {squadViewMode === SQUAD_VIEW_BET ? <BetView {...betViewProps} /> : <AdhocBetPanel {...adhocBetPanelProps} />}
    </div>
  );
}
