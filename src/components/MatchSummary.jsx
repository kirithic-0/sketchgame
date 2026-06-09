import React from 'react';
import { Trophy, RefreshCw, CheckCircle, ArrowRight, MapPin, Sparkles } from 'lucide-react';

export function MatchSummary({
  roundResults,
  totalScore,
  username,
  onBackToStart,
  personaResult = null,
  summaryLoading = false
}) {
  return (
    <div className="landing-layout" style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* FINAL SCORE HERO */}
      <div className="hero-block" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div className="badge">
          <Sparkles className="badge-icon" strokeWidth={3} />
          <span>Match Completed!</span>
        </div>
        <h2 className="hero-title" style={{ marginTop: '0.5rem' }}>
          Awesome job, <span className="hero-highlight">{username}</span>!
        </h2>
        <p className="hero-description" style={{ marginBottom: '1.5rem' }}>
          You've completed all 5 rounds. Here is your final match performance score:
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* MASSIVE PREMIUM SCORE BADGE */}
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--bg-neo-white)',
            border: '4px solid var(--bg-neo-black)',
            borderRadius: '0px',
            padding: '1.5rem 3.5rem',
            boxShadow: '8px 8px 0px 0px var(--bg-neo-black)'
          }}>
            <span style={{ fontSize: '0.9rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>CUMULATIVE SCORE</span>
            <span style={{ fontSize: '4.5rem', fontWeight: '800', color: 'var(--secondary)', lineHeight: '1.1' }}>
              {totalScore}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>/ 500 PTS</span>
          </div>

          {/* OVERALL EFFORT BADGE */}
          {roundResults.length > 0 && (
            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'var(--bg-neo-white)',
              border: '4px solid var(--bg-neo-black)',
              borderRadius: '0px',
              padding: '1.5rem 3.5rem',
              boxShadow: '8px 8px 0px 0px var(--bg-neo-black)'
            }}>
              <span style={{ fontSize: '0.9rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>OVERALL EFFORT</span>
              <span style={{ fontSize: '4.5rem', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.1' }}>
                {(roundResults.reduce((sum, r) => sum + (r.effortScore || 5.0), 0) / roundResults.length).toFixed(1)}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>/ 10.0 PTS</span>
            </div>
          )}
        </div>

        {/* PLAYSTYLE PERSONA CARD */}
        {summaryLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-neo-white)',
            border: '4px solid var(--bg-neo-black)',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '6px 6px 0px 0px var(--bg-neo-black)',
            gap: '0.5rem',
            maxWidth: '500px',
            margin: '0 auto 2rem auto'
          }}>
            <RefreshCw className="animate-spin h-6 w-6 text-muted" strokeWidth={3} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Analyzing playstyle persona...</span>
          </div>
        ) : personaResult ? (
          <div style={{
            background: 'var(--bg-neo-white)',
            border: '4px solid var(--bg-neo-black)',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '6px 6px 0px 0px var(--bg-neo-black)',
            textAlign: 'left',
            maxWidth: '500px',
            margin: '0 auto 2rem auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles style={{ color: 'var(--secondary)', width: '18px', height: '18px' }} strokeWidth={3} />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Playstyle Persona Identified
              </span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.75rem 0', color: 'var(--secondary)' }}>
              {personaResult.persona_name}
            </h3>
            <div style={{
              background: '#F5F5F5',
              borderLeft: '4px solid var(--bg-neo-black)',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem',
              color: 'var(--bg-neo-black)',
              lineHeight: '1.5',
              fontStyle: 'italic'
            }}>
              <strong>GM Verdict:</strong> "{personaResult.gm_review}"
            </div>
          </div>
        ) : null}

        {/* ACTIONS PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
          <div className="submit-success" style={{ padding: '1rem', borderRadius: '0px', border: '3px solid #000', justifyContent: 'center', boxShadow: '4px 4px 0px 0px #000' }}>
            <CheckCircle className="h-5 w-5" strokeWidth={3} />
            <span>Match Verified & Logged to Global Leaderboard!</span>
          </div>

          <button 
            onClick={onBackToStart} 
            className="btn-outline w-full"
            style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <span>Play Another Match</span>
            <ArrowRight className="h-4 w-4 ml-2" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ROUND BY ROUND DETAILS */}
      <div className="leaderboard-block" style={{ flexGrow: 2 }}>
        <div className="leaderboard-header">
          <div className="leaderboard-title-group">
            <Trophy className="leaderboard-trophy-icon" strokeWidth={3} />
            <h3 className="leaderboard-title">Match Breakdown</h3>
          </div>
        </div>

        <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
          {roundResults.map((result, idx) => (
            <div key={idx} className="leaderboard-item" style={{ padding: '1.25rem' }}>
              <div className="leaderboard-player-info" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
                <div className="leaderboard-rank rank-normal" style={{ fontSize: '1rem', fontWeight: '700', minWidth: '32px', height: '32px', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-neo-secondary)', border: '2px solid var(--bg-neo-black)', boxShadow: '2px 2px 0px 0px var(--bg-neo-black)' }}>
                  R{idx + 1}
                </div>
                <div className="player-details" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bg-neo-black)', fontSize: '0.8rem' }}>
                    <MapPin className="h-3 w-3" strokeWidth={3} />
                    <span>{result.locationName}</span>
                  </div>
                  
                  {/* Objective */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Directive:</strong> "{result.objective}"
                  </div>

                  <h4 className="player-name" style={{ fontSize: '0.95rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', margin: '0.25rem 0' }}>
                    Drew <span className="player-sketch-tag" style={{ margin: '0' }}>{result.objectDrawn}</span> 
                    <span style={{ fontWeight: 'normal', color: 'var(--bg-neo-black)', fontSize: '0.8rem' }}>on</span> 
                    <span style={{ color: 'var(--bg-neo-accent)', fontWeight: '600' }}>{result.targetObject}</span>
                    {result.effortScore !== undefined && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '0.7rem',
                        background: '#ECEFF1',
                        color: '#37474F',
                        border: '1px solid #CFD8DC',
                        padding: '0.05rem 0.35rem',
                        fontWeight: '700',
                        marginLeft: '0.5rem'
                      }}>
                        ⚡ Effort: {result.effortScore.toFixed(1)}/10
                      </span>
                    )}
                  </h4>
                  
                  {/* Twist */}
                  <div style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', background: '#FFF3E0', borderLeft: '3px solid #F57C00', fontStyle: 'italic', color: '#5D4037', margin: '0.25rem 0' }}>
                    <strong>Twist:</strong> "{result.twist}"
                  </div>

                  {/* Evaluation */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--bg-neo-black)', marginTop: '0.25rem', lineHeight: '1.5' }}>
                    <strong>GM Review:</strong> {result.evaluation} <span style={{ fontStyle: 'italic', fontWeight: '700', color: 'var(--secondary)' }}>({result.satisfiedText})</span>
                  </p>
                </div>
              </div>
              <div className="leaderboard-score-group" style={{ textAlign: 'right' }}>
                <div className="player-score" style={{ color: 'var(--bg-neo-black)', fontSize: '1.4rem' }}>{result.score}</div>
                <p className="score-unit">PTS</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
