import React from 'react';

// Controller
import { useAppController } from './controllers/useAppController';

// Views
import LoginView    from './views/LoginView';
import HomeView     from './views/HomeView';
import BetView      from './views/BetView';
import ScheduleView from './views/ScheduleView';
import RanksView    from './views/RanksView';
import ProfileView  from './views/ProfileView';
import HistoryView  from './views/HistoryView';
import BottomNav    from './views/BottomNav';

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
    allMatches,
    activeMatches,
    ongoingMatch,
    squadStats,
    userStats,

    // actions
    handleVote,
    handleAddCustomMatch,
    handleUploadSchedule,
    handleFinalizeWinner,
    handleOverrideResult,
    handleDeleteMatch,
    handleShare,
    adminList,
    allUsers,
    handleAddAdmin,
    handleRemoveAdmin,
  } = useAppController();

  if (loading) return <div className="loading">Brewing your tea... 🍵</div>;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden' }}>
        <img 
          src="/bg_poster.jpeg" 
          alt="Rivalry Background" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} 
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(255,255,255,0.7), #f4f4f4)' }}></div>
      </div>

      <div className="app-container">
        {!user ? (
          <LoginView login={handleLogin} />

        ) : viewingHistoryFor ? (
          <HistoryView
            userName={viewingHistoryFor}
            votes={votes}
            matchResults={matchResults}
            allMatches={allMatches}
            onClose={() => setViewingHistoryFor(null)}
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
                ongoingMatch={ongoingMatch}
              />
            )}

            {activeTab === 'bet' && (
              <BetView
                matches={activeMatches}
                votes={votes}
                squadStats={squadStats}
                user={user}
                handleVote={handleVote}
                ongoingMatch={ongoingMatch}
              />
            )}

            {activeTab === 'matches' && (
              <ScheduleView
                isAdmin={isAdmin}
                onAddMatch={handleAddCustomMatch}
                allMatches={allMatches}
                matchResults={matchResults}
                onSettle={handleFinalizeWinner}
                onDeleteMatch={handleDeleteMatch}
              />
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
                votes={votes}
                allMatches={allMatches}
                isAdmin={isAdmin}
                adminList={adminList}
                allUsers={allUsers}
                onAddAdmin={handleAddAdmin}
                onRemoveAdmin={handleRemoveAdmin}
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
