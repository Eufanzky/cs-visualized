'use client';

import { useEffect, useRef, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimationCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Height of the canvas in CSS pixels (default: 500) */
  height?: number;
  className?: string;
  /** Current animation status, shown in the corner indicator */
  status?: 'ready' | 'running' | 'complete';
}

const STATUS_CONFIG = {
  ready:    { label: 'Ready',    dot: 'bg-[#908caa]',  text: 'text-[#908caa]'  },
  running:  { label: 'Running',  dot: 'bg-[#a6da95] animate-pulse', text: 'text-[#a6da95]'  },
  complete: { label: 'Complete', dot: 'bg-[#f6c177]',  text: 'text-[#f6c177]'  },
} as const;

/**
 * AnimationCanvas
 *
 * A DPI-aware, responsive canvas wrapper. It owns the resize logic and
 * forwards `canvasRef` to the parent so that `useAnimation` can draw onto it.
 *
 * Drawing is intentionally NOT done here — the hook handles all rendering so
 * that animation frames stay synchronised with state transitions.
 */
export function AnimationCanvas({
  canvasRef,
  height = 500,
  className = '',
  status = 'ready',
}: AnimationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { label, dot, text } = STATUS_CONFIG[status];
  const isComplete = status === 'complete';

  // ── DPI-aware resize ──────────────────────────────────────────────────
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const cssWidth = container.clientWidth;

      canvas.width = cssWidth * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }

    resize();

    const observer = new ResizeObserver(resize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [canvasRef, height]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-[#0d0d14] border border-white/6 shadow-[0_4px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}
      style={{ minHeight: height }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Algorithm visualisation — bar chart showing the current array state. Use the controls below to play, step, or reset the animation."
        className="block"
      />

      {/* Inner vignette for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.55)',
        }}
      />

      {/* Completion glow — green pulse overlay when algorithm finishes */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.18, 0.06, 0.18, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, times: [0, 0.2, 0.4, 0.6, 1], ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse at 50% 60%, rgba(166, 218, 149, 0.55) 0%, transparent 65%)',
              boxShadow: 'inset 0 0 60px rgba(166, 218, 149, 0.12)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Status indicator — bottom-left corner */}
      <div
        aria-live="polite"
        aria-label={`Animation status: ${label}`}
        className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-[#0d0d14]/80 border border-white/8 px-3 py-1 backdrop-blur-sm"
      >
        <span className={`block h-1.5 w-1.5 rounded-full ${dot}`} />
        <motion.span
          key={status}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`text-[10px] font-mono uppercase tracking-widest ${text}`}
        >
          {label}
        </motion.span>
      </div>
    </div>
  );
}
