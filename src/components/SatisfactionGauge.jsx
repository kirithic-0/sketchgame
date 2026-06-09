import React from 'react';
import { Sparkles, Star, AlertCircle } from 'lucide-react';

export function SatisfactionGauge({ score }) {
  const radius = 64;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color and label based on score
  let strokeColor = '#EF4444'; // Red
  let statusText = 'DISAPPOINTED';
  let StatusIcon = AlertCircle;
  let statusColorClass = 'text-red';

  if (score >= 85) {
    strokeColor = '#D29E3C'; // Gold
    statusText = 'THRILLED!';
    StatusIcon = Sparkles;
  } else if (score >= 60) {
    strokeColor = '#4C8A69'; // Sage Green
    statusText = 'SATISFIED';
    StatusIcon = Star;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      margin: '1rem 0'
    }}>
      <div style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-neo-white)',
        border: '3px solid var(--bg-neo-black)',
        borderRadius: '50%',
        boxShadow: `6px 6px 0px var(--bg-neo-black)`,
      }}>
        {/* SVG Circle Gauge */}
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Active Fill */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease-in-out, stroke 0.6s ease' }}
          />
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            color: 'var(--bg-neo-black)',
            lineHeight: '1',
          }}>
            {score}
          </span>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: '800',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            marginTop: '2px'
          }}>
            SATISFACTION
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.85rem',
        background: 'var(--bg-neo-black)',
        color: '#fff',
        border: '2px solid var(--bg-neo-black)',
        boxShadow: '3px 3px 0px rgba(0,0,0,0.15)',
        fontWeight: '900',
        fontSize: '0.75rem',
        letterSpacing: '0.05em'
      }}>
        <StatusIcon style={{ width: '12px', height: '12px', color: strokeColor }} strokeWidth={3} />
        <span>{statusText}</span>
      </div>
    </div>
  );
}
