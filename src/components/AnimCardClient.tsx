'use client';

import Link from 'next/link';

/**
 * AnimCardClient
 *
 * Client-side animation card with hover lift, border glow,
 * status dot pulse, and distinct ready/coming-soon styling.
 */

interface AnimCardClientProps {
  href: string;
  title: string;
  complexity: string;
  status: 'ready' | 'coming';
  accentHex: string;
}

export default function AnimCardClient({
  href,
  title,
  complexity,
  status,
  accentHex,
}: AnimCardClientProps) {
  const isReady = status === 'ready';

  return (
    <Link
      href={isReady ? href : '#'}
      className={isReady ? 'anim-card-client-ready' : 'anim-card-coming'}
      style={{
        '--card-accent': accentHex,
        display: 'block',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        textDecoration: 'none',
        transition:
          'border-color 0.3s, background 0.3s, transform 0.3s, box-shadow 0.3s',
        opacity: isReady ? 1 : 0.55,
        cursor: isReady ? 'pointer' : 'default',
        pointerEvents: isReady ? 'auto' : 'none',
        position: 'relative',
        overflow: 'hidden',
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (!isReady) return;
        const el = e.currentTarget;
        el.style.transform = 'translateY(-3px)';
        el.style.borderColor = `${accentHex}55`;
        el.style.boxShadow = `0 14px 32px -8px rgba(0,0,0,0.5), 0 0 20px ${accentHex}15`;
        el.style.background = 'var(--bg-elevated)';
      }}
      onMouseLeave={(e) => {
        if (!isReady) return;
        const el = e.currentTarget;
        el.style.transform = 'translateY(0)';
        el.style.borderColor = 'var(--border-subtle)';
        el.style.boxShadow = 'none';
        el.style.background = 'var(--bg-surface)';
      }}
    >
      {/* Status badge */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: isReady ? 'var(--syn-success)' : 'var(--text-muted)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
        }}
      >
        {isReady ? (
          <span
            className="ready-dot-pulse"
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--syn-success)',
            }}
          />
        ) : (
          <span className="coming-dot" />
        )}
        {isReady ? 'ready' : 'coming soon'}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1.05rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>

      {/* Complexity */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: accentHex,
          letterSpacing: '0.03em',
        }}
      >
        {complexity}
      </div>
    </Link>
  );
}
