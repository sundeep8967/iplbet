import { useState, useEffect, useMemo, useCallback } from 'react';
import { isBefore, addMinutes, subMinutes, format } from 'date-fns';
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
  subscribeTransactions,
  addTransaction,
  subscribeAdhocBets,
  subscribeAdhocVotes,
  subscribeAdhocResults,
  subscribeAdhocPickEvents,
  createAdhocBet,
  updateAdhocBetLock,
  addAdhocVote,
  removeAdhocVote,
  finalizeAdhocWinner,
} from '../services/firestoreService';

// Models
import { computeActiveMatches, computeOngoingMatches, computeSquadStats, computeUserStats } from '../models/statsModel';
import { computeAdhocSquadStats, computeAdhocUserStats } from '../models/adhocStatsModel';
import { BET_AMOUNT, BET_LOCK_MINUTES, IPL_SCHEDULE } from '../models/constants';
import { SQUAD_VIEW_BET } from '../models/squadViewMode';
import { parseMatchDateTimeUTC } from '../utils/utcDate';

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
  const [viewingAdhocHistoryFor, setViewingAdhocHistoryFor] = useState(null);
  const [squadViewMode, setSquadViewMode]     = useState(SQUAD_VIEW_BET);

  const [votes, setVotes]                     = useState([]);
  const [matchResults, setMatchResults]       = useState([]);
  const [customMatches, setCustomMatches]     = useState([]);
  const [adminList, setAdminList]             = useState([]);
  const [allUsers, setAllUsers]               = useState([]);
  const [transactions, setTransactions]       = useState([]);
  const [adhocBets, setAdhocBets]           = useState([]);
  const [adhocVotes, setAdhocVotes]         = useState([]);
  const [adhocResults, setAdhocResults]     = useState([]);
  const [adhocPickEvents, setAdhocPickEvents] = useState([]);
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
    const unsubTx      = subscribeTransactions(setTransactions);
    const unsubAdhocB  = subscribeAdhocBets(setAdhocBets);
    const unsubAdhocV  = subscribeAdhocVotes(setAdhocVotes);
    const unsubAdhocR  = subscribeAdhocResults(setAdhocResults);
    const unsubAdhocE  = subscribeAdhocPickEvents(setAdhocPickEvents);

    return () => {
      unsubVotes();
      unsubResults();
      unsubMatches();
      unsubAdmins();
      unsubUsers();
      unsubTx();
      unsubAdhocB();
      unsubAdhocV();
      unsubAdhocR();
      unsubAdhocE();
    };
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
    .sort((a, b) => parseMatchDateTimeUTC(a.date, a.time) - parseMatchDateTimeUTC(b.date, b.time));
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
    () => computeSquadStats(votes, matchResults, allUsers, transactions),
    [votes, matchResults, allUsers, transactions]
  );
  
  const squadStats = squadStatsObj.statsMap;
  const matchLogs = squadStatsObj.matchLogs;

  const userStats = useMemo(
    () => computeUserStats(user, squadStatsObj),
    [user, squadStatsObj]
  );

  const adhocStatsObj = useMemo(
    () => computeAdhocSquadStats(adhocVotes, adhocResults, adhocBets, allUsers),
    [adhocVotes, adhocResults, adhocBets, allUsers]
  );
  const adhocSquadStats = adhocStatsObj.statsMap;
  const adhocLogs = adhocStatsObj.adhocLogs;
  const adhocUserStats = useMemo(
    () => computeAdhocUserStats(user, adhocStatsObj),
    [user, adhocStatsObj]
  );

  const totalPot = useMemo(() => votes.length * BET_AMOUNT, [votes]);

  // ─── HANDLERS ───────────────────────────────────────────────────────────────

  const handleVote = async (matchId, team) => {
    const match = activeMatches.find(m => m.id === matchId);
    if (match) {
      const matchTime = parseMatchDateTimeUTC(match.date, match.time);
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
      const matchTime = parseMatchDateTimeUTC(match.date, match.time);
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

  const handleCreateAdhocBet = async (data) => {
    if (!user) return;
    try {
      await createAdhocBet(user, data);
      alert(t('adhoc_created'));
    } catch (e) {
      console.error(e);
      alert(e.message || t('action_failed'));
    }
  };

  const handleAdhocVote = async (betId, option) => {
    if (!user) return;
    try {
      const existing = adhocVotes.find(v => v.adhoc_bet_id === betId && v.user_id === user.uid);
      if (existing && existing.chosen_option === option) {
        await removeAdhocVote(betId, user);
        alert(t('adhoc_unpicked'));
        return;
      }
      await addAdhocVote(user, betId, option);
      alert(t('adhoc_picked'));
    } catch (e) {
      console.error(e);
      alert(e.message || t('action_failed'));
    }
  };

  const handleUpdateAdhocLock = async (betId, lockAtIso) => {
    if (!user) return;
    try {
      await updateAdhocBetLock(betId, lockAtIso, user.uid);
      alert(t('adhoc_lock_updated'));
    } catch (e) {
      console.error(e);
      alert(e.message || t('action_failed'));
    }
  };

  const handleFinalizeAdhoc = async (betId, winningOption) => {
    if (!isAdmin) {
      alert(t('adhoc_admin_only'));
      return;
    }
    const bet = adhocBets.find(b => b.id === betId);
    if (bet) {
      const lockTime = new Date(bet.lock_at);
      if (isBefore(new Date(), lockTime)) {
        alert(t('adhoc_settle_locked_msg'));
        return;
      }
    }
    const existing = adhocResults
      .filter(r => r.adhoc_bet_id === betId)
      .sort((a, b) => (b.settled_at || '').localeCompare(a.settled_at || ''))[0];
    try {
      await finalizeAdhocWinner(betId, winningOption, existing?.id || null);
    } catch (e) {
      console.error(e);
      alert(e.message || t('action_failed'));
    }
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
    viewingAdhocHistoryFor,
    setViewingAdhocHistoryFor,
    squadViewMode,
    setSquadViewMode,

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
    transactions,

    adhocBets,
    adhocVotes,
    adhocResults,
    adhocPickEvents,
    adhocSquadStats,
    adhocLogs,
    adhocUserStats,

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
    handleAddTransaction: addTransaction,
    handleCreateAdhocBet,
    handleAdhocVote,
    handleUpdateAdhocLock,
    handleFinalizeAdhoc,
    t,
    language,
    handleLanguageChange,
  };
}
