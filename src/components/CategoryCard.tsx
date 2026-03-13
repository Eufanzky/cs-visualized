'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Category } from '@/lib/categories';

interface Props {
  category: Category;
  index: number;
}

export default function CategoryCard({ category, index }: Props) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [mousePos, setMousePos] = useState({ x: '50%', y: '50%' });
  const [hovered, setHovered] = useState(false);

  const readyCount = category.animations.filter((a) => a.status === 'ready').length;
  const totalCount = category.animations.length;

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: `${e.clientX - rect.left}px`,
      y: `${e.clientY - rect.top}px`,
    });
  }

  return (
    <Link
      ref={cardRef}
      href={`/category/${category.id}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        /* staggered entrance */
        opacity: 0,
        animation: `fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) ${0.05 * index + 0.2}s forwards`,

        position: 'relative',
        display: 'block',
        background: 'var(--bg-surface)',
        border: `1px solid ${hovered ? category.accentHex + '55' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        cursor: 'pointer',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'border-color 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 40px -12px rgba(0,0,0,0.5)` : 'none',
      }}
    >
      {/* Top accent line */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: category.accentHex,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s',
        }}
      />

      {/* Radial glow spotlight */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(500px circle at ${mousePos.x} ${mousePos.y}, ${category.glowRgba}, transparent 40%)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s',
          pointerEvents: 'none',
        }}
      />

      {/* Card content — sits above glow layer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon box */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            background: category.glowRgba,
            border: `1px solid ${category.accentHex}44`,
            color: category.accentHex,
            letterSpacing: '-0.02em',
          }}
        >
          {category.icon}
        </div>

        {/* Title + arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.2rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {category.title}
          </h3>
          <span
            style={{
              fontSize: '1rem',
              color: hovered ? category.accentHex : 'var(--text-muted)',
              transform: hovered ? 'translateX(4px)' : 'none',
              transition: 'color 0.25s, transform 0.25s',
            }}
          >
            →
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '1.25rem',
          }}
        >
          {category.description}
        </p>

        {/* Animation topic tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {category.animations.slice(0, 4).map((anim) => (
            <span
              key={anim.id}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                padding: '0.2rem 0.55rem',
                background: 'var(--bg-elevated)',
                border: `1px solid ${hovered ? 'var(--border)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                color: hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
                letterSpacing: '0.04em',
                transition: 'border-color 0.25s, color 0.25s',
              }}
            >
              {anim.title}
            </span>
          ))}
          {category.animations.length > 4 && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                padding: '0.2rem 0.55rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              +{category.animations.length - 4} more
            </span>
          )}
        </div>

        {/* Footer row — ready count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            {totalCount} animation{totalCount !== 1 ? 's' : ''}
          </span>
          {readyCount > 0 && (
            <span style={{ color: 'var(--syn-success)' }}>
              {readyCount} ready
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
