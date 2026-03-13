'use client';

import { useEffect, useRef, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimationCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Height of the canvas in CSS pixels (default: 500) */
  height?: number;
  className?: string;
  /** Current animation status, shown in the status bar */
  status?: 'ready' | 'running' | 'complete';
  /** Algorithm name displayed in the status bar below the canvas */
  algorithmName?: string;
}

const STATUS_CONFIG = {
  ready:    { label: 'Ready',    dot: 'bg-[#908caa]',  text: 'text-[#908caa]'  },
  running:  { label: 'Running',  dot: 'bg-[#a6da95] animate-pulse', text: 'text-[#a6da95]'  },
  complete: { label: 'Complete', dot: 'bg-[#f6c177]',  text: 'text-[#f6c177]'  },
} as const;

/**
 * AnimationCanvas
 *
 * A DPI-aware, responsive canvas wrapper with a "technical viewport" aesthetic.
 * Features corner crop marks, a subtle CRT scanline overlay, and a status bar
 * below the canvas (not overlaid).
 *
 * Drawing is intentionally NOT done here — the hook handles all rendering so
 * that animation frames stay synchronised with state transitions.
 */
export function AnimationCanvas({
  canvasRef,
  height = 500,
  className = '',
  status = 'ready',
  algorithmName,
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
    <div className={`flex flex-col ${className}`}>
      {/* Canvas viewport with corner marks */}
      <div
        ref={containerRef}
        className="canvas-viewport relative w-full overflow-hidden bg-[#0d0d14]"
        style={{ minHeight: height }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Algorithm visualisation — bar chart showing the current array state. Use the controls below to play, step, or reset the animation."
          className="block"
        />

        {/* CRT scanline overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Inner vignette for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.55)',
          }}
        />

        {/* Corner crop marks — viewfinder / technical viewport */}
        {/* Top-left */}
        <div aria-hidden className="pointer-events-none absolute top-2.5 left-2.5 w-4 h-4 border-t border-l border-white/[0.15]" />
        {/* Top-right */}
        <div aria-hidden className="pointer-events-none absolute top-2.5 right-2.5 w-4 h-4 border-t border-r border-white/[0.15]" />
        {/* Bottom-left */}
        <div aria-hidden className="pointer-events-none absolute bottom-2.5 left-2.5 w-4 h-4 border-b border-l border-white/[0.15]" />
        {/* Bottom-right */}
        <div aria-hidden className="pointer-events-none absolute bottom-2.5 right-2.5 w-4 h-4 border-b border-r border-white/[0.15]" />

        {/* Completion glow — green pulse overlay when algorithm finishes */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.18, 0.06, 0.18, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, times: [0, 0.2, 0.4, 0.6, 1], ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 60%, rgba(166, 218, 149, 0.55) 0%, transparent 65%)',
                boxShadow: 'inset 0 0 60px rgba(166, 218, 149, 0.12)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Status bar below the canvas */}
      <div
        className="flex items-center justify-between border-t border-white/[0.06] bg-[#0b0b12] px-4 py-1.5"
      >
        {/* Left: algorithm name */}
        {algorithmName && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#4a4860]">
            {algorithmName}
          </span>
        )}
        {/* Right: status indicator */}
        <div
          aria-live="polite"
          aria-label={`Animation status: ${label}`}
          className="flex items-center gap-1.5 ml-auto"
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
    </div>
  );
}
