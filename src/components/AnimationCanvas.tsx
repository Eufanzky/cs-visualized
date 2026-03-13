'use client';

import { useEffect, useRef, RefObject } from 'react';

interface AnimationCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Height of the canvas in CSS pixels (default: 500) */
  height?: number;
  className?: string;
}

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
}: AnimationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      className={`relative w-full overflow-hidden rounded-xl bg-[#12121a] border border-white/5 ${className}`}
      style={{ minHeight: height }}
    >
      <canvas
        ref={canvasRef}
        className="block"
        aria-label="Algorithm visualisation canvas"
      />
    </div>
  );
}
