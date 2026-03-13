'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Footer() {
  const year = new Date().getFullYear();
  const ref = useRef<HTMLElement>(null);

  /* Parallax — content drifts upward as the user scrolls into the footer */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <footer
      ref={ref}
      className="footer-border"
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        /* Gradient border replaces hard border-top */
        borderTop: 'none',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.12em',
        overflow: 'hidden',
      }}
    >
      <motion.div style={{ y, opacity }}>
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <span>
            <span style={{ color: 'var(--syn-keyword)' }}>cs</span>
            <span style={{ color: 'var(--text-muted)' }}>.</span>
            visualized
          </span>

          <span style={{ color: 'var(--border)' }}>
            {'// interactive algorithm animations'} &mdash; {year}
          </span>

          <span>
            built with{' '}
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              style={{ display: 'inline-block', color: 'var(--syn-number)' }}
            >
              ♥
            </motion.span>
            <span className="sr-only">love</span>
            {' '}& vanilla canvas
          </span>
        </div>
      </motion.div>
    </footer>
  );
}
