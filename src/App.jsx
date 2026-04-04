import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { Share2 } from 'lucide-react';
import { format, isBefore, addDays, parse } from 'date-fns';


const IPL_SCHEDULE = [
  { num: 1, date: "March 28", time: "7:30 PM", fixture: "Royal Challengers Bengaluru vs Sunrisers Hyderabad" },
  { num: 2, date: "March 29", time: "7:30 PM", fixture: "Mumbai Indians vs Kolkata Knight Riders" },
  { num: 3, date: "March 30", time: "7:30 PM", fixture: "Rajasthan Royals vs Chennai Super Kings" },
  { num: 4, date: "March 31", time: "7:30 PM", fixture: "Punjab Kings vs Gujarat Titans" },
  { num: 5, date: "April 1", time: "7:30 PM", fixture: "Lucknow Super Giants vs Delhi Capitals" },
  { num: 6, date: "April 2", time: "7:30 PM", fixture: "Kolkata Knight Riders vs Sunrisers Hyderabad" },
  { num: 7, date: "April 3", time: "7:30 PM", fixture: "Chennai Super Kings vs Punjab Kings" },
  { num: 8, date: "April 4", time: "3:30 PM", fixture: "Delhi Capitals vs Mumbai Indians" },
  { num: 9, date: "April 4", time: "7:30 PM", fixture: "Gujarat Titans vs Rajasthan Royals" },
  { num: 10, date: "April 5", time: "3:30 PM", fixture: "Sunrisers Hyderabad vs Lucknow Super Giants" },
  { num: 11, date: "April 5", time: "7:30 PM", fixture: "Royal Challengers Bengaluru vs Chennai Super Kings" },
  { num: 12, date: "April 6", time: "7:30 PM", fixture: "Kolkata Knight Riders vs Punjab Kings" },
  { num: 13, date: "April 7", time: "7:30 PM", fixture: "Rajasthan Royals vs Mumbai Indians" },
  { num: 14, date: "April 8", time: "7:30 PM", fixture: "Delhi Capitals vs Gujarat Titans" },
  { num: 15, date: "April 9", time: "7:30 PM", fixture: "Kolkata Knight Riders vs Lucknow Super Giants" },
  { num: 16, date: "April 10", time: "7:30 PM", fixture: "Rajasthan Royals vs Royal Challengers Bengaluru" },
  { num: 17, date: "April 11", time: "3:30 PM", fixture: "Punjab Kings vs Sunrisers Hyderabad" },
  { num: 18, date: "April 11", time: "7:30 PM", fixture: "Chennai Super Kings vs Delhi Capitals" },
  { num: 19, date: "April 12", time: "3:30 PM", fixture: "Lucknow Super Giants vs Gujarat Titans" },
  { num: 20, date: "April 12", time: "7:30 PM", fixture: "Mumbai Indians vs Royal Challengers Bengaluru" },
  { num: 21, date: "April 13", time: "7:30 PM", fixture: "Sunrisers Hyderabad vs Rajasthan Royals" },
  { num: 22, date: "April 14", time: "7:30 PM", fixture: "Chennai Super Kings vs Kolkata Knight Riders" },
  { num: 23, date: "April 15", time: "7:30 PM", fixture: "Royal Challengers Bengaluru vs Lucknow Super Giants" },
  { num: 24, date: "April 16", time: "7:30 PM", fixture: "Mumbai Indians vs Punjab Kings" },
  { num: 25, date: "April 17", time: "7:30 PM", fixture: "Gujarat Titans vs Kolkata Knight Riders" },
  { num: 26, date: "April 18", time: "3:30 PM", fixture: "Royal Challengers Bengaluru vs Delhi Capitals" },
  { num: 27, date: "April 18", time: "7:30 PM", fixture: "Sunrisers Hyderabad vs Chennai Super Kings" },
  { num: 28, date: "April 19", time: "3:30 PM", fixture: "Kolkata Knight Riders vs Rajasthan Royals" },
  { num: 29, date: "April 19", time: "7:30 PM", fixture: "Punjab Kings vs Lucknow Super Giants" },
  { num: 30, date: "April 20", time: "7:30 PM", fixture: "Gujarat Titans vs Mumbai Indians" },
  { num: 31, date: "April 21", time: "7:30 PM", fixture: "Sunrisers Hyderabad vs Delhi Capitals" },
  { num: 32, date: "April 22", time: "7:30 PM", fixture: "Lucknow Super Giants vs Rajasthan Royals" },
  { num: 33, date: "April 23", time: "7:30 PM", fixture: "Mumbai Indians vs Chennai Super Kings" },
  { num: 34, date: "April 24", time: "7:30 PM", fixture: "Royal Challengers Bengaluru vs Gujarat Titans" },
  { num: 35, date: "April 25", time: "3:30 PM", fixture: "Delhi Capitals vs Punjab Kings" },
  { num: 36, date: "April 25", time: "7:30 PM", fixture: "Rajasthan Royals vs Sunrisers Hyderabad" },
  { num: 37, date: "April 26", time: "3:30 PM", fixture: "Gujarat Titans vs Chennai Super Kings" },
  { num: 38, date: "April 26", time: "7:30 PM", fixture: "Lucknow Super Giants vs Kolkata Knight Riders" },
  { num: 39, date: "April 27", time: "7:30 PM", fixture: "Delhi Capitals vs Royal Challengers Bengaluru" },
  { num: 40, date: "April 28", time: "7:30 PM", fixture: "Punjab Kings vs Rajasthan Royals" }
];

const IPL_TEAMS = [
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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const selectStyle = {
  width: '100%', padding: '0.6rem 0.8rem',
  border: '2px solid var(--dark)', borderRadius: '10px',
  fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem',
  background: 'white', cursor: 'pointer', appearance: 'auto',
};

export default function App() {
  const [user, setUser] = useState(null);
  const [customMatches, setCustomMatches] = useState([]);
  const [votes, setVotes] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  
  const BET_AMOUNT = 10;

  // 1. Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Minute tick — triggers activeMatches useMemo to refresh
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // 3. Real-time Global Data
  useEffect(() => {
    const vQ = query(collection(db, 'votes'), orderBy('created_at', 'desc'));
    const rQ = query(collection(db, 'match_results'), orderBy('settled_at', 'desc'));

    const mQ = query(collection(db, 'matches'), where('is_custom', '==', true));
    const unsubVotes = onSnapshot(vQ, (snap) => setVotes(snap.docs.map(doc => doc.data())));
    const unsubResults = onSnapshot(rQ, (snap) => setMatchResults(snap.docs.map(doc => doc.data())));
    const unsubMatches = onSnapshot(mQ, (snap) => setCustomMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    return () => { unsubVotes(); unsubResults(); unsubMatches(); };
  }, []);

  // 4. Active matches — IPL schedule + custom matches, updated every minute tick
  const activeMatches = useMemo(() => {
    const now = new Date();
    const twoDaysLater = addDays(now, 2);
    const allSources = [
      ...IPL_SCHEDULE.map(m => ({ ...m, id: `ipl-2025-${m.num}` })),
      ...customMatches,
    ];
    return allSources.filter(m => {
      const matchTime = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
      return isBefore(now, matchTime) && isBefore(matchTime, twoDaysLater);
    }).map(m => {
      if (!m.teams) {
        const [t1, t2] = m.fixture.split(' vs ');
        return { ...m, teams: [t1, t2] };
      }
      return m;
    });
  }, [customMatches, tick]);

  // 5. Shared Calculations (Memoized)
  const squadStats = useMemo(() => {
    const stats = {};
    
    // Seed stats with all users who have ever voted
    votes.forEach(v => {
      if (!stats[v.user_name]) {
        stats[v.user_name] = { wins: 0, earnings: 0, photo: v.user_photo };
      }
    });

    matchResults.forEach(res => {
      const matchId = res.match_id;
      const winner = res.winner_team;
      const mVotes = votes.filter(v => v.match_id === matchId);
      if (mVotes.length === 0) return;

      const pot = mVotes.length * BET_AMOUNT;
      const winnersCount = mVotes.filter(v => v.chosen_team === winner).length;
      
      if (winnersCount > 0 && winnersCount < mVotes.length) {
        const individualPayout = Math.floor(pot / winnersCount);
        mVotes.forEach(v => {
          if (v.chosen_team === winner) {
            stats[v.user_name].wins += 1;
            stats[v.user_name].earnings += (individualPayout - BET_AMOUNT);
          } else {
            stats[v.user_name].earnings -= BET_AMOUNT;
          }
        });
      }
    });
    return stats;
  }, [votes, matchResults, BET_AMOUNT]);

  const userStats = useMemo(() => {
    const name = user?.displayName;
    if (!name || !squadStats[name]) return { wins: 0, earnings: 0 };
    return squadStats[name];
  }, [user, squadStats]);

  const totalPot = useMemo(() => {
    return votes.length * BET_AMOUNT;
  }, [votes, BET_AMOUNT]);

  const handleVote = async (matchId, team) => {
    const now = new Date();
    const match = activeMatches.find(m => m.id === matchId);
    if (match) {
      const matchTime = parse(`${match.date} 2026 ${match.time}`, 'MMMM d yyyy h:mm a', new Date());
      if (!isBefore(now, matchTime)) {
        alert('POLL CLOSED — this match has already started!');
        return;
      }
    }
    if (!user) return;
    try {
      await addDoc(collection(db, 'votes'), {
        user_id: user.uid,
        user_name: user.displayName,
        user_photo: user.photoURL,
        match_id: matchId,
        chosen_team: team,
        created_at: new Date().toISOString()
      });
      alert(`Voted for ${team}!`);
    } catch (e) { console.error(e); }
  };

  const uploadSchedule = async () => {
    if (!confirm("Upload all 40 matches?")) return;
    for (const m of IPL_SCHEDULE) {
      const [t1, t2] = m.fixture.split(' vs ');
      await addDoc(collection(db, 'matches'), { ...m, t1, t2, created_at: new Date().toISOString() });
    }
    alert("Synced!");
  };


  const addCustomMatch = async ({ team1, team2, day, month, hour, minute, ampm }) => {
    const fixture = `${team1} vs ${team2}`;
    const date = `${month} ${day}`;
    const time = `${hour}:${minute} ${ampm}`;
    await addDoc(collection(db, 'matches'), {
      num: Date.now(), date, fixture, t1: team1, t2: team2,
      time, is_custom: true, created_at: new Date().toISOString()
    });
  };

  const finalizeWinner = async (matchId, winner) => {
    if (!winner || !confirm(`Settle ${winner}?`)) return;
    await addDoc(collection(db, 'match_results'), { match_id: matchId, winner_team: winner, settled_at: new Date().toISOString() });
    alert("Settled!");
  };

  const shareLink = async () => {
    const text = `Join ChaiBet and vote on IPL matches! 🍵🏏\n\n`;
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ChaiBet', text, url });
      } catch (e) {
        navigator.clipboard.writeText(`${text} ${url}`);
        alert(`App Link copied to clipboard!`);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert(`App Link copied to clipboard!`);
    }
  };

  const isAdmin = true; // Temporary: Allow everyone to settle matches for testing

  if (loading) return <div className="loading">Brewing your tea... 🍵</div>;

  return (
    <>
      <div className="bg-doodle doodle-1">🏏</div>
      <div className="bg-doodle doodle-4">🏆</div>

      <div className="app-container">
        {!user ? (
          <LoginView login={() => signInWithPopup(auth, googleProvider)} />
        ) : (
          <>
            {activeTab === 'home' && <HomeView user={user} stats={userStats} onShare={shareLink} />}
            {activeTab === 'bet' && (
              <BetView 
                matches={activeMatches} 
                votes={votes} 
                squadStats={squadStats}
                user={user}
                handleVote={handleVote}
              />
            )}
            {activeTab === 'matches' && <ScheduleView isAdmin={isAdmin} onAddMatch={addCustomMatch} />}
            {activeTab === 'ranks' && <RanksView squadStats={squadStats} />}
            {activeTab === 'profile' && (
              <ProfileView 
                user={user} 
                logout={() => signOut(auth)} 
                onSync={uploadSchedule}
                onSettle={finalizeWinner}
                activeMatches={activeMatches}
                isAdmin={isAdmin}
                addCustomMatch={addCustomMatch}
              />
            )}

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        )}
      </div>
    </>
  );
}

// VIEW COMPONENTS
function LoginView({ login }) {
  return (
    <div className="login-wrap fade-in">
      <div className="login-card">
        
        {/* BANNER */}
        <div className="login-banner card-banner">
          <div className="logo">ChaiBet 🍵</div>
          <div className="banner-sub">IPL bets with your actual friends</div>
        </div>

        {/* BODY */}
        <div className="card-body">
          
          {/* GROUP INFO */}
          <div className="welcome-row">
            <div className="group-avatar">🏏</div>
            <div className="welcome-text">
              <div className="welcome-title">Chai Squad's IPL 2025 🏆</div>
              <div className="welcome-sub">Login to place your bets, check the leaderboard & roast your friends</div>
            </div>
          </div>

          <button className="btn-google google-btn" onClick={login}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

        </div>

        {/* CARD FOOTER */}
        <div className="login-footer">
          <div className="login-footer-text">18+ only · Play responsibly</div>
        </div>

      </div>
    </div>
  );
}

function HomeView({ user, stats, onShare }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif" }}>ChaiBet Global 🏏</h2>
        <button onClick={onShare} style={{ background: 'var(--yellow)', border: '2px solid var(--dark)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 var(--dark)' }}>
          <Share2 size={18} />
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--yellow)', marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 800 }}>LIVE HOT TAKES 🔥</h4>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pick your winners and climb the global leaderboard!</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>💰</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>PROFITS</div>
          <div style={{ fontWeight: 800, color: stats.earnings >= 0 ? 'var(--teal)' : 'var(--error)' }}>
            ₹{stats.earnings}
          </div>
        </div>
        <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem' }}>🏆</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>TOTAL WINS</div>
          <div style={{ fontWeight: 800 }}>{stats.wins}</div>
        </div>
      </div>
    </div>
  );
}

function MatchTimer({ match }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const matchTime = parse(`${match.date} 2026 ${match.time}`, 'MMMM d yyyy h:mm a', new Date());
      if (isBefore(now, matchTime)) {
        const diff = matchTime - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft('CLOSED');
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [match]);

  return (
    <div style={{ color: timeLeft === 'CLOSED' ? 'var(--muted)' : 'var(--error)', fontWeight: 800, fontSize: '0.75rem' }}>
      {timeLeft === 'CLOSED' ? '🔒 CLOSED' : `CLOSES IN: ${timeLeft}`}
    </div>
  );
}

function BetView({ matches, votes, squadStats, user, handleVote }) {
  return (
    <div className="fade-in">
      <h3 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '1.5rem' }}>NEXT DAYS PICKS 🏏</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {matches.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5 }}>No matches open for betting right now. Check back tomorrow!</p>
        ) : matches.map(m => {
          const matchVotes = votes.filter(v => v.match_id === m.id);
          
          // Build squad members list from all users who have voted (any match)
          const knownUsersMap = new Map();
          votes.forEach(v => {
            if (!knownUsersMap.has(v.user_name)) {
              knownUsersMap.set(v.user_name, { name: v.user_name, photo: v.user_photo });
            }
          });
          if (user && !knownUsersMap.has(user.displayName)) {
            knownUsersMap.set(user.displayName, { name: user.displayName, photo: user.photoURL });
          }
          const squadMembers = Array.from(knownUsersMap.values());
          
          return (
            <div key={m.id} className="glass-card">
              <div style={{ padding: '1rem', borderBottom: '2px solid var(--dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{m.date} · {m.time}</div>
                <MatchTimer match={m} />
              </div>
              <div className="card-body" style={{ textAlign: 'center', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                  
                  {/* TEAM 1 COLUMN */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.teams[0]}</div>
                    <button className="btn-primary" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem' }} onClick={() => handleVote(m.id, m.teams[0])}>PICK</button>
                    
                    {/* Voters for Team 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      {squadMembers.filter(member => {
                         const uv = matchVotes.find(v => v.user_name === member.name);
                         return uv && uv.chosen_team === m.teams[0];
                      }).map(member => (
                          <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'white', border: '2px solid var(--dark)', borderRadius: '10px', boxShadow: '2px 2px 0 var(--teal)' }}>
                            <img src={member.photo} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--dark)' }} referrerPolicy="no-referrer" />
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name.split(' ')[0]}</div>
                          </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.2, marginTop: '40px' }}>VS</div>
                  
                  {/* TEAM 2 COLUMN */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.teams[1]}</div>
                    <button className="btn-primary" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem' }} onClick={() => handleVote(m.id, m.teams[1])}>PICK</button>
                    
                    {/* Voters for Team 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      {squadMembers.filter(member => {
                         const uv = matchVotes.find(v => v.user_name === member.name);
                         return uv && uv.chosen_team === m.teams[1];
                      }).map(member => (
                          <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'white', border: '2px solid var(--dark)', borderRadius: '10px', boxShadow: '2px 2px 0 var(--orange)' }}>
                            <img src={member.photo} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--dark)' }} referrerPolicy="no-referrer" />
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name.split(' ')[0]}</div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* WAITING SQUAD */}
                {(() => {
                  const waitingMembers = squadMembers.filter(member => !matchVotes.find(v => v.user_name === member.name));
                  if (waitingMembers.length === 0) return null;
                  
                  return (
                    <div style={{ marginTop: '1.5rem', borderTop: '2.5px dashed var(--border)', paddingTop: '1rem', textAlign: 'left' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.8rem', opacity: 0.6 }}>WAITING...</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {waitingMembers.map(member => (
                          <div key={member.name} title={member.name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--muted)', overflow: 'hidden', opacity: 0.5 }}>
                            <img src={member.photo} style={{ width: '100%', height: '100%' }} referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddMatchModal({ onClose, onAdd }) {
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('April');
  const [hour, setHour] = useState('7');
  const [minute, setMinute] = useState('30');
  const [ampm, setAmpm] = useState('PM');
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

  const team2Opts = IPL_TEAMS.filter(t => t !== team1);
  const labelStyle = { fontSize: '0.72rem', fontWeight: 800, display: 'block', marginBottom: '0.35rem', letterSpacing: '0.05em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.5rem 2rem', width: '100%', maxWidth: '480px', border: '3px solid var(--dark)', borderBottom: 'none', maxHeight: '92vh', overflowY: 'auto' }}>

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
            <input value="2026" disabled style={{ ...selectStyle, background: '#f0f0f0', cursor: 'not-allowed', color: 'var(--muted)' }} />
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
              {['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}
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
          <div style={{ background: 'var(--yellow)', border: '2px solid var(--dark)', borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
            📅 {team1} vs {team2}<br />
            <span style={{ fontWeight: 500 }}>{month} {day}, 2026 · {hour}:{minute} {ampm}</span>
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={saving}
          style={{ width: '100%', background: saving ? 'var(--muted)' : 'var(--teal)', fontSize: '0.9rem' }}>
          {saving ? 'Saving…' : '✅ Add Match'}
        </button>
      </div>
    </div>
  );
}

function ScheduleView({ isAdmin, onAddMatch }) {
  const [showModal, setShowModal] = useState(false);
  const now = new Date();
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
          <button className="btn-primary"
            style={{ fontSize: '0.72rem', padding: '0.45rem 0.9rem', background: 'var(--teal)', whiteSpace: 'nowrap' }}
            onClick={() => setShowModal(true)}>
            + Add Match
          </button>
        )}
      </div>

      {showModal && <AddMatchModal onClose={() => setShowModal(false)} onAdd={async (data) => { await onAddMatch(data); setShowModal(false); }} />}

      <div className="schedule-list">
        {IPL_SCHEDULE.map((m, index) => {
          const matchDate = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
          const isPast = isBefore(matchDate, now);
          const isToday = m.date === todayStr;
          const isNextFirst = !isPast && (index === 0 || isBefore(parse(`${IPL_SCHEDULE[index-1].date} 2026 ${IPL_SCHEDULE[index-1].time}`, 'MMMM d yyyy h:mm a', new Date()), now));

          return (
            <div
              key={m.num}
              ref={isNextFirst ? scrollRef : null}
              className="schedule-card"
              style={{
                borderColor: isPast ? 'var(--error)' : 'var(--teal)',
                background: isPast ? '#FFF0F5' : '#F0FFF7',
                borderWidth: isToday ? '3px' : '2px',
                opacity: isPast ? 0.7 : 1
              }}
            >
              <div className="schedule-info">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="match-num-badge" style={{ background: isPast ? '#eee' : 'var(--yellow)' }}>MATCH {m.num}</span>
                  {isToday && <span style={{ background: 'var(--orange)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>TODAY 🔥</span>}
                  {isPast ?
                    <span style={{ color: 'var(--error)', fontSize: '0.6rem', fontWeight: 'bold' }}>● OVER</span> :
                    <span style={{ color: 'var(--teal)', fontSize: '0.6rem', fontWeight: 'bold' }}>● {isToday ? 'LIVE / UPCOMING' : 'UPCOMING'}</span>
                  }
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

function RanksView({ squadStats }) {
  const sorted = Object.keys(squadStats).sort((a, b) => squadStats[b].earnings - squadStats[a].earnings);
  return (
    <div className="fade-in">
       <h3 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '1rem' }}>SQUAD RANKS 🏆</h3>
       <div className="glass-card" style={{ padding: '1rem' }}>
          {sorted.map((name, i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1.5px dashed var(--border)' }}>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, color: i < 3 ? 'var(--orange)' : 'var(--muted)' }}>#{i+1}</div>
                  <div style={{ fontWeight: 700 }}>{name}</div>
               </div>
               <div style={{ fontWeight: 800, color: squadStats[name].earnings >= 0 ? 'var(--teal)' : 'var(--error)' }}>
                ₹{squadStats[name].earnings}
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

function ProfileView({ user, logout, onSync, onSettle, activeMatches, isAdmin, addCustomMatch }) {
  return (
    <div className="fade-in" style={{ textAlign: 'center' }}>
       <div style={{ position: 'relative', display: 'inline-block' }}>
         <img src={user.photoURL} alt="pro" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--orange)', marginBottom: '1rem' }} />
         {isAdmin && <div style={{ position: 'absolute', bottom: '15px', right: '-10px', background: 'var(--teal)', color: 'white', fontSize: '0.6rem', padding: '3px 6px', borderRadius: '8px', fontWeight: 900, border: '2px solid var(--dark)' }}>ADMIN</div>}
       </div>
       <h3 style={{ fontFamily: "'Baloo 2', sans-serif" }}>{user.displayName}</h3>
       <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '2rem' }}>{user.email}</p>
       
       {isAdmin && (
         <div className="glass-card fade-in" style={{ textAlign: 'left', padding: '1.5rem', marginBottom: '1.5rem', background: '#FFFBF0' }}>
            <h4 style={{ fontFamily: "'Baloo 2', sans-serif", borderBottom: '2.5px dashed var(--dark)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--orange)' }}>
              👑 ADMIN DASHBOARD
            </h4>

            <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.6rem', background: 'var(--yellow)', color: 'var(--dark)', width: '100%', marginBottom: '1rem' }} onClick={addCustomMatch}>
              + Add Custom Match
            </button>

            <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.6rem', background: 'var(--muted)', width: '100%', marginBottom: '1.5rem' }} onClick={onSync}>
              ⚠️ Danger: Factory Reset & Re-Sync Schedule
            </button>
            
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>SETTLE RECENT MATCHES:</p>
              {activeMatches.map(m => (
                <button key={m.id} className="btn-primary" style={{ fontSize: '0.7rem', height: '35px', marginBottom: '5px', background: 'white', color: 'var(--dark)' }} onClick={() => onSettle(m.id, prompt(`Winner of ${m.fixture}?`))}>
                  Settle {m.num}
                </button>
              ))}
              {activeMatches.length === 0 && <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>No active matches to settle right now.</p>}
            </div>
         </div>
       )}

       <button className="btn-primary" onClick={logout} style={{ background: 'var(--dark)' }}>Log Out 👋</button>
    </div>
  );
}


function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      <div className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><span className="nav-emoji">🏠</span><span className="nav-label">Home</span></div>
      <div className={`nav-tab ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}><span className="nav-emoji">📅</span><span className="nav-label">Matches</span></div>
      <div className="nav-center-btn" onClick={() => setActiveTab('bet')}><span className="nav-emoji">🏏</span><span className="nav-label">BET</span></div>
      <div className={`nav-tab ${activeTab === 'ranks' ? 'active' : ''}`} onClick={() => setActiveTab('ranks')}><span className="nav-emoji">🏆</span><span className="nav-label">Ranks</span></div>
      <div className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><span className="nav-emoji">👤</span><span className="nav-label">Profile</span></div>
    </nav>
  );
}
