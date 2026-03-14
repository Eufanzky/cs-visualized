'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLofiSounds } from '../hooks/useLofiSounds';

export default function SoundToggle() {
  const { isMuted, toggle } = useLofiSounds();

  return (
    <motion.button
      onClick={toggle}
      aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
      title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
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
        borderColor: isMuted ? 'var(--border-subtle)' : 'var(--border-subtle)',
        borderRadius: '6px',
        cursor: 'pointer',
        color: isMuted ? 'var(--text-muted)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        transition: 'color 0.3s, border-color 0.3s',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        {isMuted ? (
          /* Muted — speaker with X */
          <motion.span
            key="muted"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            aria-hidden="true"
            style={{ lineHeight: 1, display: 'flex' }}
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
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          </motion.span>
        ) : (
          /* Unmuted — speaker with sound waves */
          <motion.span
            key="unmuted"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            aria-hidden="true"
            style={{ lineHeight: 1, display: 'flex' }}
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
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
