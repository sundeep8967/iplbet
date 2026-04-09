import { useState, useEffect, useMemo, useCallback } from 'react';
import { isBefore, addHours, addMinutes, parse, subMinutes, format } from 'date-fns';
import translations from '../i18n';

// Services
import { onAuthChanged, loginWithGoogle, logoutUser } from '../services/authService';
import {
  subscribeVotes,
  subscribeResults,
  subscribeCustomMatches,
  addVote,
  removeVote,
  addCustomMatch as addCustomMatchService,
  uploadSchedule as uploadScheduleService,
  finalizeWinner as finalizeWinnerService,
  overrideMatchResult as overrideMatchResultService,
  shareLink as shareLinkService,
  deleteMatch as deleteMatchService,
  addAdminUser as addAdminUserService,
  removeAdminUser as removeAdminUserService,
  subscribeAdmins,
  subscribeAllUsers,
  saveUserToDatabase,
} from '../services/firestoreService';

// Models
import { computeActiveMatches, computeOngoingMatches, computeSquadStats, computeUserStats } from '../models/statsModel';
import { BET_AMOUNT, BET_LOCK_MINUTES, IPL_SCHEDULE } from '../models/constants';

/**
 * useAppController
 *
 * The single controller for the entire app.
 * Owns all state, wires services to models, and exposes clean handlers to views.
 */
export function useAppController() {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [activeTab, setActiveTab]             = useState('home');
  const [viewingHistoryFor, setViewingHistoryFor] = useState(null);

  const [votes, setVotes]                     = useState([]);
  const [matchResults, setMatchResults]       = useState([]);
  const [customMatches, setCustomMatches]     = useState([]);
  const [adminList, setAdminList]             = useState([]);
  const [allUsers, setAllUsers]               = useState([]);
  const [language, setLanguage]               = useState(localStorage.getItem('app_lang') || 'en');

  // Minute tick — drives activeMatches recomputation without a timer-in-useMemo
  const [tick, setTick] = useState(0);

  // ─── EFFECTS ────────────────────────────────────────────────────────────────

  // 1. Auth listener
  useEffect(() => onAuthChanged(u => { setUser(u); setLoading(false); }), []);

  // 2. Heartbeat tick (every 5 seconds for precise bet locking)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  // Fire-and-forget sync for saving user emails
  useEffect(() => {
    if (user) saveUserToDatabase(user);
  }, [user]);

  // 3. Real-time Firestore subscriptions
  useEffect(() => {
    if (!user) return; // Wait until the user is authenticated

    const unsubVotes   = subscribeVotes(setVotes);
    const unsubResults = subscribeResults(setMatchResults);
    const unsubMatches = subscribeCustomMatches(setCustomMatches);
    const unsubAdmins  = subscribeAdmins(setAdminList);
    const unsubUsers   = subscribeAllUsers(setAllUsers);
    
    return () => { unsubVotes(); unsubResults(); unsubMatches(); unsubAdmins(); unsubUsers(); };
  }, [user]);

  // ─── DERIVED STATE (MODELS) ──────────────────────────────────────────────────

  const allMatches = useMemo(() => {
    return [
      ...IPL_SCHEDULE.map(m => ({ ...m, id: `ipl-2025-${m.num}` })),
      ...customMatches,
    ].map(m => {
      if (!m.teams) {
        const [t1, t2] = m.fixture.split(' vs ');
        return { ...m, teams: [t1, t2] };
      }
      return m;
    })
    .sort((a, b) => parse(`${a.date} 2026 ${a.time}`, 'MMMM d yyyy h:mm a', new Date()) - parse(`${b.date} 2026 ${b.time}`, 'MMMM d yyyy h:mm a', new Date()));
  }, [customMatches]);
  
  const activeMatches = useMemo(
    () => computeActiveMatches(customMatches, tick),
    [customMatches, tick]
  );

  const ongoingMatches = useMemo(
    () => computeOngoingMatches(customMatches, matchResults, tick),
    [customMatches, matchResults, tick]
  );

  const squadStatsObj = useMemo(
    () => computeSquadStats(votes, matchResults, allUsers),
    [votes, matchResults, allUsers]
  );
  
  const squadStats = squadStatsObj.statsMap;
  const matchLogs = squadStatsObj.matchLogs;

  const userStats = useMemo(
    () => computeUserStats(user, squadStatsObj),
    [user, squadStatsObj]
  );

  const totalPot = useMemo(() => votes.length * BET_AMOUNT, [votes]);

  // ─── HANDLERS ───────────────────────────────────────────────────────────────

  const handleVote = async (matchId, team) => {
    const match = activeMatches.find(m => m.id === matchId);
    if (match) {
      const matchTime = parse(
        `${match.date} 2026 ${match.time}`,
        'MMMM d yyyy h:mm a',
        new Date()
      );
      const lockTime = subMinutes(matchTime, BET_LOCK_MINUTES);
      if (!isBefore(new Date(), lockTime)) {
        alert(`POLL CLOSED — Bets lock exactly ${BET_LOCK_MINUTES} minutes prior to start!`);
        return;
      }
    }
    if (!user) return;
    try {
      const existing = votes.find(v => v.match_id === matchId && v.user_name === user.displayName);
      if (existing && existing.chosen_team === team) {
        // Same team clicked again → Un-pick
        await removeVote(matchId, user.uid);
        alert(`Unpicked ${team}!`);
        return;
      }
      await addVote(user, matchId, team);
      alert(`Voted for ${team}!`);
    } catch (e) {
      console.error(e);
      alert('Action failed. Please try again.');
    }
  };

  const handleAddCustomMatch = async (data) => {
    await addCustomMatchService(data);
  };

  const handleUploadSchedule = async () => {
    await uploadScheduleService();
  };

  const handleFinalizeWinner = async (matchId, winner, existingResultId) => {
    // 1. Validation: Match must have started at least 4 hours ago (IPL match duration buffer)
    const match = allMatches.find(m => m.id === matchId);
    if (match) {
      const matchTime = parse(`${match.date} 2026 ${match.time}`, 'MMMM d yyyy h:mm a', new Date());
      const settleLockTime = addMinutes(matchTime, 210);
      if (isBefore(new Date(), settleLockTime)) {
        alert(`FORBIDDEN: Match started less than 3h 30m ago. Settle period opens at ${format(settleLockTime, 'h:mm a')}.`);
        return;
      }
    }
    await finalizeWinnerService(matchId, winner, existingResultId);
  };

  const handleDeleteMatch = async (matchId) => {
    await deleteMatchService(matchId);
  };

  const handleOverrideResult = async (matchId, winner) => {
    await overrideMatchResultService(matchId, winner);
  };

  const handleShare = async () => {
    await shareLinkService();
  };

  const handleLogin  = () => loginWithGoogle();
  const handleLogout = () => logoutUser();

  const handleAddAdmin = async (email) => {
    if (!email || !email.includes('@')) return alert('Valid email required');
    if (adminList.some(a => a.email === email)) return alert('Already an admin');
    await addAdminUserService(email);
  };

  const handleRemoveAdmin = async (adminId) => {
    try {
      await removeAdminUserService(adminId);
    } catch (e) {
      console.error(e);
      alert('Failed to remove: ' + e.message);
    }
  };

  // Admin check based on user email (fallback env + realtime db list)
  const ENV_ADMINS = (import.meta.env.VITE_ADMIN_EMAILS || 'sundeep8967@gmail.com').split(',');
  const isAdmin = user && (ENV_ADMINS.includes(user.email) || adminList.some(a => a.email === user.email));

  // Translation helper
  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  // ─── PUBLIC API ─────────────────────────────────────────────────────────────
  return {
    // auth
    user,
    loading,
    handleLogin,
    handleLogout,
    isAdmin,

    // navigation
    activeTab,
    setActiveTab,
    viewingHistoryFor,
    setViewingHistoryFor,

    // data
    votes,
    matchResults,
    allMatches,
    activeMatches,
    ongoingMatches,
    squadStats,
    matchLogs,
    userStats,
    totalPot,
    adminList,
    allUsers,

    // actions
    handleVote,
    handleAddCustomMatch,
    handleUploadSchedule,
    handleFinalizeWinner,
    handleOverrideResult,
    handleDeleteMatch,
    handleShare,
    handleAddAdmin,
    handleRemoveAdmin,
    t,
    language,
    handleLanguageChange,
  };
}
