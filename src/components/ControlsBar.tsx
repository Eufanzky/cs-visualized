'use client';

import { useState, useCallback } from 'react';

interface Props {
  /** Hex accent colour from the parent category, used for primary button */
  accentHex: string;
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function StepIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5a.5.5 0 0 1 .765-.424l7 3.85V2.5a.5.5 0 0 1 1 0v11a.5.5 0 0 1-1 0v-3.426l-7 3.85A.5.5 0 0 1 3 13.5v-11Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8a5.5 5.5 0 1 1 1.1 3.3" />
      <polyline points="2.5 13 2.5 9 6.5 9" />
    </svg>
  );
}

export default function ControlsBar({ accentHex }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [size, setSize] = useState(30);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  const speedFillPct = ((speed - 1) / 99) * 100;
  const sizeFillPct = ((size - 10) / 90) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.875rem 1.25rem',
        background: 'rgba(18,18,26,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '1rem',
        flexWrap: 'wrap',
        boxShadow: '0 1px 1px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Play / Pause — primary action */}
      <button
        onClick={togglePlay}
        aria-label={playing ? 'Pause animation' : 'Play animation'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.55rem 1.1rem',
          background: `${accentHex}26`,
          border: `1px solid ${accentHex}55`,
          borderRadius: '0.65rem',
          color: accentHex,
          cursor: 'pointer',
          letterSpacing: '0.03em',
          transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s, transform 0.1s',
          boxShadow: playing ? `0 0 18px ${accentHex}40` : 'none',
          animation: playing ? 'playGlow 2s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${accentHex}40`;
          e.currentTarget.style.borderColor = `${accentHex}99`;
          e.currentTarget.style.boxShadow = `0 0 14px ${accentHex}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${accentHex}26`;
          e.currentTarget.style.borderColor = `${accentHex}55`;
          e.currentTarget.style.boxShadow = playing ? `0 0 18px ${accentHex}40` : 'none';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
        {playing ? 'pause' : 'play'}
      </button>

      {/* Step */}
      <button
        aria-label="Step forward one operation"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 500,
          padding: '0.5rem 0.85rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.5rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          letterSpacing: '0.03em',
          transition: 'background 0.18s, border-color 0.18s, color 0.18s, transform 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <StepIcon />
        step
      </button>

      {/* Reset */}
      <button
        aria-label="Reset animation"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 500,
          padding: '0.5rem 0.85rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.5rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          letterSpacing: '0.03em',
          transition: 'background 0.18s, border-color 0.18s, color 0.18s, transform 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <ResetIcon />
        reset
      </button>

      {/* Separator */}
      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} aria-hidden />

      {/* Speed slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>speed</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 100 }}>
          {/* filled track */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              height: 4,
              transform: 'translateY(-50%)',
              width: `${speedFillPct}%`,
              background: 'linear-gradient(90deg, rgba(196,167,231,0.6), #c4a7e7)',
              borderRadius: 9999,
              pointerEvents: 'none',
            }}
          />
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: '100%' }}
            aria-label="Animation speed"
          />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#c4a7e7', minWidth: '2.2rem', textAlign: 'right' }}>
          {speed}%
        </span>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} aria-hidden />

      {/* Size slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>size</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 100 }}>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              height: 4,
              transform: 'translateY(-50%)',
              width: `${sizeFillPct}%`,
              background: 'linear-gradient(90deg, rgba(196,167,231,0.6), #c4a7e7)',
              borderRadius: 9999,
              pointerEvents: 'none',
            }}
          />
          <input
            type="range"
            min={10}
            max={100}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            style={{ width: '100%' }}
            aria-label="Dataset size"
          />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#c4a7e7', minWidth: '2.2rem', textAlign: 'right' }}>
          n={size}
        </span>
      </div>
    </div>
  );
}
