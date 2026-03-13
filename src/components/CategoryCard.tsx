'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { Category } from '@/lib/categories';

interface Props {
  category: Category;
  index: number;
}

const SPRING = { stiffness: 300, damping: 28, mass: 0.6 };
const TILT_MAX = 10; // degrees

export default function CategoryCard({ category, index }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: '50%', y: '50%' });
  const [hovered, setHovered] = useState(false);

  /* 3D tilt via spring-driven motion values */
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, SPRING);
  const rotateY = useSpring(rawRotateY, SPRING);

  const readyCount = category.animations.filter((a) => a.status === 'ready').length;
  const totalCount = category.animations.length;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    /* Normalise to -1 → 1 and scale to max tilt degrees */
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    rawRotateY.set(normX * TILT_MAX);
    rawRotateX.set(-normY * TILT_MAX);

    setMousePos({ x: `${x}px`, y: `${y}px` });
  }

  function handleMouseEnter() {
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  return (
    /* Scroll-triggered entrance — staggered by index */
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.07,
      }}
      style={{ perspective: 800 }}
    >
      {/* 3D-tilt wrapper */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          position: 'relative',
          /* Subtle accent-tinted gradient background */
          background: hovered
            ? `linear-gradient(135deg, var(--bg-elevated) 0%, color-mix(in srgb, ${category.accentHex} 8%, var(--bg-surface)) 100%)`
            : `linear-gradient(135deg, var(--bg-surface) 0%, color-mix(in srgb, ${category.accentHex} 4%, var(--bg-surface)) 100%)`,
          border: `1px solid ${hovered ? category.accentHex + '55' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          transition: 'border-color 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), background 0.4s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: hovered
            ? `0 24px 48px -12px rgba(0,0,0,0.65), 0 0 0 1px ${category.accentHex}22, 0 0 40px -8px ${category.accentHex}44`
            : 'none',
          cursor: 'pointer',
        }}
        whileHover={{ scale: 1.012 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', ...SPRING } as Parameters<typeof motion.div>[0]['transition']}
      >
        {/* Wrap with Link for navigation — pointer events on inner so tilt still works */}
        <Link
          href={`/category/${category.id}`}
          style={{
            display: 'block',
            padding: '2rem',
            textDecoration: 'none',
          }}
        >
          {/* Top accent line — gradient fade */}
          <motion.div
            aria-hidden
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${category.accentHex}, color-mix(in srgb, ${category.accentHex} 20%, transparent))`,
            }}
          />

          {/* Radial glow spotlight */}
          <motion.div
            aria-hidden
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(500px circle at ${mousePos.x} ${mousePos.y}, ${category.glowRgba}, transparent 40%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Card content — sits above glow layer */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Icon box */}
            <motion.div
              animate={{ scale: hovered ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
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
            </motion.div>

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
                  letterSpacing: '-0.015em',
                }}
              >
                {category.title}
              </h3>
              <motion.span
                animate={{
                  x: hovered ? 6 : 0,
                  color: hovered ? category.accentHex : 'var(--text-muted)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                style={{ fontSize: '1rem' }}
              >
                →
              </motion.span>
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
                <motion.span
                  key={anim.id}
                  animate={{
                    borderColor: hovered ? 'var(--border)' : 'var(--border-subtle)',
                    color: hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
                  }}
                  transition={{ duration: 0.25 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                    padding: '0.2rem 0.55rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {anim.title}
                </motion.span>
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

            {/* Progress bar — ready / total indicator */}
            <div className="card-progress-track">
              <motion.div
                className="card-progress-fill"
                style={{ background: category.accentHex }}
                initial={{ width: '0%' }}
                whileInView={{ width: `${totalCount > 0 ? (readyCount / totalCount) * 100 : 0}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
            </div>

            {/* Footer row — ready count */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                marginTop: '0.65rem',
                letterSpacing: '0.06em',
              }}
            >
              <span>
                {totalCount} animation{totalCount !== 1 ? 's' : ''}
              </span>
              <span>
                <span style={{ color: category.accentHex, fontWeight: 600 }}>
                  {readyCount}
                </span>
                /{totalCount} ready
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
