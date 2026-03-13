'use client';

import { motion } from 'framer-motion';

/**
 * AnimCardReveal
 *
 * Thin client wrapper that adds scroll-triggered entrance animation
 * to any animation listing card (used in the category page grid).
 */
export default function AnimCardReveal({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.06,
      }}
    >
      {children}
    </motion.div>
  );
}
