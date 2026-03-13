'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export interface BreadcrumbSegment {
  label: string;
  href?: string; // omit for the current (last) segment
}

interface Props {
  segments: BreadcrumbSegment[];
}

/**
 * AnimatedBreadcrumb
 *
 * Renders a breadcrumb trail where each segment slides in from the left
 * with a staggered delay. The last segment (current page) is non-linked.
 */
export default function AnimatedBreadcrumb({ segments }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <motion.span
            key={seg.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
              delay: i * 0.08,
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {i > 0 && (
              <span style={{ opacity: 0.4 }} aria-hidden="true">/</span>
            )}
            {seg.href && !isLast ? (
              <Link
                href={seg.href}
                style={{ color: 'var(--text-muted)', transition: 'color 0.25s' }}
                className="breadcrumb-link"
              >
                {seg.label}
              </Link>
            ) : (
              <span
                style={{ color: isLast ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                aria-current={isLast ? 'page' : undefined}
              >
                {seg.label}
              </span>
            )}
          </motion.span>
        );
      })}
    </nav>
  );
}
