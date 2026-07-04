import React from 'react';
import { Paintbrush, Trophy, CheckCircle } from 'lucide-react';

export function Header({ activeScreen, setActiveScreen }) {
  return (
    <header className="header-bar">
      <div className="logo-container" onClick={() => setActiveScreen('landing')}>
        <div className="logo-icon-wrapper">
          <Paintbrush className="logo-icon" />
        </div>
        <div className="logo-text-block">
          <h1 className="logo-title">GeoSketch</h1>
          <p className="logo-subtitle">Interactive Drawing Street Game</p>
        </div>
      </div>

      <div className="nav-actions">

        
        {activeScreen === 'game' && (
          <button className="btn-primary" onClick={() => setActiveScreen('landing')}>
            <Trophy className="btn-icon" />
            <span>Leaderboard</span>
          </button>
        )}
        {activeScreen !== 'gallery' && (
          <button className="btn-outline" onClick={() => setActiveScreen('gallery')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: '1.25rem' }}>🖼️</span>
            <span>Gallery</span>
          </button>
        )}
        {activeScreen === 'gallery' && (
          <button className="btn-primary" onClick={() => setActiveScreen('landing')}>
            <Trophy className="btn-icon" />
            <span>Back to Game</span>
          </button>
        )}
      </div>
    </header>
  );
}
