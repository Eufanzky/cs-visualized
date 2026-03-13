'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useRef } from 'react';
import { CATEGORIES, TOTAL_ANIMATIONS, READY_ANIMATIONS } from '@/lib/categories';
import AnimatedCounter from './AnimatedCounter';
import CategoryCard from './CategoryCard';

/* ── Variant helpers ─────────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
  }),
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.15 + i * 0.08 },
  }),
};

/* ── Word-by-word title ─────────────────────────────────────────────── */

function AnimatedTitle() {
  // "algorithms, made visible"
  const line1Words = ['algorithms,', 'made'];
  const line2Word = 'visible';

  return (
    <h1
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(3rem, 8vw, 7rem)',
        fontWeight: 400,
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
        marginBottom: '2rem',
        overflow: 'hidden',
      }}
    >
      {/* Line 1 */}
      <span style={{ display: 'block', overflow: 'hidden' }}>
        {line1Words.map((word, i) => (
          <motion.span
            key={word}
            custom={i}
            variants={wordVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'inline-block', marginRight: '0.3em' }}
          >
            {word === 'made' ? (
              <em className="hero-title-gradient" style={{ fontStyle: 'italic' }}>{word}</em>
            ) : (
              word
            )}
          </motion.span>
        ))}
      </span>

      {/* Line 2 — "visible" with underline glow */}
      <span style={{ display: 'block', overflow: 'hidden' }}>
        <motion.span
          custom={line1Words.length}
          variants={wordVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'inline-block', position: 'relative', whiteSpace: 'nowrap' }}
        >
          {line2Word}
          <motion.span
            aria-hidden
            className="hero-highlight-bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
            style={{
              position: 'absolute',
              bottom: '0.08em',
              left: '-0.05em',
              right: '-0.05em',
              height: '0.32em',
              background: 'linear-gradient(90deg, var(--glow-keyword), var(--glow-string))',
              borderRadius: '2px',
              zIndex: -1,
              transformOrigin: 'left center',
            }}
          />
        </motion.span>
      </span>
    </h1>
  );
}

/* ── Parallax footer hint ───────────────────────────────────────────── */

function ScrollHint() {
  return (
    <motion.div
      custom={4}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '2rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.15em',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <motion.span
        animate={{ x: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut', delay: 1.2 }}
        style={{
          display: 'inline-block',
          width: '32px',
          height: '1px',
          background: 'var(--border)',
        }}
      />
      scroll to explore
    </motion.div>
  );
}

/* ── Main exported section ──────────────────────────────────────────── */

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        ref={sectionRef}
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '120px 2rem 80px',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        {/* ── Ambient orbs — CSS-only animated background ── */}
        <div aria-hidden className="hero-orb hero-orb--primary" />
        <div aria-hidden className="hero-orb hero-orb--secondary" />
        <div aria-hidden className="hero-orb hero-orb--tertiary" />

        {/* Background dot-grid — parallax */}
        <motion.div
          aria-hidden
          className="hero-dot-grid"
          style={{ y: bgY }}
        />

        {/* Decorative code snippet — visual accent */}
        <div aria-hidden className="hero-code-deco">
{`const visualize = (algo) => {
  return algo
    .steps()
    .map(s => render(s));
};

// ${CATEGORIES.length} categories
// ${TOTAL_ANIMATIONS} algorithms planned`}
        </div>

        {/* Eyebrow */}
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--syn-string)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>{'//'} </span>
          interactive algorithm visualizations
        </motion.p>

        {/* Animated title */}
        <AnimatedTitle />

        {/* Description */}
        <motion.p
          custom={0.3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            maxWidth: '520px',
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '3rem',
          }}
        >
          Step through sorting algorithms, traverse data structures, and watch
          graph traversals unfold — one frame at a time.
        </motion.p>

        {/* Meta stats */}
        <motion.div
          custom={0.45}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            display: 'flex',
            gap: '3rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            letterSpacing: '0.08em',
          }}
        >
          <div>
            <strong
              className="hero-stat-value"
              style={{
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              <AnimatedCounter to={CATEGORIES.length} duration={1.2} delay={0.6} />
            </strong>
            categories
          </div>
          <div>
            <strong
              className="hero-stat-value"
              style={{
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              <AnimatedCounter to={TOTAL_ANIMATIONS} duration={1.4} delay={0.7} />
            </strong>
            animations planned
          </div>
          <div>
            <strong
              className="hero-stat-value"
              style={{
                fontFamily: 'var(--font-sans)',
                color: 'var(--syn-success)',
              }}
            >
              <AnimatedCounter to={READY_ANIMATIONS} duration={1.2} delay={0.8} />
            </strong>
            live now
          </div>
        </motion.div>

        <ScrollHint />
      </section>

      {/* ── Section gradient divider ── */}
      <div className="section-divider" aria-hidden />

      {/* ── Categories Grid ───────────────────────────────────────── */}
      <section
        id="categories"
        style={{
          padding: '80px 2rem 120px',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '1rem',
            marginBottom: '3.5rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.15em',
            }}
          >
            01
          </span>
          <h2
            className="section-title"
            style={{ color: 'var(--text-primary)' }}
          >
            Explore topics
          </h2>
          <motion.div
            className="section-line-gradient"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          />
        </motion.div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {CATEGORIES.map((category, i) => (
            <CategoryCard key={category.id} category={category} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
