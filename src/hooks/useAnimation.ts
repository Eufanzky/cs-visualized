'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimationState,
  AnimationStep,
  applyStep,
  getSwapFrames,
  reset,
  speedToDelay,
  COLORS,
} from '../lib/animation-engine';
import type { StepGenerator } from '../lib/algorithms';

// ── Return type ───────────────────────────────────────────────────────────

export interface UseAnimationReturn {
  state: AnimationState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  resetAnimation: (newSize?: number) => void;
  setSpeed: (speed: number) => void;
  setSize: (size: number) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAnimation(
  algorithmId: string,
  generateSteps: StepGenerator,
  initialSize = 24
): UseAnimationReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [state, setState] = useState<AnimationState>(() =>
    reset(initialSize, 1)
  );

  // Keep a ref to state so async callbacks see the latest value without
  // triggering re-renders or stale closures.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Flag to interrupt an in-progress play loop
  const playingRef = useRef(false);

  // ── Canvas drawing ────────────────────────────────────────────────────

  const draw = useCallback(
    (
      overrideArray?: number[],
      overrideComparing?: number[],
      overrideSwapping?: number[],
      overrideSorted?: Set<number>,
      overrideStatus?: string
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = stateRef.current;
      const arr = overrideArray ?? s.array;
      const comparing = overrideComparing ?? s.comparingIndices;
      const swapping = overrideSwapping ?? s.swappingIndices;
      const sorted = overrideSorted ?? s.sortedIndices;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      const padding = 40;
      const gap = 2;
      const n = arr.length;
      const totalGaps = (n - 1) * gap;
      const barWidth = (w - padding * 2 - totalGaps) / n;
      const maxBarHeight = h - padding * 2 - 30;

      for (let i = 0; i < n; i++) {
        const x = padding + i * (barWidth + gap);
        const barH = arr[i] * maxBarHeight;
        const y = h - padding - barH;

        let color: string = COLORS.default;
        let glow = false;

        if (sorted.has(i)) {
          color = COLORS.sorted;
        }
        if (comparing.includes(i)) {
          color = COLORS.comparing;
          glow = true;
        }
        if (swapping.includes(i)) {
          color = COLORS.swapping;
          glow = true;
        }

        if (glow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
        }

        const radius = Math.min(barWidth / 2, 4);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        // Slightly lighter shade at top for depth
        grad.addColorStop(0, color + 'cc');
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Value label when bars are wide enough
        if (barWidth > 18) {
          ctx.fillStyle = COLORS.textMuted;
          ctx.font = `${Math.min(10, barWidth * 0.4)}px JetBrains Mono, monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(
            String(Math.round(arr[i] * 100)),
            x + barWidth / 2,
            h - padding + 14
          );
        }
      }

      // Status line
      const isDone = overrideStatus === 'done' || s.isDone;
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';

      let statusText = 'ready';
      if (s.isPlaying) statusText = 'sorting…';
      if (isDone) statusText = 'sorted ✓';

      ctx.fillText(`n=${n}  |  ${statusText}`, padding, 24);

      if (comparing.length === 2) {
        ctx.fillStyle = COLORS.comparing;
        ctx.textAlign = 'right';
        ctx.fillText(
          `comparing [${comparing[0]}] & [${comparing[1]}]`,
          w - padding,
          24
        );
      }
      if (swapping.length === 2) {
        ctx.fillStyle = COLORS.swapping;
        ctx.textAlign = 'right';
        ctx.fillText(
          `swapping [${swapping[0]}] ↔ [${swapping[1]}]`,
          w - padding,
          24
        );
      }
    },
    []
  );

  // Re-draw whenever state changes
  useEffect(() => {
    draw();
  }, [state, draw]);

  // ── Execute one step with animation ──────────────────────────────────

  const executeStep = useCallback(
    (step: AnimationStep, speed: number): Promise<AnimationState> => {
      return new Promise(resolve => {
        const delay = speedToDelay(speed);
        const s = stateRef.current;

        if (step.type === 'compare') {
          const next = applyStep(s, step);
          setState(next);
          stateRef.current = next;
          setTimeout(() => resolve(next), delay);
        } else if (step.type === 'swap') {
          const [a, b] = step.indices;
          const frames = getSwapFrames(s.array, a, b, 12);
          let frameIdx = 0;

          // Update swapping indices immediately for color feedback
          const preSwap: AnimationState = {
            ...s,
            comparingIndices: [],
            swappingIndices: [a, b],
          };
          setState(preSwap);
          stateRef.current = preSwap;

          function animateFrame() {
            const frame = frames[frameIdx];
            draw(frame, [], [a, b], stateRef.current.sortedIndices);

            frameIdx++;
            if (frameIdx < frames.length) {
              requestAnimationFrame(animateFrame);
            } else {
              // Commit the swap to state
              const next = applyStep(stateRef.current, step);
              // Restore the correctly-swapped array (applyStep already does this)
              setState(next);
              stateRef.current = next;
              setTimeout(() => resolve(next), Math.round(delay * 0.3));
            }
          }

          requestAnimationFrame(animateFrame);
        } else if (step.type === 'sorted' || step.type === 'done') {
          const next = applyStep(s, step);
          setState(next);
          stateRef.current = next;
          resolve(next);
        } else {
          const next = applyStep(s, step);
          setState(next);
          stateRef.current = next;
          resolve(next);
        }
      });
    },
    [draw]
  );

  // ── Play loop ─────────────────────────────────────────────────────────

  const play = useCallback(() => {
    // Toggle pause
    if (playingRef.current) {
      playingRef.current = false;
      setState(prev => ({ ...prev, isPlaying: false }));
      return;
    }

    playingRef.current = true;
    setState(prev => ({ ...prev, isPlaying: true }));

    // Generate steps if we're starting fresh
    let steps = stateRef.current.steps;
    if (steps.length === 0 || stateRef.current.currentStep >= steps.length) {
      steps = generateSteps(stateRef.current.array);
      setState(prev => ({ ...prev, steps, currentStep: 0 }));
      stateRef.current = { ...stateRef.current, steps, currentStep: 0 };
    }

    async function runLoop() {
      while (playingRef.current) {
        const s = stateRef.current;
        if (s.currentStep >= s.steps.length) {
          playingRef.current = false;
          setState(prev => ({ ...prev, isPlaying: false }));
          break;
        }

        const step = s.steps[s.currentStep];
        await executeStep(step, s.speed);

        if (stateRef.current.isDone) {
          playingRef.current = false;
          setState(prev => ({ ...prev, isPlaying: false }));
          break;
        }
      }
    }

    runLoop();
  }, [generateSteps, executeStep]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // ── Single step forward ───────────────────────────────────────────────

  const stepForward = useCallback(() => {
    if (playingRef.current) return;

    let s = stateRef.current;

    // Generate steps on demand
    if (s.steps.length === 0 || s.currentStep >= s.steps.length) {
      const newSteps = generateSteps(s.array);
      const updated = { ...s, steps: newSteps, currentStep: 0 };
      setState(updated);
      stateRef.current = updated;
      s = updated;
    }

    if (s.currentStep < s.steps.length) {
      const step = s.steps[s.currentStep];
      executeStep(step, s.speed);
    }
  }, [generateSteps, executeStep]);

  // ── Reset ─────────────────────────────────────────────────────────────

  const resetAnimation = useCallback(
    (newSize?: number) => {
      playingRef.current = false;
      const size = newSize ?? stateRef.current.array.length;
      const fresh = reset(size, stateRef.current.speed);
      setState(fresh);
      stateRef.current = fresh;
    },
    []
  );

  // ── Speed / size ──────────────────────────────────────────────────────

  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
    stateRef.current = { ...stateRef.current, speed };
  }, []);

  const setSize = useCallback(
    (size: number) => {
      resetAnimation(size);
    },
    [resetAnimation]
  );

  return {
    state,
    canvasRef,
    play,
    pause,
    stepForward,
    resetAnimation,
    setSpeed,
    setSize,
  };
}
