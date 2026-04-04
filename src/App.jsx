import React from 'react';

// Controller
import { useAppController } from './controllers/useAppController';

// Views
import LoginView   from './views/LoginView';
import HomeView    from './views/HomeView';
import BetView     from './views/BetView';
import ScheduleView from './views/ScheduleView';
import RanksView   from './views/RanksView';
import ProfileView from './views/ProfileView';
import HistoryView from './views/HistoryView';
import BottomNav   from './views/BottomNav';

export default function App() {
    const {
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
    activeMatches,
    squadStats,
    userStats,

    // actions
    handleVote,
    handleAddCustomMatch,
    handleUploadSchedule,
    handleFinalizeWinner,
    handleOverrideResult,
    handleShare,
  } = useAppController();

  if (loading) return <div className="loading">Brewing your tea... 🍵</div>;

  return (
    <>
      <div className="bg-doodle doodle-1">🏏</div>
      <div className="bg-doodle doodle-4">🏆</div>

      <div className="app-container">
        {!user ? (
          <LoginView login={handleLogin} />

        ) : viewingHistoryFor ? (
          <HistoryView
            userName={viewingHistoryFor}
            votes={votes}
            matchResults={matchResults}
            onClose={() => setViewingHistoryFor(null)}
          />

        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView user={user} stats={userStats} onShare={handleShare} />
            )}

            {activeTab === 'bet' && (
              <BetView
                matches={activeMatches}
                votes={votes}
                squadStats={squadStats}
                user={user}
                handleVote={handleVote}
              />
            )}

            {activeTab === 'matches' && (
              <ScheduleView isAdmin={isAdmin} onAddMatch={handleAddCustomMatch} />
            )}

            {activeTab === 'ranks' && (
              <RanksView squadStats={squadStats} onViewHistory={setViewingHistoryFor} />
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
                onViewHistory={() => setViewingHistoryFor(user.displayName)}
              />
            )}

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        )}
      </div>
    </>
  );
}
