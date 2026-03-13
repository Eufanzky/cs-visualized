'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, animate } from 'framer-motion';

interface Props {
  to: number;
  duration?: number;
  delay?: number;
}

/**
 * AnimatedCounter
 *
 * Counts up from 0 → `to` when the element enters the viewport.
 * Uses framer-motion's animate() for smooth spring-free easing.
 */
export default function AnimatedCounter({ to, duration = 1, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(motionVal, to, {
      duration,
      delay,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = String(Math.round(v));
        }
      },
    });

    return () => controls.stop();
  }, [isInView, to, duration, delay, motionVal]);

  return <span ref={ref}>0</span>;
}
