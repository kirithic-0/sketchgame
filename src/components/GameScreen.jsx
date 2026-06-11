import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  Undo,
  Trash2,
  Palette,
  Check,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';


const BRUSH_COLORS = [
  { name: 'Slate Green', hex: '#3B5C48' },
  { name: 'Warm Terracotta', hex: '#C27866' },
  { name: 'Mustard Gold', hex: '#D29E3C' },
  { name: 'Charcoal Green', hex: '#203326' },
  { name: 'Sage Green', hex: '#4C8A69' },
  { name: 'Warm Peach', hex: '#D8A28C' },
  { name: 'Crimson Rust', hex: '#AF4E4E' }
];

export function GameScreen({
  location,
  streetImage,
  imgLoading,
  gamePhase,
  strokesCount,
  setStrokesCount,
  canvasRef,
  objective,
  difficulty,
  onChangeLocation,
  onSubmitDrawing,
  currentRound = 1,
  onClearCanvas
}) {
  const [brushColor, setBrushColor] = useState('#3B5C48');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);

  return (
    <div className="game-layout">
      {/* COLUMN 1: DRAWING BOARD */}
      <div className="drawing-column">
        {/* STAGE HEADER CONTROL */}
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

        {/* THE IMAGE CANVAS FRAME */}
        <div className={`canvas-outer ${gamePhase === 'scanning' ? 'scanning-active' : ''}`}>
          {imgLoading ? (
            <div className="canvas-loading-state">
              <RefreshCw className="loading-spinner" strokeWidth={3} />
              <p className="loading-text">Loading street scene...</p>
            </div>
          ) : streetImage ? (
            <div className="canvas-inner">
              {/* The 2D Background image */}
              <img
                src={streetImage.imageUrl}
                alt={location.name}
                className="street-background-image"
              />

              {/* Scanning animation laser overlay */}
              {gamePhase === 'scanning' && <div className="laser-scanner"></div>}

              {/* Canvas Painting Layer */}
              <DrawingCanvas
                ref={canvasRef}
                brushColor={isEraser ? 'rgba(0,0,0,0)' : brushColor}
                brushSize={brushSize}
                isDrawingMode={gamePhase === 'draw'}
                onStrokeAdded={(count) => setStrokesCount(count)}
              />

              {/* Scanning Overlay (Scanning Phase) */}
              {gamePhase === 'scanning' && (
                <div className="scanning-overlay">
                  <div className="scanning-dialog glass-panel">
                    <div className="scanning-spinner-wrapper">
                      <RefreshCw className="scanning-spinner animate-spin" strokeWidth={3} />
                      <Sparkles className="scanning-sparkle animate-pulse" strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="scanning-title">Game Master Evaluating...</h4>
                      <p className="scanning-text">
                        The Game Master is currently evaluating your strokes in context of the scene, calculating consequences, and rendering your score. Hold tight!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="canvas-error-state">
              <AlertTriangle className="error-icon" strokeWidth={3} />
              <p className="error-text">No active street imagery loaded. Adjust credentials in .env and restart local server.</p>
              <button onClick={onChangeLocation} className="btn-primary btn-sm mt-2">
                Retry Loading
              </button>
            </div>
          )}
        </div>

        {/* TOOLBAR CONTROLS (only draw phase) */}
        {gamePhase === 'draw' && (
          <div className="drawing-toolbar">
            {/* Undo & Clear */}
            <div className="toolbar-group">
              <button
                onClick={() => canvasRef.current?.undo()}
                disabled={strokesCount === 0}
                className="btn-outline btn-sm"
                title="Undo last stroke"
              >
                <Undo className="btn-icon" strokeWidth={3} />
                <span>Undo</span>
              </button>
              <button
                onClick={() => {
                  canvasRef.current?.clearCanvas();
                  setStrokesCount(0);
                  onClearCanvas?.();
                }}
                disabled={strokesCount === 0}
                className="btn-outline btn-sm btn-clear"
                title="Clear canvas"
              >
                <Trash2 className="btn-icon" strokeWidth={3} />
                <span>Clear</span>
              </button>
            </div>

            {/* Color Presets */}
            <div className="color-palette-group">
              <div className="palette-label">
                <Palette className="palette-icon" strokeWidth={3} />
                <span>Color:</span>
              </div>
              <div className="color-presets">
                {BRUSH_COLORS.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      setBrushColor(color.hex);
                      setIsEraser(false);
                    }}
                    className={`color-btn ${brushColor === color.hex && !isEraser ? 'color-active' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {brushColor === color.hex && !isEraser && (
                      <Check className="color-check-icon" strokeWidth={3} />
                    )}
                  </button>
                ))}
                {/* Eraser */}
                <button
                  onClick={() => setIsEraser(true)}
                  className={`eraser-btn ${isEraser ? 'eraser-active' : ''}`}
                  title="Eraser tool"
                >
                  <Trash2 className="eraser-icon" strokeWidth={3} />
                  <span>Eraser</span>
                </button>
              </div>
            </div>

            {/* Size slider */}
            <div className="brush-slider-group">
              <span className="slider-label">Size:</span>
              <input
                type="range"
                min="3"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="brush-slider"
              />
              <span className="brush-size-text">{brushSize}px</span>
            </div>
          </div>
        )}
      </div>

      {/* COLUMN 2: SUGGESTIONS PANEL */}
      <div className="sidebar-column">
        <div className="sidebar-panel">
          <div className="sidebar-header">
            <h3 className="sidebar-title">GM Directive</h3>
            <p className="sidebar-desc">Fulfill the Game Master's command to the best of your drawing ability. Sarcasm is guaranteed.</p>
          </div>

          <div className="objective-card glass-panel" style={{
            padding: '1.25rem',
            margin: '1rem 0',
            border: '3px solid var(--bg-neo-black)',
            boxShadow: '6px 6px 0px var(--bg-neo-black)',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-round" style={{ 
                background: 'rgba(99, 102, 241, 0.15)', 
                color: 'var(--primary)',
                border: '1.5px solid var(--bg-neo-black)',
                fontWeight: '700',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem'
              }}>
                ROUND {currentRound}/5
              </span>
              <span className={`difficulty-tag ${difficulty.toLowerCase()}`} style={{
                background: difficulty === 'Easy' ? '#E1F5FE' : difficulty === 'Medium' ? '#FFF3E0' : '#FFEBEE',
                color: difficulty === 'Easy' ? '#0288D1' : difficulty === 'Medium' ? '#F57C00' : '#D32F2F',
                border: '1.5px solid var(--bg-neo-black)',
                fontWeight: '800',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem'
              }}>
                {difficulty}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', margin: '0.25rem 0' }}>
              <Sparkles className="objective-sparkle" style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '0.25rem', width: '20px', height: '20px' }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Objective</h4>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--bg-neo-black)', lineHeight: '1.4' }}>
                  "{objective}"
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '2px dashed #ccc', paddingTop: '0.75rem', lineHeight: '1.5' }}>
              {currentRound === 1 && "The Evil AI GM issues a basic command of destruction or kindness. Let's start the chaos!"}
              {currentRound === 2 && "The AI GM demands slightly more situational chaos. How will you execute it?"}
              {currentRound === 3 && "Things are heating up! The GM is demanding localized disruption. Figure out how to achieve it."}
              {currentRound === 4 && "Highly chaotic commands incoming. The GM demands severe action. Watch out for the twist!"}
              {currentRound === 5 && "Absolute global-scale demands. The AI GM demands total compliance. Show your absolute best!"}
            </div>
          </div>

          <div className="sidebar-interactive-section">
            <div className="sidebar-actions-group">
              <button
                onClick={onSubmitDrawing}
                disabled={strokesCount === 0 || gamePhase === 'scanning'}
                className="btn-secondary w-full submit-drawing-btn"
              >
                <Sparkles className="btn-icon" strokeWidth={3} />
                <span>AI Evaluate Sketch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
