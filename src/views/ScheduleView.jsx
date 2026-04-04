import React, { useState } from 'react';
import { isBefore, format, parse } from 'date-fns';
import { IPL_SCHEDULE, IPL_TEAMS, MONTHS, selectStyle } from '../models/constants';

/**
 * AddMatchModal — local sub-component, used only within ScheduleView.
 * Collects new match data from the admin and calls onAdd.
 */
function AddMatchModal({ onClose, onAdd }) {
  const [team1,  setTeam1]  = useState('');
  const [team2,  setTeam2]  = useState('');
  const [day,    setDay]    = useState('');
  const [month,  setMonth]  = useState('April');
  const [hour,   setHour]   = useState('7');
  const [minute, setMinute] = useState('30');
  const [ampm,   setAmpm]   = useState('PM');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!team1 || !team2 || !day || team1 === team2) {
      alert('Please fill all fields and pick two different teams!');
      return;
    }
    setSaving(true);
    try {
      await onAdd({ team1, team2, day, month, hour, minute, ampm });
      onClose();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const team2Opts  = IPL_TEAMS.filter(t => t !== team1);
  const labelStyle = { fontSize: '0.72rem', fontWeight: 800, display: 'block', marginBottom: '0.35rem', letterSpacing: '0.05em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.5rem 2rem', width: '100%', maxWidth: '480px', border: '3px solid var(--border)', borderBottom: 'none', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0 }}>➕ Add Custom Match</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Team 1 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>TEAM 1</label>
          <select value={team1} onChange={e => { setTeam1(e.target.value); setTeam2(''); }} style={selectStyle}>
            <option value="">Select a team…</option>
            {IPL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Team 2 */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>TEAM 2</label>
          <select value={team2} onChange={e => setTeam2(e.target.value)} style={{ ...selectStyle, opacity: !team1 ? 0.5 : 1 }} disabled={!team1}>
            <option value="">Select a team…</option>
            {team2Opts.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Date row */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>DAY</label>
            <select value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
              <option value="">--</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>MONTH</label>
            <select value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1.2 }}>
            <label style={labelStyle}>YEAR</label>
            <input value="2026" disabled style={{ ...selectStyle, background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--muted)' }} />
          </div>
        </div>

        {/* Time row */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>HOUR</label>
            <select value={hour} onChange={e => setHour(e.target.value)} style={selectStyle}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>MINUTE</label>
            <select value={minute} onChange={e => setMinute(e.target.value)} style={selectStyle}>
              {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>AM / PM</label>
            <select value={ampm} onChange={e => setAmpm(e.target.value)} style={selectStyle}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {team1 && team2 && day && (
          <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
            📅 {team1} vs {team2}<br />
            <span style={{ fontWeight: 500 }}>{month} {day}, 2026 · {hour}:{minute} {ampm}</span>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', background: saving ? 'var(--muted)' : 'var(--teal)', fontSize: '0.9rem' }}
        >
          {saving ? 'Saving…' : '✅ Add Match'}
        </button>
      </div>
    </div>
  );
}

export default function ScheduleView({ isAdmin, onAddMatch }) {
  const [showModal, setShowModal] = useState(false);
  const now      = new Date();
  const todayStr = format(now, 'MMMM d');
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", margin: 0 }}>IPL CALENDAR 📅</h3>
        {isAdmin && (
          <button
            className="btn-primary"
            style={{ fontSize: '0.72rem', padding: '0.45rem 0.9rem', background: 'var(--teal)', whiteSpace: 'nowrap' }}
            onClick={() => setShowModal(true)}
          >
            + Add Match
          </button>
        )}
      </div>

      {showModal && (
        <AddMatchModal
          onClose={() => setShowModal(false)}
          onAdd={async (data) => { await onAddMatch(data); setShowModal(false); }}
        />
      )}

      <div className="schedule-list">
        {IPL_SCHEDULE.map((m, index) => {
          const matchDate  = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
          const isPast     = isBefore(matchDate, now);
          const isToday    = m.date === todayStr;
          const isNextFirst = !isPast && (
            index === 0 ||
            isBefore(parse(`${IPL_SCHEDULE[index - 1].date} 2026 ${IPL_SCHEDULE[index - 1].time}`, 'MMMM d yyyy h:mm a', new Date()), now)
          );

          return (
            <div
              key={m.num}
              ref={isNextFirst ? scrollRef : null}
              className="schedule-card"
              style={{
                borderColor: isPast ? 'var(--error)' : 'var(--teal)',
                background:  isPast ? 'var(--bg)' : 'var(--card)',
                borderWidth: isToday ? '3px' : '2px',
                opacity:     isPast ? 0.7 : 1,
              }}
            >
              <div className="schedule-info">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="match-num-badge" style={{ background: isPast ? 'var(--border)' : 'var(--yellow)' }}>
                    MATCH {m.num}
                  </span>
                  {isToday && (
                    <span style={{ background: 'var(--orange)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      TODAY 🔥
                    </span>
                  )}
                  {isPast ? (
                    <span style={{ color: 'var(--error)', fontSize: '0.6rem', fontWeight: 'bold' }}>● OVER</span>
                  ) : (
                    <span style={{ color: 'var(--teal)', fontSize: '0.6rem', fontWeight: 'bold' }}>
                      ● {isToday ? 'LIVE / UPCOMING' : 'UPCOMING'}
                    </span>
                  )}
                </div>
                <h5 style={{ color: isPast ? 'var(--muted)' : 'inherit' }}>{m.fixture}</h5>
                <p>{m.date} · {m.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
