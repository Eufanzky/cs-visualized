'use client';

import { motion } from 'framer-motion';

/**
 * CanvasSkeleton
 *
 * Shown while AnimationView is loading (SSR skipped via dynamic import).
 * Mimics the canvas + controls layout with a shimmer animation.
 */
export default function CanvasSkeleton({ height = 480 }: { height?: number }) {
  const shimmer = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 2.2,
      ease: 'linear' as const,
      repeat: Infinity,
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Canvas skeleton */}
      <motion.div
        animate={shimmer.animate}
        transition={shimmer.transition}
        style={{
          width: '100%',
          minHeight: height,
          borderRadius: 16,
          background:
            'linear-gradient(90deg, #12121a 0%, #1a1a26 45%, #12121a 100%)',
          backgroundSize: '400% 100%',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />

      {/* Controls skeleton */}
      <motion.div
        animate={shimmer.animate}
        transition={{ ...shimmer.transition, delay: 0.15 }}
        style={{
          width: '100%',
          height: 56,
          borderRadius: 16,
          background:
            'linear-gradient(90deg, #12121a 0%, #1a1a26 45%, #12121a 100%)',
          backgroundSize: '400% 100%',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />
    </div>
  );
}
