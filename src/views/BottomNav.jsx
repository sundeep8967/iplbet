import React from 'react';

export default function BottomNav({ activeTab, setActiveTab, t }) {
  return (
    <nav className="bottom-nav">
      <div
        className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <span className="nav-emoji">🏠</span>
        <span className="nav-label">{t('home')}</span>
      </div>
      <div
        className={`nav-tab ${activeTab === 'matches' ? 'active' : ''}`}
        onClick={() => setActiveTab('matches')}
      >
        <span className="nav-emoji">📅</span>
        <span className="nav-label">{t('matches')}</span>
      </div>
      <div className="nav-center-btn" onClick={() => setActiveTab('bet')}>
        <span className="nav-emoji">🏏</span>
        <span className="nav-label">{t('bet')}</span>
      </div>
      <div
        className={`nav-tab ${activeTab === 'audit' ? 'active' : ''}`}
        onClick={() => setActiveTab('audit')}
      >
        <span className="nav-emoji">🔍</span>
        <span className="nav-label">{t('audit_tab')}</span>
      </div>
      <div
        className={`nav-tab ${activeTab === 'ranks' ? 'active' : ''}`}
        onClick={() => setActiveTab('ranks')}
      >
        <span className="nav-emoji">🏆</span>
        <span className="nav-label">{t('ranks')}</span>
      </div>
      <div
        className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        <span className="nav-emoji">👤</span>
        <span className="nav-label">{t('profile')}</span>
      </div>
    </nav>
  );
}
