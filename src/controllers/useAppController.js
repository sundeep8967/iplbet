import { useState, useEffect, useMemo } from 'react';
import { isBefore, parse } from 'date-fns';

// Services
import { onAuthChanged, loginWithGoogle, logoutUser } from '../services/authService';
import {
  subscribeVotes,
  subscribeResults,
  subscribeCustomMatches,
  addVote,
  addCustomMatch as addCustomMatchService,
  uploadSchedule as uploadScheduleService,
  finalizeWinner as finalizeWinnerService,
  overrideMatchResult as overrideMatchResultService,
  shareLink as shareLinkService,
  deleteMatch as deleteMatchService,
} from '../services/firestoreService';

// Models
import { computeActiveMatches, computeSquadStats, computeUserStats } from '../models/statsModel';
import { BET_AMOUNT, IPL_SCHEDULE } from '../models/constants';

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

  // Minute tick — drives activeMatches recomputation without a timer-in-useMemo
  const [tick, setTick] = useState(0);

  // ─── EFFECTS ────────────────────────────────────────────────────────────────

  // 1. Auth listener
  useEffect(() => onAuthChanged(u => { setUser(u); setLoading(false); }), []);

  // 2. Minute tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // 3. Real-time Firestore subscriptions
  useEffect(() => {
    const unsubVotes   = subscribeVotes(setVotes);
    const unsubResults = subscribeResults(setMatchResults);
    const unsubMatches = subscribeCustomMatches(setCustomMatches);
    return () => { unsubVotes(); unsubResults(); unsubMatches(); };
  }, []);

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

  const squadStats = useMemo(
    () => computeSquadStats(votes, matchResults),
    [votes, matchResults]
  );

  const userStats = useMemo(
    () => computeUserStats(user, squadStats),
    [user, squadStats]
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
      if (!isBefore(new Date(), matchTime)) {
        alert('POLL CLOSED — this match has already started!');
        return;
      }
    }
    if (!user) return;
    try {
      await addVote(user, matchId, team);
      alert(`Voted for ${team}!`);
    } catch (e) { console.error(e); }
  };

  const handleAddCustomMatch = async (data) => {
    await addCustomMatchService(data);
  };

  const handleUploadSchedule = async () => {
    await uploadScheduleService();
  };

  const handleFinalizeWinner = async (matchId, winner, existingResultId) => {
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

  // Temporary: allow everyone to see admin panel for testing
  const isAdmin = true;

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
    squadStats,
    userStats,
    totalPot,

    // actions
    handleVote,
    handleAddCustomMatch,
    handleUploadSchedule,
    handleFinalizeWinner,
    handleOverrideResult,
    handleDeleteMatch,
    handleShare,
  };
}
