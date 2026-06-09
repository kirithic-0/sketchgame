import React from 'react';
import { MapPin, RefreshCw, Trophy, Sparkles, AlertTriangle, ChevronRight, MessageSquare } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { SatisfactionGauge } from './SatisfactionGauge';

export function ResultScreen({
  location,
  streetImage,
  imgLoading,
  canvasRef,
  evaluation,
  objective,
  difficulty,
  displayedTwist,
  displayedEvaluation,
  displayedSatisfaction,
  displayedScore,
  onNextRound,
  onBackToLeaderboard,
  strokesCount,
  currentRound = 1
}) {
  return (
    <div className="game-layout-results-three-col">
      {/* COLUMN 1: DRAWING BOARD (RESULTS VIEW MODE) */}
      <div className="drawing-column-results">
        <div className="info-header">
          <div className="location-badge">
            <MapPin className="location-pin-icon" strokeWidth={3} />
            <div className="location-info">
              <h3 className="location-name">{location.name}</h3>
              <p className="location-meta">{location.country}</p>
            </div>
          </div>
          <div className="header-status-actions">
            <div className="strokes-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontWeight: '700' }}>
              Round {currentRound} / 5
            </div>
            <div className="strokes-badge">
              Strokes: {strokesCount}
            </div>
          </div>
        </div>

        <div className="canvas-outer">
          {imgLoading ? (
            <div className="canvas-loading-state">
              <RefreshCw className="loading-spinner" />
              <p className="loading-text">Loading street scene...</p>
            </div>
          ) : streetImage ? (
            <div className="canvas-inner">
              <img 
                src={streetImage.imageUrl} 
                alt={location.name}
                className="street-background-image"
              />
              <DrawingCanvas
                ref={canvasRef}
                isDrawingMode={false}
              />
            </div>
          ) : (
            <div className="canvas-error-state">
              <AlertTriangle className="error-icon" />
              <p className="error-text">No active street imagery loaded.</p>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: AI CONSEQUENCE TEXT CARD */}
      <div className="consequence-results-column">
        <div className="results-panel">
          <div className="results-header">
            <div>
              <h3 className="results-title">AI Twist & Evaluation</h3>
              <p className="results-subtitle">Narrative Review</p>
            </div>
            {evaluation.isMock && (
              <span className="mock-badge">MOCK MODE</span>
            )}
          </div>

          <div className="consequence-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', justifyContent: 'space-between' }}>
            <div className="drawn-details-grid">
              <div className="drawn-detail-item">
                <span className="detail-label">Drew</span>
                <span className="detail-value text-secondary">{evaluation.objectDrawn}</span>
              </div>
              <div className="drawn-detail-item">
                <span className="detail-label">On Target</span>
                <span className="detail-value text-accent">{evaluation.targetObject}</span>
              </div>
            </div>

            {/* Objective review banner */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '2px dashed var(--bg-neo-black)',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              lineHeight: '1.4'
            }}>
              <span style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>GM'S DIRECTIVE WAS:</span>
              <span style={{ fontWeight: '700', color: 'var(--bg-neo-black)' }}>"{objective}"</span>
            </div>

            {/* Twist Card */}
            <div className="consequence-box" style={{ flexGrow: 1, minHeight: '100px', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#FFF3E0', borderColor: '#F57C00' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2.5px solid #F57C00', paddingBottom: '0.35rem', marginBottom: '0.25rem' }}>
                <Sparkles style={{ width: '15px', height: '15px', color: '#F57C00' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#F57C00', letterSpacing: '0.05em' }}>The Twist / Consequence</span>
              </div>
              <p className="consequence-text" style={{ margin: '0', fontSize: '0.95rem', color: '#5D4037', fontStyle: 'italic', fontWeight: '700', lineHeight: '1.4' }}>
                {displayedTwist ? `"${displayedTwist}"` : 'Analyzing twist...'}
              </p>
            </div>

            {/* Evaluation Card */}
            <div className="consequence-box" style={{ flexGrow: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#E8F5E9', borderColor: '#2E7D32' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '2.5px solid #2E7D32', paddingBottom: '0.35rem', marginBottom: '0.25rem' }}>
                <MessageSquare style={{ width: '15px', height: '15px', color: '#2E7D32' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: '#2E7D32', letterSpacing: '0.05em' }}>GM Assessment</span>
              </div>
              <p className="consequence-text" style={{ margin: '0', fontSize: '0.95rem', color: '#1B5E20', fontWeight: '700', lineHeight: '1.4' }}>
                {displayedEvaluation ? `"${displayedEvaluation}"` : 'Evaluating objective...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 3: SATISFACTION GAUGE + ACTION BUTTONS */}
      <div className="stats-results-column">
        <div className="results-panel" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="results-header">
              <div>
                <h3 className="results-title">Game Master Opinion</h3>
                <p className="results-subtitle">Satisfaction Assessment</p>
              </div>
            </div>

            <SatisfactionGauge score={displayedScore} />

            {displayedSatisfaction && (
              <div style={{
                background: 'var(--bg-neo-black)',
                color: '#fff',
                padding: '0.85rem 1rem',
                textAlign: 'center',
                border: '2px solid var(--bg-neo-black)',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.15)',
                fontSize: '0.9rem',
                fontWeight: '700',
                lineHeight: '1.4',
                margin: '1rem 0'
              }}>
                "{displayedSatisfaction}"
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="results-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
            <button onClick={onNextRound} className="btn-primary w-full next-round-btn" style={{ padding: '0.85rem' }}>
              <span>{currentRound < 5 ? 'Next Round' : 'View Match Summary'}</span>
              <ChevronRight className="h-4 w-4 ml-1.5" strokeWidth={3} />
            </button>
            <button onClick={onBackToLeaderboard} className="btn-outline w-full text-muted" style={{ padding: '0.85rem' }}>
              <Trophy className="btn-icon" strokeWidth={3} />
              <span>Quit & Exit to Start</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
