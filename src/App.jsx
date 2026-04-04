import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { Trophy, Users, Clock, Flame, LogOut, ShieldCheck, Mail, Target, Coins, Zap, Home, Calendar, User, LayoutGrid, Share2, Copy } from 'lucide-react';
import { format, isBefore, setHours, setMinutes, setSeconds, addDays, parse } from 'date-fns';


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
    const members = roomSettings.members || [];
    
    // Seed stats with all official members
    members.forEach(m => {
      stats[m.name] = { wins: 0, earnings: 0, photo: m.photo };
    });

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
          // Dynamically add voters to stats if they aren't explicitly registered yet (fallback)
          if (!stats[v.user_name]) stats[v.user_name] = { wins: 0, earnings: 0, photo: v.user_photo };
          
          if (v.chosen_team === winner) {
            stats[v.user_name].wins += 1;
            stats[v.user_name].earnings += (individualPayout - roomSettings.bet_amount);
          } else {
            stats[v.user_name].earnings -= roomSettings.bet_amount;
          }
        });
      }
    });
    return stats;
  }, [votes, matchResults, roomSettings.bet_amount, roomSettings.members]);

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

  const updateSettings = async (updates, silent = false) => {
    console.log('📝 updateSettings called with:', updates);
    try {
      console.log('🔍 Querying room_settings collection...');
      const q = query(collection(db, 'room_settings'), limit(1));
      const snap = await getDocs(q);
      console.log('📦 Snapshot empty?', snap.empty, '| docs:', snap.size);

      const merged = { 
        ...roomSettings, 
        ...updates, 
        creator_uid: updates.creator_uid || roomSettings.creator_uid || user.uid,
        admins: roomSettings.admins || [user.uid]
      };
      console.log('📋 Writing to Firestore:', JSON.stringify(merged, null, 2));

      if (snap.empty) {
        console.log('➕ No existing doc — creating new document...');
        const docRef = await addDoc(collection(db, 'room_settings'), merged);
        console.log('✅ Document created! ID:', docRef.id);
      } else {
        console.log('✏️ Existing doc found — updating:', snap.docs[0].id);
        await updateDoc(snap.docs[0].ref, merged);
        console.log('✅ Document updated!');
      }

      // Immediately update local state — don't wait for onSnapshot
      setRoomSettings(prev => ({ ...prev, ...merged }));
      console.log('🔄 Local state updated with merged settings');

      if (!silent) alert('Settings updated!');
      return true;
    } catch (e) {
      console.error('🔴 Firebase error code:', e.code);
      console.error('🔴 Firebase error message:', e.message);
      console.error('🔴 Full error:', e);
      return false;
    }
  };

  const manageAdmins = () => {
    const memberNames = (roomSettings.members || []).map(m => m.name).join(', ');
    const targetName = prompt(`Who do you want to make an Admin?\nOptions: ${memberNames}\n(Enter exact name)`);
    if (!targetName) return;
    
    const currentAdmins = roomSettings.admin_names || [];
    if (!currentAdmins.includes(targetName)) {
      updateSettings({ admin_names: [...currentAdmins, targetName] });
      alert(`${targetName} is now an Admin!`);
    } else {
      alert(`${targetName} is already an Admin.`);
    }
  };

  const addCustomMatch = async () => {
    const fixture = prompt("Enter custom match teams (e.g. India vs Australia):");
    if (!fixture) return;
    const date = prompt("Enter date (e.g. May 1):", format(new Date(), 'MMMM d'));
    if (!date) return;
    
    const [t1, t2] = fixture.split(' vs ');
    const num = IPL_SCHEDULE.length + activeMatches.length + Math.floor(Math.random() * 100);
    
    await addDoc(collection(db, 'matches'), { 
      num, date, fixture, t1, t2, 
      time: "Evening", created_at: new Date().toISOString() 
    });
    alert("Custom Match Added!");
  };

  const finalizeWinner = async (matchId, winner) => {
    if (!winner || !confirm(`Settle ${winner}?`)) return;
    await addDoc(collection(db, 'match_results'), { match_id: matchId, winner_team: winner, settled_at: new Date().toISOString() });
    alert("Settled!");
  };

  const shareLink = async () => {
    const code = roomSettings.invite_code || 'chai2025';
    const text = `Join my IPL Betting Room: ${roomSettings.squad_name}! 🍵🏏\n\nUse Invite Code: ${code}\n\n`;
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'ChaiBet', text, url });
      } catch (e) {
        navigator.clipboard.writeText(`${text} ${url}`);
        alert(`Link & Invite Code (${code}) copied to clipboard!`);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert(`Link & Invite Code (${code}) copied to clipboard!`);
    }
  };

  // Determine access rights
  const isCreatorSetup = !roomSettings.creator_uid; // Needs initial setup
  const isCreator = user && roomSettings.creator_uid === user.uid;
  const isMember = user && roomSettings.members?.some(m => m.uid === user.uid);
  const isAdmin = user && (isCreatorSetup || isCreator || roomSettings.admin_names?.includes(user.displayName));
  const hasAccess = isCreatorSetup || isCreator || isMember;

  const handleCreateRoom = async (squadName, inviteCode, betAmount, setLoading, setError, setStatus) => {
    setLoading(true);
    setError('');
    setStatus('Connecting to Firebase...');
    
    const ok = await updateSettings({
      squad_name: squadName,
      invite_code: inviteCode,
      bet_amount: betAmount,
      creator_uid: user.uid,
      members: [{ uid: user.uid, name: user.displayName, photo: user.photoURL, joined_at: new Date().toISOString() }],
      admin_names: [user.displayName]
    }, true);

    if (ok) {
      setStatus('Room created! Taking you in...');
      // State was already updated directly in updateSettings, UI will transition
      setTimeout(() => setLoading(false), 1000);
    } else {
      setError('Could not save to database. Open DevTools console for details.');
      setStatus('');
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const code = e.target.inviteCode.value;
    if (code === (roomSettings.invite_code || "chai2025")) {
      const updatedMembers = [...(roomSettings.members || []), { uid: user.uid, name: user.displayName, photo: user.photoURL, joined_at: new Date().toISOString() }];
      await updateSettings({ members: updatedMembers });
      alert("Welcome to the Squad!");
    } else {
      alert("Invalid Invite Code 😂 Ask the Admin!");
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
        ) : isCreatorSetup ? (
          <CreateRoomView user={user} onCreate={handleCreateRoom} logout={() => signOut(auth)} />
        ) : !hasAccess ? (
          <JoinView onJoin={handleJoin} logout={() => signOut(auth)} />
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
                isAdmin={isAdmin}
                manageAdmins={manageAdmins}
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
  const [tab, setTab] = useState('login');
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="login-wrap fade-in">
      <div className="login-card">
        
        {/* BANNER */}
        <div className="login-banner card-banner">
          <div className="logo">ChaiBet 🍵</div>
          <div className="banner-sub">IPL bets with your actual friends</div>
        </div>

        {/* PRIVATE BADGE */}
        <div className="private-badge">
          <div className="private-pill">🔒 Private Group Access Only</div>
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

          {/* MEMBERS */}
          <div className="members-row">
            <div className="member-avatars">
              <div className="m-av">😎</div>
              <div className="m-av">🤓</div>
              <div className="m-av">🥳</div>
              <div className="m-av">😤</div>
              <div className="m-av" style={{ background: 'var(--yellow)', fontSize: '0.6rem', fontWeight: 700, color: 'var(--dark)' }}>+4</div>
            </div>
            <div className="members-text"><strong>8 members</strong> · 3 online now 🟢</div>
          </div>

          {/* TABS */}
          <div className="tab-row">
            <div className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Login 🙋</div>
            <div className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>New here? 👋</div>
          </div>

          {/* LOGIN FORM */}
          <div style={{ display: tab === 'login' ? 'block' : 'none' }}>
            <div className="field-group">
              <label>Your Name / Nickname</label>
              <div className="input-wrap">
                <span className="field-icon">😄</span>
                <input type="text" placeholder="e.g. Rahul, Bhai, Paaji…" />
              </div>
            </div>
            <div className="field-group">
              <label>Password</label>
              <div className="input-wrap">
                <span className="field-icon">🔑</span>
                <input type={showPwd ? "text" : "password"} placeholder="Shhh… only the gang knows" />
                <button className="eye-btn" onClick={() => setShowPwd(!showPwd)}>👁️</button>
              </div>
            </div>
            <div className="forgot-row">
              <a className="forgot-link" onClick={() => alert("Ask the group chat! 😂")}>Forgot password? Ask Rahul 😂</a>
            </div>

            <button className="login-btn" onClick={() => alert("Please use Google Sign-in to access the room for now!")}>Let's Goooo 🚀</button>

            <div className="divider">
              <div className="divider-line"></div>
              <div className="divider-text">or jump in with</div>
              <div class="divider-line"></div>
            </div>

            <button className="btn-google google-btn" onClick={login}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>

          {/* SIGNUP FORM */}
          <div style={{ display: tab === 'signup' ? 'block' : 'none' }}>
            <div className="field-group">
              <label>Your Name / Nickname</label>
              <div className="input-wrap">
                <span className="field-icon">😄</span>
                <input type="text" placeholder="What do the boys call you?" />
              </div>
            </div>
            <div className="field-group">
              <label>Group Invite Code</label>
              <div className="input-wrap">
                <span className="field-icon">🎟️</span>
                <input type="text" placeholder="Got a code? Drop it here" />
              </div>
            </div>
            <div className="field-group">
              <label>Set a Password</label>
              <div className="input-wrap">
                <span className="field-icon">🔑</span>
                <input type={showPwd ? "text" : "password"} placeholder="Make it something stupid 😂" />
                <button className="eye-btn" onClick={() => setShowPwd(!showPwd)}>👁️</button>
              </div>
            </div>

            <button className="login-btn" style={{ background: 'var(--teal)' }} onClick={() => alert("Please use Google Sign-in to access the room for now!")}>Join the Gang 🎉</button>

            <div className="divider">
              <div className="divider-line"></div>
              <div className="divider-text">or jump in with</div>
              <div className="divider-line"></div>
            </div>

            <button className="btn-google google-btn" onClick={login}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign up with Google
            </button>
          </div>

        </div>

        {/* CARD FOOTER */}
        <div className="login-footer">
          <div className="login-footer-text">
            {tab === 'login' ? (
              <>Not in the group yet? <a onClick={() => setTab('signup')}>Ask for an invite code 🎟️</a></>
            ) : (
              <>Already in the gang? <a onClick={() => setTab('login')}>Login here 🙋</a></>
            )}
          </div>
        </div>

      </div>

      <div className="bottom-note">
        🔒 Private group · <strong>No public access</strong> · 18+ only · Play responsibly
      </div>
    </div>
  );
}

function CreateRoomView({ user, onCreate, logout }) {
  const [squadName, setSquadName] = React.useState('Chai Squad');
  const [inviteCode, setInviteCode] = React.useState('chai2025');
  const [betAmount, setBetAmount] = React.useState(50);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('');

  const BET_PRESETS = [10, 25, 50, 100, 200];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!squadName.trim()) return setError('Please enter a squad name.');
    if (!inviteCode.trim() || inviteCode.includes(' ')) return setError('Invite code cannot be empty or have spaces.');
    if (betAmount < 1) return setError('Bet amount must be at least ₹1.');
    onCreate(squadName.trim(), inviteCode.trim(), betAmount, setLoading, setError, setStatus);
  };

  return (
    <div className="login-wrap fade-in">
      <div className="login-card" style={{ maxWidth: '480px' }}>
        <div className="login-banner card-banner" style={{ background: 'linear-gradient(135deg, #FF6B2B, #ff9a5c)', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏏</div>
          <div className="logo" style={{ fontSize: '1.6rem' }}>Create Your Room</div>
          <div className="banner-sub">Set up your private IPL betting squad</div>
        </div>

        {/* Admin badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderBottom: '2px dashed var(--border)', background: '#fffbf5' }}>
          {user?.photoURL && <img src={user.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--orange)' }} />}
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{user?.displayName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>👑 You will be the Room Admin</div>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Squad Name */}
            <div className="field-group">
              <label>🏟️ Squad Name</label>
              <div className="input-wrap">
                <input
                  type="text"
                  placeholder="e.g. The B-Boys, Thalas XI"
                  value={squadName}
                  onChange={e => setSquadName(e.target.value)}
                  required
                  maxLength={30}
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            {/* Bet Amount */}
            <div className="field-group">
              <label>💰 Bet Amount (₹ per match)</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {BET_PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBetAmount(p)}
                    style={{
                      padding: '0.3rem 0.8rem',
                      borderRadius: '999px',
                      border: '2px solid var(--dark)',
                      background: betAmount === p ? 'var(--orange)' : 'white',
                      color: betAmount === p ? 'white' : 'var(--dark)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >₹{p}</button>
                ))}
              </div>
              <div className="input-wrap">
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={betAmount}
                  onChange={e => setBetAmount(Number(e.target.value))}
                  min={1}
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
            </div>

            {/* Invite Code */}
            <div className="field-group">
              <label>🎟️ Secret Invite Code</label>
              <div className="input-wrap">
                <input
                  type="text"
                  placeholder="No spaces (e.g. chai2025)"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.replace(/\s/g, ''))}
                  required
                  style={{ paddingLeft: '1rem', letterSpacing: '0.1em', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Preview card */}
            <div style={{ background: 'var(--yellow)', border: '2px solid var(--dark)', borderRadius: '12px', padding: '1rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '0.4rem' }}>📋 Room Preview</div>
              <div>🏟️ <strong>{squadName || '—'}</strong></div>
              <div>💰 ₹<strong>{betAmount}</strong> per match</div>
              <div>🎟️ Code: <strong style={{ color: 'var(--orange)' }}>{inviteCode || '—'}</strong></div>
            </div>

            {/* Status */}
            {status && !error && (
              <div style={{ background: '#f0fff4', border: '2px solid #22c55e', borderRadius: '10px', padding: '0.75rem', color: '#166534', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span> {status}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#fff0f0', border: '2px solid #ff3b3b', borderRadius: '10px', padding: '0.75rem', color: '#cc0000', fontWeight: 700, fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              style={{ background: loading ? 'var(--muted)' : 'var(--orange)', marginTop: '0.25rem', fontSize: '1rem', position: 'relative' }}
            >
              {loading ? '⏳ Creating Room...' : '🚀 Start the League'}
            </button>
          </form>

          <button
            onClick={logout}
            style={{ marginTop: '1.5rem', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', width: '100%', fontWeight: 700, fontSize: '0.85rem' }}
          >← Logout / Switch Account</button>
        </div>
      </div>
    </div>
  );
}

function JoinView({ onJoin, logout }) {
  return (
    <div className="login-wrap fade-in">
      <div className="login-card">
        <div className="login-banner card-banner" style={{ background: 'var(--teal)' }}>
          <div className="logo">Join the Squad 🍵</div>
          <div className="banner-sub">You need an invite code to enter</div>
        </div>
        <div className="card-body">
           <form onSubmit={onJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="field-group">
                <label>Invite Code</label>
                <div className="input-wrap">
                  <span className="field-icon">🎟️</span>
                  <input type="text" name="inviteCode" placeholder="Enter code from Admin" required />
                </div>
              </div>
              <button type="submit" className="login-btn" style={{ background: 'var(--teal)' }}>Enter Room 🚀</button>
           </form>
           <button onClick={logout} style={{ marginTop: '1.5rem', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', width: '100%', fontWeight: 800 }}>Logout / Switch Account</button>
        </div>
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
          
          const squadMembers = roomSettings.members || [];
          
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
                <div style={{ marginTop: '1.5rem', borderTop: '2.5px dashed var(--border)', paddingTop: '1rem', textAlign: 'left' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.8rem', opacity: 0.6 }}>SQUAD STATUS:</p>
                  {squadMembers.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Waiting for members to join...</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '10px' }}>
                      {squadMembers.map(member => {
                        const userVote = matchVotes.find(v => v.user_id === member.uid);
                        return (
                          <div key={member.uid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'white', border: '2px solid var(--dark)', borderRadius: '12px', boxShadow: '3px 3px 0 var(--border)' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: userVote ? 'none' : '#F0F0F0', border: '1.5px solid var(--dark)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                              {userVote ? <img src={userVote.user_photo} style={{ width: '100%', height: '100%' }} referrerPolicy="no-referrer" /> : <img src={member.photo} style={{ width: '100%', height: '100%', opacity: 0.4 }} referrerPolicy="no-referrer" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name.split(' ')[0]}</div>
                              <div style={{ fontSize: '0.62rem', fontWeight: 900, color: userVote ? 'var(--orange)' : 'var(--muted)' }}>
                                {userVote ? userVote.chosen_team : 'WAITING...'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
      <h3 style={{ fontFamily: "'Baloo 2', sans-serif", marginBottom: '1rem' }}>IPL CALENDAR 📅</h3>
      <div className="schedule-list">
        {IPL_SCHEDULE.map((m, index) => {
          // Parse match time: "April 4 3:30 PM"
          const matchDate = parse(`${m.date} 2026 ${m.time}`, 'MMMM d yyyy h:mm a', new Date());
          const isPast = isBefore(matchDate, now);
          const isToday = m.date === todayStr;
          
          // First upcoming or current match to scroll to
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

function ProfileView({ user, logout, roomSettings, onSync, onUpdate, onSettle, activeMatches, isAdmin, manageAdmins, addCustomMatch }) {
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.6rem' }} onClick={() => onUpdate({ squad_name: prompt("New Squad Name:", roomSettings.squad_name) })}>
                Rename Room
              </button>
              <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.6rem', background: 'var(--teal)' }} onClick={() => onUpdate({ bet_amount: Number(prompt("Bet Per Match (rs):", roomSettings.bet_amount)) })}>
                Set Bet (₹{roomSettings.bet_amount})
              </button>
              <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.6rem', background: 'var(--telegram, #0088cc)', color: 'white' }} onClick={() => onUpdate({ invite_code: prompt("New Invite Code (no spaces):", roomSettings.invite_code || 'chai2025') })}>
                Set Invite Code
              </button>
              <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.6rem', background: 'white', color: 'var(--dark)' }} onClick={manageAdmins}>
                Manage Admins
              </button>
            </div>
            
            <p style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem', background: '#eef', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
              Current Invite Code: <span style={{ color: 'var(--orange)', fontSize: '0.9rem' }}>{roomSettings.invite_code || 'chai2025'}</span>
            </p>

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
