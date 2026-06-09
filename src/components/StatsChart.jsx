import React from 'react';
import { Flame, ShieldAlert, Laugh, Brain, Heart } from 'lucide-react';

const AXES = [
  { name: 'DESTRUCTION', key: 'destruction', icon: Flame, angle: -Math.PI / 2, style: { top: '-5px', left: '50%', transform: 'translateX(-50%)' } },
  { name: 'VIOLENCE', key: 'violence', icon: ShieldAlert, angle: -Math.PI / 2 + (2 * Math.PI / 5), style: { top: '30%', right: '-40px' } },
  { name: 'FUNNY', key: 'funny', icon: Laugh, angle: -Math.PI / 2 + (4 * Math.PI / 5), style: { bottom: '-15px', right: '5px' } },
  { name: 'SMART', key: 'smart', icon: Brain, angle: -Math.PI / 2 + (6 * Math.PI / 5), style: { bottom: '-15px', left: '5px' } },
  { name: 'WHOLESOME', key: 'wholesome', icon: Heart, angle: -Math.PI / 2 + (8 * Math.PI / 5), style: { top: '30%', left: '-40px' } }
];

export function StatsChart({ stats, targetStats }) {
  // Dimensions
  const width = 280;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = 100;

  // Render Concentric Pentagon Rings (Intervals of 20, 40, 60, 80, 100)
  const renderGridRings = () => {
    const rings = [];
    for (let i = 1; i <= 5; i++) {
      const radiusLevel = (i / 5) * maxRadius;
      const points = AXES.map(axis => {
        const x = cx + radiusLevel * Math.cos(axis.angle);
        const y = cy + radiusLevel * Math.sin(axis.angle);
        return `${x},${y}`;
      }).join(' ');

      rings.push(
        <polygon
          key={i}
          points={points}
          fill={i === 5 ? 'var(--bg-neo-white)' : 'none'} // Solid background on the outer-most ring
          stroke="rgba(0, 0, 0, 0.15)"
          strokeWidth="1.5"
        />
      );
    }
    return rings;
  };

  // Render Grid Axis Lines
  const renderAxisLines = () => {
    return AXES.map((axis, i) => {
      const xOuter = cx + maxRadius * Math.cos(axis.angle);
      const yOuter = cy + maxRadius * Math.sin(axis.angle);
      return (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={xOuter}
          y2={yOuter}
          stroke="rgba(0, 0, 0, 0.15)"
          strokeWidth="1.5"
        />
      );
    });
  };

  // 1. Calculate Target Points Polygon
  const targetPoints = targetStats ? AXES.map(axis => {
    const score = typeof targetStats[axis.key] === 'number' ? targetStats[axis.key] : 50;
    const valRadius = (score / 100) * maxRadius;
    const x = cx + valRadius * Math.cos(axis.angle);
    const y = cy + valRadius * Math.sin(axis.angle);
    return { x, y };
  }) : null;

  const targetPointsString = targetPoints ? targetPoints.map(p => `${p.x},${p.y}`).join(' ') : '';

  // 2. Calculate Actual Player Points Polygon
  const playerPoints = stats ? AXES.map(axis => {
    const score = typeof stats[axis.key] === 'number' ? stats[axis.key] : 50;
    const valRadius = (score / 100) * maxRadius;
    const x = cx + valRadius * Math.cos(axis.angle);
    const y = cy + valRadius * Math.sin(axis.angle);
    return { x, y };
  }) : null;

  const playerPointsString = playerPoints ? playerPoints.map(p => `${p.x},${p.y}`).join(' ') : '';

  return (
    <div className="stats-chart-wrapper" style={{ position: 'relative', width: '360px', height: '360px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* SVG Canvas */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'relative', zIndex: 10 }}>
        {/* Concentric grid rings */}
        {renderGridRings()}

        {/* Radiating Axis Lines */}
        {renderAxisLines()}

        {/* Target Outline Shape (Dashed soft green shape) */}
        {targetPointsString && (
          <>
            <polygon
              points={targetPointsString}
              fill="rgba(0, 0, 0, 0.02)"
              stroke="var(--bg-neo-black)"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            {targetPoints.map((p, i) => (
              <circle
                key={`t-${i}`}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="var(--bg-neo-black)"
              />
            ))}
          </>
        )}

        {/* Player Actual Shape (Filled neon-pink) */}
        {playerPointsString && (
          <>
            <polygon
              points={playerPointsString}
              fill="rgba(255, 107, 107, 0.25)"
              stroke="var(--bg-neo-black)"
              strokeWidth="3"
            />
            {playerPoints.map((p, i) => (
              <circle
                key={`p-${i}`}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="var(--bg-neo-accent)"
                stroke="var(--bg-neo-black)"
                strokeWidth="2"
              />
            ))}
          </>
        )}
      </svg>

      {/* 2. Absolute-Positioned Floating Labels (Teal button styled boxes matching the image) */}
      {AXES.map((axis, i) => {
        const IconComponent = axis.icon;
        
        // Compute what score values to display
        const targetVal = targetStats && typeof targetStats[axis.key] === 'number' ? targetStats[axis.key] : null;
        const actualVal = stats && typeof stats[axis.key] === 'number' ? stats[axis.key] : null;
        
        const isHighlight = actualVal !== null; // highlight if actual rating exists
        const labelText = (() => {
          if (actualVal !== null && targetVal !== null) {
            return `${actualVal} / ${targetVal}`; // "85 / 80"
          } else if (targetVal !== null) {
            return `🎯 ${targetVal}`; // "🎯 80"
          } else if (actualVal !== null) {
            return `${actualVal}`;
          }
          return '0';
        })();

        return (
          <div
            key={i}
            className="chart-label-box"
            style={{
              position: 'absolute',
              zIndex: 20,
              ...axis.style
            }}
          >
            <div className={`label-badge-container ${isHighlight ? 'label-glow-active' : ''}`}>
              <span className="label-badge-title">{axis.name}</span>
              <div className="label-badge-icon-wrapper">
                <IconComponent className="label-badge-icon" />
              </div>
              <span className="label-badge-value">{labelText}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
