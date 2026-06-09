import React from 'react';
import { Trophy, RefreshCw } from 'lucide-react';

export function Leaderboard({ leaderboard, dbLoading, onRefresh }) {
  return (
    <div className="leaderboard-block">
      <div className="leaderboard-header">
        <div className="leaderboard-title-group">
          <Trophy className="leaderboard-trophy-icon" strokeWidth={3} />
          <h3 className="leaderboard-title">Global Leaderboard</h3>
        </div>
        <button 
          onClick={onRefresh} 
          disabled={dbLoading} 
          className="leaderboard-refresh-btn"
          title="Refresh Leaderboard"
        >
          <RefreshCw className={`refresh-icon ${dbLoading ? 'animate-spin' : ''}`} strokeWidth={3} />
        </button>
      </div>

      {dbLoading ? (
        <div className="leaderboard-loading">
          <RefreshCw className="loading-spinner" strokeWidth={3} />
          <p className="loading-text">Syncing with database...</p>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="leaderboard-list">
          {leaderboard.map((item, idx) => (
            <div key={item.id} className="leaderboard-item">
              <div className="leaderboard-player-info">
                <div className={`leaderboard-rank ${
                  idx === 0 ? 'rank-gold' :
                  idx === 1 ? 'rank-silver' :
                  idx === 2 ? 'rank-bronze' : 'rank-normal'
                }`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div className="player-details">
                  <h4 className="player-name">{item.player_name}</h4>
                  <p className="player-meta">
                    Drew <span className="player-sketch-tag">{item.object_drawn}</span> in {item.location_name ? item.location_name.split(',')[0] : 'Unknown'}
                    {item.stat_effort !== undefined && item.stat_effort !== null && (
                      <span className="player-effort-badge" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.7rem',
                        background: '#ECEFF1',
                        color: '#37474F',
                        border: '1px solid #CFD8DC',
                        padding: '0.05rem 0.35rem',
                        marginLeft: '0.5rem',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        ⚡ Effort: {parseFloat(item.stat_effort).toFixed(1)}/10
                      </span>
                    )}
                    {item.playstyle_persona && item.playstyle_persona !== 'Neutral' && (
                      <span className="player-persona-badge" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '0.7rem',
                        background: 'rgba(210, 158, 60, 0.15)',
                        color: 'var(--secondary)',
                        border: '1px solid var(--secondary)',
                        padding: '0.05rem 0.35rem',
                        marginLeft: '0.5rem',
                        fontWeight: '700'
                      }}>
                        👤 {item.playstyle_persona}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="leaderboard-score-group">
                <div className="player-score">{item.score}</div>
                <p className="score-unit">PTS</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="leaderboard-empty">
          <div className="empty-trophy">
            <Trophy className="h-5 w-5" strokeWidth={3} />
          </div>
          <h4 className="empty-title">No Scores Recorded</h4>
          <p className="empty-desc">Be the first to paint your mark and grab the crown!</p>
        </div>
      )}
    </div>
  );
}
