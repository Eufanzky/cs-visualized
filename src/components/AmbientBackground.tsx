'use client';

import { useRef, useEffect, useCallback } from 'react';

/* ── Color palette — warm lofi tones ─────────────────────────────── */

const COLORS = [
  { r: 200, g: 164, b: 212 }, // dusty lilac
  { r: 232, g: 180, b: 168 }, // warm peach
  { r: 228, g: 192, b: 138 }, // amber
  { r: 212, g: 150, b: 142 }, // terracotta
  { r: 156, g: 196, b: 154 }, // soft sage
  { r: 184, g: 169, b: 154 }, // warm taupe
];

interface Particle {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  opacity: number;
  color: { r: number; g: number; b: number };
  vx: number;
  vy: number;
  pulseOffset: number;
  pulseSpeed: number;
  swayOffset: number;
  swaySpeed: number;
  swayAmount: number;
}

function createParticle(w: number, h: number, startY?: number): Particle {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = Math.random() * 4 + 2; // 2-6px
  const opacity = Math.random() * 0.12 + 0.04; // 0.04-0.16

  return {
    x: Math.random() * w,
    y: startY !== undefined ? startY : Math.random() * h,
    size,
    baseOpacity: opacity,
    opacity,
    color,
    vx: (Math.random() - 0.5) * 0.15,
    vy: -(Math.random() * 0.12 + 0.04), // gently rise
    pulseOffset: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.004 + 0.002,
    swayOffset: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.003 + 0.001,
    swayAmount: Math.random() * 0.3 + 0.1,
  };
}

function targetCount(w: number, h: number): number {
  return Math.min(Math.max(Math.floor((w * h) / 18000), 20), 60);
}

/* ── Component ────────────────────────────────────────────────────── */

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles: Particle[];
    w: number;
    h: number;
    dpr: number;
    mouse: { x: number; y: number };
    animId: number;
  }>({
    particles: [],
    w: 0,
    h: 0,
    dpr: 1,
    mouse: { x: -1000, y: -1000 },
    animId: 0,
  });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    s.dpr = window.devicePixelRatio || 1;
    s.w = window.innerWidth;
    s.h = window.innerHeight;
    canvas.width = s.w * s.dpr;
    canvas.height = s.h * s.dpr;
    canvas.style.width = `${s.w}px`;
    canvas.style.height = `${s.h}px`;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);

    // Adjust particle count for new dimensions
    const count = targetCount(s.w, s.h);
    while (s.particles.length < count)
      s.particles.push(createParticle(s.w, s.h));
    while (s.particles.length > count) s.particles.pop();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    /* ── Initialise ────────────────────────────────────────────── */
    s.dpr = window.devicePixelRatio || 1;
    s.w = window.innerWidth;
    s.h = window.innerHeight;
    canvas.width = s.w * s.dpr;
    canvas.height = s.h * s.dpr;
    canvas.style.width = `${s.w}px`;
    canvas.style.height = `${s.h}px`;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);

    const count = targetCount(s.w, s.h);
    s.particles = [];
    for (let i = 0; i < count; i++) {
      s.particles.push(createParticle(s.w, s.h));
    }

    /* ── Render loop ───────────────────────────────────────────── */
    function draw(time: number) {
      ctx!.clearRect(0, 0, s.w, s.h);

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];

        // Update position
        p.x +=
          p.vx + Math.sin(time * p.swaySpeed + p.swayOffset) * p.swayAmount;
        p.y += p.vy;

        // Pulse opacity
        const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset);
        p.opacity = p.baseOpacity + pulse * p.baseOpacity * 0.5;

        // Gentle mouse repel
        const dx = p.x - s.mouse.x;
        const dy = p.y - s.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = ((120 - dist) / 120) * 0.3;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Recycle particles that drift off screen
        if (p.y < -20 || p.x < -20 || p.x > s.w + 20) {
          s.particles[i] = createParticle(s.w, s.h, s.h + 10);
          continue;
        }

        // Draw soft bokeh dot
        const { r, g, b } = p.color;
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity})`);
        grad.addColorStop(
          0.5,
          `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.4})`
        );
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      // Thin connection lines between nearby particles
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < s.particles.length; i++) {
        for (let j = i + 1; j < s.particles.length; j++) {
          const a = s.particles[i];
          const b = s.particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          const threshold = 14000; // ~118px
          if (distSq < threshold) {
            const alpha = (1 - distSq / threshold) * 0.06;
            const cr = Math.round((a.color.r + b.color.r) / 2);
            const cg = Math.round((a.color.g + b.color.g) / 2);
            const cb = Math.round((a.color.b + b.color.b) / 2);
            ctx!.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      s.animId = requestAnimationFrame(draw);
    }

    s.animId = requestAnimationFrame(draw);

    /* ── Event listeners ───────────────────────────────────────── */
    function onMouseMove(e: MouseEvent) {
      s.mouse.x = e.clientX;
      s.mouse.y = e.clientY;
    }

    function onMouseLeave() {
      s.mouse.x = -1000;
      s.mouse.y = -1000;
    }

    function onVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(s.animId);
      } else {
        s.animId = requestAnimationFrame(draw);
      }
    }

    function onResize() {
      resize();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', onResize);

    /* ── Cleanup ────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(s.animId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
    };
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  );
}
