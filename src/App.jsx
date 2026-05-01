import React, { useState, useEffect } from 'react';

// Controller
import { useAppController } from './controllers/useAppController';

// Views
import LoginView    from './views/LoginView';
import HomeView     from './views/HomeView';
import BetTabView   from './views/BetTabView';
import ScheduleView from './views/ScheduleView';
import RanksTabView from './views/RanksTabView';
import ProfileView  from './views/ProfileView';
import HistoryView  from './views/HistoryView';
import AdhocHistoryView from './views/AdhocHistoryView';
import BottomNav    from './views/BottomNav';

export default function App() {
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem('appTheme') || 'csk');

  useEffect(() => {
    localStorage.setItem('appTheme', appTheme);
    document.documentElement.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  const {
    user,
    loading,
    handleLogin,
    handleLogout,
    isAdmin,

    activeTab,
    setActiveTab,
    viewingHistoryFor,
    setViewingHistoryFor,
    viewingAdhocHistoryFor,
    setViewingAdhocHistoryFor,
    squadViewMode,
    setSquadViewMode,

    votes,
    matchResults,
    allMatches,
    activeMatches,
    ongoingMatches,
    squadStats,
    matchLogs,
    userStats,

    handleVote,
    handleAddCustomMatch,
    handleUploadSchedule,
    handleFinalizeWinner,
    handleOverrideResult,
    handleDeleteMatch,
    handleShare,
    adminList,
    allUsers,
    transactions,
    handleAddAdmin,
    handleRemoveAdmin,
    pendingApprovals,
    handleApproveUser,
    handleAddTransaction,
    adhocBets,
    adhocVotes,
    adhocResults,
    adhocPickEvents,
    activeAdhocBets,
    adhocSquadStats,
    adhocLogs,
    handleCreateAdhocBet,
    handleAdhocVote,
    handleUpdateAdhocLock,
    handleFinalizeAdhoc,
    handleDeleteAdhocBet,
    t,
    language,
    handleLanguageChange,
  } = useAppController();

  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <>
      <div className="dynamic-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
        <div className="gradient-sphere sphere-4"></div>
      </div>

      {(appTheme === 'csk' ? ['🦁', '💛', 'CSK', 'Whistle Podu', '🏆', '💛'] : ['🔴', '👑', 'RCB', 'Play Bold', '🏆', '🔴']).map((doodle, i) => (
        <div key={i} className={`bg-doodle doodle-${i+1}`}>{doodle}</div>
      ))}

      <div className="app-container">
        {!user ? (
          <LoginView login={handleLogin} t={t} />
        ) : viewingAdhocHistoryFor ? (
          <AdhocHistoryView
            userName={viewingAdhocHistoryFor}
            adhocBets={adhocBets}
            adhocVotes={adhocVotes}
            adhocResults={adhocResults}
            adhocLogs={adhocLogs}
            onClose={() => setViewingAdhocHistoryFor(null)}
            t={t}
          />
        ) : viewingHistoryFor ? (
          <HistoryView
            userName={viewingHistoryFor}
            votes={votes}
            matchResults={matchResults}
            allMatches={allMatches}
            matchLogs={matchLogs}
            onClose={() => setViewingHistoryFor(null)}
            t={t}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                user={user}
                stats={userStats}
                onShare={handleShare}
                votes={votes}
                matchResults={matchResults}
                allMatches={allMatches}
                ongoingMatches={ongoingMatches}
                activeAdhocBets={activeAdhocBets}
                adhocVotes={adhocVotes}
                matchLogs={matchLogs}
                setActiveTab={setActiveTab}
                setSquadViewMode={setSquadViewMode}
                t={t}
              />
            )}

            {activeTab === 'bet' && (
              <BetTabView
                squadViewMode={squadViewMode}
                setSquadViewMode={setSquadViewMode}
                t={t}
                betViewProps={{
                  matches: activeMatches,
                  votes,
                  squadStats,
                  user,
                  handleVote,
                  ongoingMatches,
                  t,
                }}
                adhocBetPanelProps={{
                  user,
                  isAdmin,
                  adhocBets,
                  adhocVotes,
                  adhocResults,
                  adhocLogs,
                  allUsers,
                  handleCreateAdhocBet,
                  handleAdhocVote,
                  handleUpdateAdhocLock,
                  handleFinalizeAdhoc,
                  handleDeleteAdhocBet,
                  t,
                }}
              />
            )}

            {activeTab === 'matches' && (
              <ScheduleView
                isAdmin={isAdmin}
                onAddMatch={handleAddCustomMatch}
                allMatches={allMatches}
                matchResults={matchResults}
                votes={votes}
                squadStats={squadStats}
                onSettle={handleFinalizeWinner}
                onDeleteMatch={handleDeleteMatch}
                t={t}
              />
            )}

            {activeTab === 'ranks' && (
              <RanksTabView
                squadViewMode={squadViewMode}
                setSquadViewMode={setSquadViewMode}
                t={t}
                iplRanksProps={{
                  squadStats,
                  onViewHistory: setViewingHistoryFor,
                  t,
                }}
                adhocRanksProps={{
                  adhocSquadStats,
                  onViewHistory: setViewingAdhocHistoryFor,
                  t,
                }}
              />
            )}


            {activeTab === 'profile' && (
              <ProfileView
                user={user}
                logout={handleLogout}
                onSync={handleUploadSchedule}
                onSettle={handleFinalizeWinner}
                onOverrideResult={handleOverrideResult}
                activeMatches={activeMatches}
                matchResults={matchResults}
                isAdmin={isAdmin}
                adminList={adminList}
                allUsers={allUsers}
                onAddAdmin={handleAddAdmin}
                onRemoveAdmin={handleRemoveAdmin}
                pendingApprovals={pendingApprovals}
                onApproveUser={handleApproveUser}
                onViewHistory={() => setViewingHistoryFor(user.displayName)}
                t={t}
                language={language}
                onLanguageChange={handleLanguageChange}
                appTheme={appTheme}
                setAppTheme={setAppTheme}
                adhocBets={adhocBets}
                adhocResults={adhocResults}
                handleFinalizeAdhoc={handleFinalizeAdhoc}
                squadViewMode={squadViewMode}
                setSquadViewMode={setSquadViewMode}
                iplAuditProps={{
                  allMatches,
                  votes,
                  matchResults,
                  allUsers,
                  t,
                }}
                adhocAuditProps={{
                  adhocBets,
                  adhocVotes,
                  allUsers,
                  t,
                }}
              />
            )}

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
          </>
        )}
      </div>
    </>
  );
}
