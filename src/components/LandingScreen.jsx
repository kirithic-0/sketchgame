import React, { useState } from 'react';
import { Play, Sparkles, ChevronRight, Trophy, History } from 'lucide-react';
import { Leaderboard } from './Leaderboard';

export function LandingScreen({
  username,
  setUsername,
  previousRuns = [],
  onStartGame,
  leaderboard,
  dbLoading,
  onRefreshLeaderboard,
  selectedCountry,
  setSelectedCountry
}) {
  const [activeTab, setActiveTab] = useState('global'); // global, local

  // Format date safely
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Recent Match';
    }
  };

  return (
    <div className="landing-layout">
      {/* COLUMN 1: HOW TO PLAY / STEPS (LEFT SIDE) */}
      <div className="landing-steps-column">
        <div className="steps-header">
          <Sparkles className="steps-header-icon" strokeWidth={3} />
          <h3 className="steps-header-title">How It Works</h3>
        </div>
        
        <div className="step-card" style={{ transform: 'rotate(-1.5deg)' }}>
          <div className="step-number step-one">1</div>
          <h3 className="step-title">Pick a Spot</h3>
          <p className="step-text">Select an iconic global street image from curated locations.</p>
        </div>
        
        <div className="step-card" style={{ transform: 'rotate(1deg)' }}>
          <div className="step-number step-two">2</div>
          <h3 className="step-title">Sketch Over It</h3>
          <p className="step-text">Draw tools onto the scenery (like an anvil over a bike).</p>
        </div>
        
        <div className="step-card" style={{ transform: 'rotate(-1deg)' }}>
          <div className="step-number step-three">3</div>
          <h3 className="step-title">Face the Consequence</h3>
          <p className="step-text">AI scores your design and logs the funny chain reaction.</p>
        </div>
      </div>

      {/* COLUMN 2: PLAY SETUP (CENTER) */}
      <div className="landing-main-column">
        {/* Sleek Logo / Badge */}
        <div className="main-logo-badge">
          <div className="badge">
            <Sparkles className="badge-icon" strokeWidth={3} />
            <span>Powered by Gemini 2.5 Flash Vision</span>
          </div>
        </div>

        {/* USERNAME FIELD */}
        <div className="glass-panel main-setup-panel">
          <label className="panel-label">
            Set Username:
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your name to start..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            style={{ width: '100%' }}
          />
        </div>

        {/* COUNTRY SELECTION MAP */}
        <div className="glass-panel main-setup-panel">
          <label className="panel-label">
            Select Target Destination (All 5 Rounds):
          </label>

          {/* World Map Container */}
          <div className="map-container-wrapper" style={{
            position: 'relative',
            width: '100%',
            border: '4px solid var(--bg-neo-black)',
            boxShadow: '4px 4px 0px var(--bg-neo-black)',
            background: 'var(--bg-neo-white)',
            overflow: 'hidden',
            marginBottom: '1rem',
            aspectRatio: '16/9'
          }}>
            <img 
              src="/world_map.png" 
              alt="World Map Selection" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />

            {/* Clickable Map Pins */}
            {[
              { name: 'USA', top: '35%', left: '20%' },
              { name: 'UK', top: '27%', left: '46.5%' },
              { name: 'France', top: '33%', left: '48.5%' },
              { name: 'Italy', top: '37%', left: '51.5%' },
              { name: 'Japan', top: '37%', left: '83.5%' }
            ].map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCountry(c.name)}
                style={{
                  position: 'absolute',
                  top: c.top,
                  left: c.left,
                  transform: 'translate(-50%, -50%)',
                  background: selectedCountry === c.name ? '#AF4E4E' : 'var(--bg-neo-white)',
                  color: selectedCountry === c.name ? 'white' : 'var(--bg-neo-black)',
                  border: '2px solid var(--bg-neo-black)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  zIndex: selectedCountry === c.name ? 10 : 2,
                  transition: 'all 0.1s'
                }}
                title={c.name}
              >
                {c.name === 'USA' ? '🇺🇸' : c.name === 'UK' ? '🇬🇧' : c.name === 'France' ? '🇫🇷' : c.name === 'Italy' ? '🇮🇹' : '🇯🇵'}
              </button>
            ))}
          </div>

          {/* Quick Selection Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.5rem'
          }}>
            {['Japan', 'France', 'USA', 'UK', 'Italy'].map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                style={{
                  padding: '0.5rem 0.25rem',
                  border: '2px solid var(--bg-neo-black)',
                  background: selectedCountry === country ? 'var(--secondary)' : 'var(--bg-neo-white)',
                  color: 'var(--bg-neo-black)',
                  fontWeight: '900',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: selectedCountry === country ? 'inset 2px 2px 0px rgba(0,0,0,0.15)' : '2px 2px 0px var(--bg-neo-black)',
                  transform: selectedCountry === country ? 'translate(1px, 1px)' : 'none',
                  transition: 'all 0.05s',
                  textAlign: 'center'
                }}
              >
                {country === 'USA' ? 'USA 🇺🇸' : country === 'UK' ? 'UK 🇬🇧' : country === 'France' ? 'France 🇫🇷' : country === 'Italy' ? 'Italy 🇮🇹' : 'Japan 🇯🇵'}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onStartGame} 
          disabled={!username.trim()} 
          className="btn-primary start-btn"
          style={{ width: '100%', maxWidth: 'none' }}
        >
          <Play className="btn-icon fill-black" strokeWidth={3} />
          <span>Start 5-Round Match ({selectedCountry})</span>
          <ChevronRight className="btn-arrow" strokeWidth={3} />
        </button>
      </div>

      {/* COLUMN 3: SIDEBAR TABS PANEL (RIGHT SIDE) */}
      <div className="landing-sidebar-column">
        {/* TAB HEADERS */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-neo-black)',
          padding: '4px',
          border: '4px solid var(--bg-neo-black)',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => setActiveTab('global')}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              background: activeTab === 'global' ? 'var(--bg-neo-secondary)' : 'var(--bg-neo-white)',
              color: 'var(--bg-neo-black)',
              fontSize: '0.85rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: activeTab === 'global' ? 'inset 0 0 0 2px var(--bg-neo-black)' : 'none',
              transition: 'all 0.1s'
            }}
          >
            <Trophy className="h-4 w-4" strokeWidth={3} />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              background: activeTab === 'local' ? 'var(--bg-neo-secondary)' : 'var(--bg-neo-white)',
              color: 'var(--bg-neo-black)',
              fontSize: '0.85rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: activeTab === 'local' ? 'inset 0 0 0 2px var(--bg-neo-black)' : 'none',
              transition: 'all 0.1s'
            }}
          >
            <History className="h-4 w-4" strokeWidth={3} />
            <span>Your Matches</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'global' ? (
          <Leaderboard 
            leaderboard={leaderboard} 
            dbLoading={dbLoading} 
            onRefresh={onRefreshLeaderboard} 
          />
        ) : (
          <div className="leaderboard-block" style={{ width: '100%', maxWidth: 'none' }}>
            <div className="leaderboard-header">
              <div className="leaderboard-title-group">
                <History className="leaderboard-trophy-icon" strokeWidth={3} />
                <h3 className="leaderboard-title">Your Local Matches</h3>
              </div>
            </div>

            {previousRuns.length > 0 ? (
              <div className="leaderboard-list" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                {previousRuns.map((run, idx) => (
                  <div key={idx} className="leaderboard-item" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(run.date)}</span>
                      <div className="leaderboard-score-group">
                        <div className="player-score" style={{ color: 'var(--bg-neo-black)' }}>{run.totalScore}</div>
                        <p className="score-unit">PTS</p>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>User:</strong> {run.username}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      <strong>Sketches:</strong> {run.rounds ? run.rounds.map(r => r.objectDrawn).join(', ') : 'None'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="leaderboard-empty">
                <div className="empty-trophy">
                  <History className="h-5 w-5" strokeWidth={3} />
                </div>
                <h4 className="empty-title">No Local Matches</h4>
                <p className="empty-desc">Set your username and play a 5-round match to save your first local entry!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
