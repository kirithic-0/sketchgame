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
          <p className="logo-subtitle">AI Drawing Street Game</p>
        </div>
      </div>

      <div className="nav-actions">
        <div className="badge badge-success">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>FastAPI Connected</span>
        </div>
        
        {activeScreen === 'game' && (
          <button className="btn-primary" onClick={() => setActiveScreen('landing')}>
            <Trophy className="btn-icon" />
            <span>Leaderboard</span>
          </button>
        )}
      </div>
    </header>
  );
}
