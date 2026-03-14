'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import MusicToggle from './MusicToggle';
import SoundToggle from './SoundToggle';

const NAV_LINKS = [
  { href: '/',            label: 'home' },
  { href: '/#categories', label: 'explore' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      aria-label="Primary navigation"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        background: 'rgba(10, 10, 15, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/"
          aria-label="cs.visualized — home"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span style={{ color: 'var(--syn-keyword)' }} aria-hidden="true">cs</span>
          <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">.</span>
          <span>visualized</span>
        </Link>
      </motion.div>

      {/* Navigation links */}
      <ul
        role="list"
        style={{
          display: 'flex',
          gap: '2rem',
          listStyle: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {NAV_LINKS.map(({ href, label }, i) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <motion.li
              key={href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'color 0.25s',
                  paddingBottom: '3px',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = 'var(--text-primary)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)')
                }
              >
                {label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: '1px',
                      background: 'var(--syn-keyword)',
                      borderRadius: '1px',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            </motion.li>
          );
        })}

        {/* Audio toggles */}
        <motion.li
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MusicToggle />
          <SoundToggle />
        </motion.li>

        {/* GitHub link */}
        <motion.li
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="cs.visualized on GitHub (opens in new tab)"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              color: 'var(--text-muted)',
              transition: 'color 0.25s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--text-primary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span aria-hidden="true">github</span>
          </motion.a>
        </motion.li>
      </ul>
    </motion.nav>
  );
}
