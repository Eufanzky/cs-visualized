'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLofiMusic } from '../hooks/useLofiMusic';

export default function MusicToggle() {
  const { isPlaying, toggle } = useLofiMusic();

  return (
    <motion.button
      onClick={toggle}
      aria-label={isPlaying ? 'Stop lofi music' : 'Play lofi music'}
      title={isPlaying ? 'Stop lofi music' : 'Play lofi music'}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        background: 'transparent',
        border: '1px solid',
        borderColor: isPlaying ? 'var(--syn-keyword)' : 'var(--border-subtle)',
        borderRadius: '6px',
        cursor: 'pointer',
        color: isPlaying ? 'var(--syn-keyword)' : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        transition: 'color 0.3s, border-color 0.3s',
        overflow: 'hidden',
      }}
    >
      {/* Pulsing glow when playing */}
      <AnimatePresence>
        {isPlaying && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0.8, 1.8, 0.8],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '8px',
              background: 'var(--syn-keyword)',
              filter: 'blur(6px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Music note icon */}
      <motion.span
        key={isPlaying ? 'playing' : 'paused'}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
        style={{ position: 'relative', zIndex: 1, lineHeight: 1 }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" fill="currentColor" />
          <circle cx="18" cy="16" r="3" fill="currentColor" />
        </svg>
      </motion.span>
    </motion.button>
  );
}
