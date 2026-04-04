// ─── DATA CONSTANTS ────────────────────────────────────────────────────────

export const BET_AMOUNT = 10;

export const IPL_SCHEDULE = [
  { num: 1,  date: 'March 28',  time: '7:30 PM', fixture: 'Royal Challengers Bengaluru vs Sunrisers Hyderabad' },
  { num: 2,  date: 'March 29',  time: '7:30 PM', fixture: 'Mumbai Indians vs Kolkata Knight Riders' },
  { num: 3,  date: 'March 30',  time: '7:30 PM', fixture: 'Rajasthan Royals vs Chennai Super Kings' },
  { num: 4,  date: 'March 31',  time: '7:30 PM', fixture: 'Punjab Kings vs Gujarat Titans' },
  { num: 5,  date: 'April 1',   time: '7:30 PM', fixture: 'Lucknow Super Giants vs Delhi Capitals' },
  { num: 6,  date: 'April 2',   time: '7:30 PM', fixture: 'Kolkata Knight Riders vs Sunrisers Hyderabad' },
  { num: 7,  date: 'April 3',   time: '7:30 PM', fixture: 'Chennai Super Kings vs Punjab Kings' },
  { num: 8,  date: 'April 4',   time: '3:30 PM', fixture: 'Delhi Capitals vs Mumbai Indians' },
  { num: 9,  date: 'April 4',   time: '7:30 PM', fixture: 'Gujarat Titans vs Rajasthan Royals' },
  { num: 10, date: 'April 5',   time: '3:30 PM', fixture: 'Sunrisers Hyderabad vs Lucknow Super Giants' },
  { num: 11, date: 'April 5',   time: '7:30 PM', fixture: 'Royal Challengers Bengaluru vs Chennai Super Kings' },
  { num: 12, date: 'April 6',   time: '7:30 PM', fixture: 'Kolkata Knight Riders vs Punjab Kings' },
  { num: 13, date: 'April 7',   time: '7:30 PM', fixture: 'Rajasthan Royals vs Mumbai Indians' },
  { num: 14, date: 'April 8',   time: '7:30 PM', fixture: 'Delhi Capitals vs Gujarat Titans' },
  { num: 15, date: 'April 9',   time: '7:30 PM', fixture: 'Kolkata Knight Riders vs Lucknow Super Giants' },
  { num: 16, date: 'April 10',  time: '7:30 PM', fixture: 'Rajasthan Royals vs Royal Challengers Bengaluru' },
  { num: 17, date: 'April 11',  time: '3:30 PM', fixture: 'Punjab Kings vs Sunrisers Hyderabad' },
  { num: 18, date: 'April 11',  time: '7:30 PM', fixture: 'Chennai Super Kings vs Delhi Capitals' },
  { num: 19, date: 'April 12',  time: '3:30 PM', fixture: 'Lucknow Super Giants vs Gujarat Titans' },
  { num: 20, date: 'April 12',  time: '7:30 PM', fixture: 'Mumbai Indians vs Royal Challengers Bengaluru' },
  { num: 21, date: 'April 13',  time: '7:30 PM', fixture: 'Sunrisers Hyderabad vs Rajasthan Royals' },
  { num: 22, date: 'April 14',  time: '7:30 PM', fixture: 'Chennai Super Kings vs Kolkata Knight Riders' },
  { num: 23, date: 'April 15',  time: '7:30 PM', fixture: 'Royal Challengers Bengaluru vs Lucknow Super Giants' },
  { num: 24, date: 'April 16',  time: '7:30 PM', fixture: 'Mumbai Indians vs Punjab Kings' },
  { num: 25, date: 'April 17',  time: '7:30 PM', fixture: 'Gujarat Titans vs Kolkata Knight Riders' },
  { num: 26, date: 'April 18',  time: '3:30 PM', fixture: 'Royal Challengers Bengaluru vs Delhi Capitals' },
  { num: 27, date: 'April 18',  time: '7:30 PM', fixture: 'Sunrisers Hyderabad vs Chennai Super Kings' },
  { num: 28, date: 'April 19',  time: '3:30 PM', fixture: 'Kolkata Knight Riders vs Rajasthan Royals' },
  { num: 29, date: 'April 19',  time: '7:30 PM', fixture: 'Punjab Kings vs Lucknow Super Giants' },
  { num: 30, date: 'April 20',  time: '7:30 PM', fixture: 'Gujarat Titans vs Mumbai Indians' },
  { num: 31, date: 'April 21',  time: '7:30 PM', fixture: 'Sunrisers Hyderabad vs Delhi Capitals' },
  { num: 32, date: 'April 22',  time: '7:30 PM', fixture: 'Lucknow Super Giants vs Rajasthan Royals' },
  { num: 33, date: 'April 23',  time: '7:30 PM', fixture: 'Mumbai Indians vs Chennai Super Kings' },
  { num: 34, date: 'April 24',  time: '7:30 PM', fixture: 'Royal Challengers Bengaluru vs Gujarat Titans' },
  { num: 35, date: 'April 25',  time: '3:30 PM', fixture: 'Delhi Capitals vs Punjab Kings' },
  { num: 36, date: 'April 25',  time: '7:30 PM', fixture: 'Rajasthan Royals vs Sunrisers Hyderabad' },
  { num: 37, date: 'April 26',  time: '3:30 PM', fixture: 'Gujarat Titans vs Chennai Super Kings' },
  { num: 38, date: 'April 26',  time: '7:30 PM', fixture: 'Lucknow Super Giants vs Kolkata Knight Riders' },
  { num: 39, date: 'April 27',  time: '7:30 PM', fixture: 'Delhi Capitals vs Royal Challengers Bengaluru' },
  { num: 40, date: 'April 28',  time: '7:30 PM', fixture: 'Punjab Kings vs Rajasthan Royals' },
];

export const IPL_TEAMS = [
  'Chennai Super Kings',
  'Delhi Capitals',
  'Gujarat Titans',
  'Kolkata Knight Riders',
  'Lucknow Super Giants',
  'Mumbai Indians',
  'Punjab Kings',
  'Rajasthan Royals',
  'Royal Challengers Bengaluru',
  'Sunrisers Hyderabad',
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Shared select input style used by AddMatchModal */
export const selectStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  border: '2px solid var(--border)',
  borderRadius: '10px',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '0.82rem',
  background: 'var(--card)',
  color: 'var(--text)',
  cursor: 'pointer',
  appearance: 'auto',
};
