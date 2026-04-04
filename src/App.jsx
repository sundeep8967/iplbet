import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Trophy, Users, Clock, Flame, LogOut, ShieldCheck, Mail, Target, Coins, Zap, Home, Calendar, User, LayoutGrid, Share2, Copy } from 'lucide-react';
import { format, isBefore, setHours, setMinutes, setSeconds, addDays, parse } from 'date-fns';

const ALLOWED_MEMBERS = ['Aravind', 'Sai Vishnu', 'Sanjay', 'Sundeep', 'VN Karthik'];

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

export default function App() {
  const [user, setUser] = useState(null);
  const [activeMatches, setActiveMatches] = useState([]);
  const [votes, setVotes] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [roomSettings, setRoomSettings] = useState({ bet_amount: 50, squad_name: "Chai Squad" });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [timeLeft, setTimeLeft] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  // 1. Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Filtered Match Detection (Next Days)
  // Only shows matches where the voting deadline hasn't passed
  useEffect(() => {
    const detectMatches = () => {
      const now = new Date();
      const cutoff = setSeconds(setMinutes(setHours(new Date(), 18), 59), 0);
      const today = format(now, 'MMMM d');
      const tomorrow = format(addDays(now, 1), 'MMMM d');
      const dayAfter = format(addDays(now, 2), 'MMMM d');
      
      const allUpcoming = IPL_SCHEDULE.filter(m => {
        if (m.date === today) return isBefore(now, cutoff);
        return m.date === tomorrow || m.date === dayAfter;
      }).map(m => {
        const [t1, t2] = m.fixture.split(' vs ');
        return { ...m, id: `ipl-2025-${m.num}`, teams: [t1, t2] };
      });
      
      setActiveMatches(allUpcoming);
      // If today is closed, effectively voting logic will lock these out
      setIsClosed(!isBefore(now, cutoff));
    };
    detectMatches();
    const interval = setInterval(detectMatches, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // 3. Real-time Global Data
  useEffect(() => {
    const vQ = query(collection(db, 'votes'), orderBy('created_at', 'desc'));
    const rQ = query(collection(db, 'match_results'), orderBy('settled_at', 'desc'));
    const sQ = query(collection(db, 'room_settings'), limit(1));

    const unsubVotes = onSnapshot(vQ, (snap) => setVotes(snap.docs.map(doc => doc.data())));
    const unsubResults = onSnapshot(rQ, (snap) => setMatchResults(snap.docs.map(doc => doc.data())));
    const unsubSettings = onSnapshot(sQ, (snap) => {
      if (!snap.empty) setRoomSettings(snap.docs[0].data());
    });

    return () => { unsubVotes(); unsubResults(); unsubSettings(); };
  }, []);

  // 4. Timer logic for UI
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const cutoff = setSeconds(setMinutes(setHours(new Date(), 18), 59), 0);
      if (isBefore(now, cutoff)) {
        const diff = cutoff - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft('CLOSED');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 5. Shared Calculations (Memoized)
  const squadStats = useMemo(() => {
    const stats = {};
    ALLOWED_MEMBERS.forEach(m => stats[m] = { wins: 0, earnings: 0 });

    matchResults.forEach(res => {
      const matchId = res.match_id;
      const winner = res.winner_team;
      const mVotes = votes.filter(v => v.match_id === matchId);
      if (mVotes.length === 0) return;

      const pot = mVotes.length * roomSettings.bet_amount;
      const winnersCount = mVotes.filter(v => v.chosen_team === winner).length;
      
      if (winnersCount > 0 && winnersCount < mVotes.length) {
        const individualPayout = Math.floor(pot / winnersCount);
        mVotes.forEach(v => {
          if (v.chosen_team === winner && stats[v.user_name]) {
            stats[v.user_name].wins += 1;
            stats[v.user_name].earnings += (individualPayout - roomSettings.bet_amount);
          } else if (stats[v.user_name]) {
            stats[v.user_name].earnings -= roomSettings.bet_amount;
          }
        });
      }
    });
    return stats;
  }, [votes, matchResults, roomSettings.bet_amount]);

  const userStats = useMemo(() => {
    const name = user?.displayName;
    if (!name || !squadStats[name]) return { wins: 0, earnings: 0 };
    return squadStats[name];
  }, [user, squadStats]);

  const totalPot = useMemo(() => {
    return votes.length * roomSettings.bet_amount;
  }, [votes, roomSettings.bet_amount]);

  const handleVote = async (matchId, team) => {
    const now = new Date();
    const cutoff = setSeconds(setMinutes(setHours(new Date(), 18), 59), 0);
    
    // Only block if it's the current day's match
    const match = activeMatches.find(m => m.id === matchId);
    if (match?.date === format(now, 'MMMM d') && !isBefore(now, cutoff)) {
      alert("POLL CLOSED for today's match!");
      return;
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

  const updateSettings = async (updates) => {
    try {
      const q = query(collection(db, 'room_settings'), limit(1));
      const snap = await getDocs(q);
      const ref = snap.empty ? collection(db, 'room_settings') : snap.docs[0].ref;
      
      if (snap.empty) {
        await addDoc(ref, { ...roomSettings, ...updates, creator_uid: user.uid });
      } else {
        // Just adding a new doc is easier for now to override
        await addDoc(collection(db, 'room_settings'), { ...roomSettings, ...updates, creator_uid: user.uid });
      }
      alert("Settings updated!");
    } catch (e) { console.error(e); }
  };

  const finalizeWinner = async (matchId, winner) => {
    if (!winner || !confirm(`Settle ${winner}?`)) return;
    await addDoc(collection(db, 'match_results'), { match_id: matchId, winner_team: winner, settled_at: new Date().toISOString() });
    alert("Settled!");
  };

  const shareLink = async () => {
    const text = `Join my IPL Betting Room: ${roomSettings.squad_name}! 🍵🏏`;
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ChaiBet', text, url });
      } catch (e) { console.error(e); }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert("Link copied to clipboard!");
    }
  };

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
            {activeTab === 'home' && <HomeView user={user} stats={userStats} settings={roomSettings} onShare={shareLink} />}
            {activeTab === 'bet' && (
              <BetView 
                matches={activeMatches} 
                votes={votes} 
                roomSettings={roomSettings} 
                timeLeft={timeLeft}
                handleVote={handleVote}
              />
            )}
            {activeTab === 'matches' && <ScheduleView />}
            {activeTab === 'ranks' && <RanksView squadStats={squadStats} />}
            {activeTab === 'profile' && (
              <ProfileView 
                user={user} 
                logout={() => signOut(auth)} 
                roomSettings={roomSettings}
                onSync={uploadSchedule}
                onUpdate={updateSettings}
                onSettle={finalizeWinner}
                activeMatches={activeMatches}
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
    <div className="glass-card">
      <div className="card-banner"><div className="logo">ChaiBet 🍵</div></div>
      <div className="card-body" style={{ textAlign: 'center' }}>
        <button className="btn-primary" onClick={login}>Enter Arena 🚀</button>
      </div>
    </div>
  );
}

function HomeView({ user, stats, settings, onShare }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif" }}>{settings.squad_name} 🏏</h2>
        <button onClick={onShare} style={{ background: 'var(--yellow)', border: '2px solid var(--dark)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 var(--dark)' }}>
          <Share2 size={18} />
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--yellow)', marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 800 }}>LIVE HOT TAKES 🔥</h4>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Invite your friends to start roasting their picks!</p>
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

      <button className="btn-primary" onClick={onShare} style={{ marginTop: '2rem', background: 'var(--orange)' }}>
        Invite Friends to Room 🤝
      </button>
    </div>
  );
}

function BetView({ matches, votes, roomSettings, timeLeft, handleVote }) {
  return (
    <div className="fade-in">
      <h3 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '1.5rem' }}>NEXT DAYS PICKS 🏏</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {matches.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5 }}>No matches open for betting right now. Check back tomorrow!</p>
        ) : matches.map(m => {
          const matchVotes = votes.filter(v => v.match_id === m.id);
          const isToday = m.date === format(new Date(), 'MMMM d');
          
          return (
            <div key={m.id} className="glass-card">
              <div style={{ padding: '1rem', borderBottom: '2px solid var(--dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{m.date} · {m.time}</div>
                {isToday && <div style={{ color: 'var(--error)', fontWeight: 800, fontSize: '0.75rem' }}>CLOSES IN: {timeLeft}</div>}
              </div>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px' }}>{m.teams[0]}</div>
                    <button className="btn-primary" style={{ padding: '0.5rem' }} onClick={() => handleVote(m.id, m.teams[0])}>PICK</button>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, opacity: 0.2 }}>VS</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px' }}>{m.teams[1]}</div>
                    <button className="btn-primary" style={{ padding: '0.5rem' }} onClick={() => handleVote(m.id, m.teams[1])}>PICK</button>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                  {matchVotes.map((v, i) => (
                    <img key={i} src={v.user_photo} title={v.user_name} style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid var(--dark)' }} referrerPolicy="no-referrer" />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleView() {
  return (
    <div className="fade-in">
      <h3 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '1rem' }}>IPL CALENDAR 📅</h3>
      <div className="schedule-list">
        {IPL_SCHEDULE.map(m => (
          <div key={m.num} className="schedule-card">
            <div className="schedule-info">
              <span className="match-num-badge">MATCH {m.num}</span>
              <h5>{m.fixture}</h5>
              <p>{m.date} · {m.time}</p>
            </div>
          </div>
        ))}
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

function ProfileView({ user, logout, roomSettings, onSync, onUpdate, onSettle, activeMatches }) {
  return (
    <div className="fade-in" style={{ textAlign: 'center' }}>
       <img src={user.photoURL} alt="pro" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--orange)', marginBottom: '1rem' }} />
       <h3 style={{ fontFamily: "'Baloo 2', sans-serif" }}>{user.displayName}</h3>
       <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '2rem' }}>{user.email}</p>
       
       <div className="glass-card" style={{ textAlign: 'left', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontFamily: "'Baloo 2', sans-serif", borderBottom: '2px solid var(--dark)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>SQUAD SETTINGS</h4>
          <button className="btn-primary" style={{ fontSize: '0.85rem', marginBottom: '10px' }} onClick={() => onUpdate({ squad_name: prompt("New Squad Name:", roomSettings.squad_name) })}>
            Rename Squad Room
          </button>
          <button className="btn-primary" style={{ fontSize: '0.85rem', background: 'var(--teal)' }} onClick={() => onUpdate({ bet_amount: Number(prompt("Bet Per Match (rs):", roomSettings.bet_amount)) })}>
            Change Bet Amount (₹{roomSettings.bet_amount})
          </button>
          <button className="btn-primary" style={{ fontSize: '0.85rem', background: 'var(--yellow)', color: 'var(--dark)', marginTop: '10px' }} onClick={onSync}>
            Re-Sync Full Schedule
          </button>
          
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }}>SETTLE RECENT MATCHES:</p>
            {activeMatches.map(m => (
              <button key={m.id} className="btn-primary" style={{ fontSize: '0.7rem', height: '35px', marginBottom: '5px', background: 'white', color: 'var(--dark)' }} onClick={() => onSettle(m.id, prompt(`Winner of ${m.fixture}?`))}>
                Settle {m.num}
              </button>
            ))}
          </div>
       </div>

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
