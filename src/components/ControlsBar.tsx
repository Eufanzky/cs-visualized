'use client';

import { useState, useCallback } from 'react';

interface Props {
  /** Hex accent colour from the parent category, used for primary button */
  accentHex: string;
}

export default function ControlsBar({ accentHex }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [size, setSize] = useState(30);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    padding: '0.5rem 1.25rem',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    transition: 'background 0.2s, border-color 0.2s',
    whiteSpace: 'nowrap',
  };

  const primaryBtn: React.CSSProperties = {
    ...btnBase,
    background: accentHex,
    borderColor: accentHex,
    color: 'var(--bg-deep)',
    fontWeight: 600,
    minWidth: '5.5rem',
  };

  const sep: React.CSSProperties = {
    width: 1,
    height: 24,
    background: 'var(--border)',
    flexShrink: 0,
  };

  const label: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.875rem 1.25rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        flexWrap: 'wrap',
      }}
    >
      {/* Play / Pause */}
      <button
        style={primaryBtn}
        onClick={togglePlay}
        aria-label={playing ? 'Pause animation' : 'Play animation'}
        onMouseEnter={(e) =>
          (e.currentTarget.style.filter = 'brightness(1.15)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.filter = 'none')
        }
      >
        {playing ? '⏸ pause' : '▶ play'}
      </button>

      {/* Step */}
      <button
        style={btnBase}
        aria-label="Step forward"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.borderColor = 'var(--text-muted)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        step →
      </button>

      {/* Reset */}
      <button
        style={btnBase}
        aria-label="Reset animation"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.borderColor = 'var(--text-muted)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        ↺ reset
      </button>

      {/* Separator */}
      <div style={sep} aria-hidden />

      {/* Speed slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={label}>speed</span>
        <input
          type="range"
          min={1}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '100px' }}
          aria-label="Animation speed"
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            minWidth: '2rem',
            textAlign: 'right',
          }}
        >
          {speed}%
        </span>
      </div>

      {/* Separator */}
      <div style={sep} aria-hidden />

      {/* Size slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={label}>size</span>
        <input
          type="range"
          min={10}
          max={100}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          style={{ width: '100px' }}
          aria-label="Dataset size"
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            minWidth: '2rem',
            textAlign: 'right',
          }}
        >
          n={size}
        </span>
      </div>
    </div>
  );
}
