import React from 'react';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      <div
        className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <span className="nav-emoji">🏠</span>
        <span className="nav-label">Home</span>
      </div>
      <div
        className={`nav-tab ${activeTab === 'matches' ? 'active' : ''}`}
        onClick={() => setActiveTab('matches')}
      >
        <span className="nav-emoji">📅</span>
        <span className="nav-label">Matches</span>
      </div>
      <div className="nav-center-btn" onClick={() => setActiveTab('bet')}>
        <span className="nav-emoji">🏏</span>
        <span className="nav-label">BET</span>
      </div>
      <div
        className={`nav-tab ${activeTab === 'ranks' ? 'active' : ''}`}
        onClick={() => setActiveTab('ranks')}
      >
        <span className="nav-emoji">🏆</span>
        <span className="nav-label">Ranks</span>
      </div>
      <div
        className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        <span className="nav-emoji">👤</span>
        <span className="nav-label">Profile</span>
      </div>
    </nav>
  );
}
