'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimationState,
  AnimationStep,
  applyStep,
  getSwapFrames,
  reset,
  speedToDelay,
  type RendererType,
} from '../lib/animation-engine';
import { getRenderer } from '../lib/renderers';
import { drawBarChart } from '../lib/renderers/bar-chart';
import { isStepResult, type StepGenerator } from '../lib/algorithms';
import { lofiSounds } from '../lib/lofi-sounds';

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
  initialSize = 24,
  rendererType: RendererType = 'bar-chart'
): UseAnimationReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [state, setState] = useState<AnimationState>(() =>
    reset(initialSize, 1, rendererType, null)
  );

  // Keep a ref to state so async callbacks see the latest value without
  // triggering re-renders or stale closures.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Flag to interrupt an in-progress play loop
  const playingRef = useRef(false);

  // Keep rendererType stable across re-renders
  const rendererTypeRef = useRef(rendererType);
  useEffect(() => {
    rendererTypeRef.current = rendererType;
  }, [rendererType]);

  // ── Internal draw helper ──────────────────────────────────────────────

  /**
   * Obtain canvas context and css dimensions.
   * Returns null if the canvas is not yet mounted.
   */
  function getCtx(): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = window.devicePixelRatio || 1;
    return { ctx, w: canvas.width / dpr, h: canvas.height / dpr };
  }

  // ── Canvas drawing ────────────────────────────────────────────────────

  /**
   * Draws the current state onto the canvas using the appropriate renderer.
   * For bar-chart mode with overrides, calls drawBarChart directly (for swap animation).
   */
  const draw = useCallback(
    (
      overrideArray?: number[],
      overrideComparing?: number[],
      overrideSwapping?: number[],
      overrideSorted?: Set<number>
    ) => {
      const result = getCtx();
      if (!result) return;
      const { ctx, w, h } = result;

      const s = stateRef.current;
      const type = rendererTypeRef.current;

      if (
        type === 'bar-chart' &&
        (overrideArray !== undefined ||
          overrideComparing !== undefined ||
          overrideSwapping !== undefined ||
          overrideSorted !== undefined)
      ) {
        // Direct call with overrides for swap frame interpolation
        drawBarChart(ctx, w, h, s.scene ?? null, s, overrideArray, overrideComparing, overrideSwapping, overrideSorted);
      } else {
        const renderer = getRenderer(type);
        renderer(ctx, w, h, s.scene ?? null, s);
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
        const isBarChart = rendererTypeRef.current === 'bar-chart';

        // Trigger sound effect for this step (skip if unmounted)
        if (playingRef.current || !s.isPlaying) {
          lofiSounds.step({
            type: step.type,
            value: step.indices.length > 0
              ? s.array[step.indices[0]] / Math.max(...s.array)
              : 0.5,
            values: step.values?.map(v => v / Math.max(...s.array)),
          });
        }

        if (step.type === 'compare') {
          const next = applyStep(s, step);
          setState(next);
          stateRef.current = next;
          setTimeout(() => resolve(next), delay);
        } else if (step.type === 'swap' && isBarChart && step.indices.length === 2) {
          // Bar-chart swap animation with interpolated frames
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
            const result = getCtx();
            if (!result) return;
            const { ctx, w, h } = result;

            const frame = frames[frameIdx];
            drawBarChart(ctx, w, h, stateRef.current.scene ?? null, stateRef.current, frame, [], [a, b], stateRef.current.sortedIndices);

            frameIdx++;
            if (frameIdx < frames.length) {
              requestAnimationFrame(animateFrame);
            } else {
              // Commit the swap to state
              const next = applyStep(stateRef.current, step);
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
          // swap (non-bar-chart), unsorted, pivot, etc.
          const next = applyStep(s, step);
          setState(next);
          stateRef.current = next;
          // For non-bar-chart renderers, add delay so steps are visible
          if (!isBarChart) {
            setTimeout(() => resolve(next), delay);
          } else {
            resolve(next);
          }
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
      const result = generateSteps(stateRef.current.array);
      if (isStepResult(result)) {
        steps = result.steps;
        setState(prev => ({ ...prev, steps, currentStep: 0, scene: result.initialScene }));
        stateRef.current = { ...stateRef.current, steps, currentStep: 0, scene: result.initialScene };
      } else {
        steps = result;
        setState(prev => ({ ...prev, steps, currentStep: 0 }));
        stateRef.current = { ...stateRef.current, steps, currentStep: 0 };
      }
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

        // Check if we were stopped (unmount or pause) during the step
        if (!playingRef.current) break;

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
      const result = generateSteps(s.array);
      let updated: AnimationState;
      if (isStepResult(result)) {
        updated = { ...s, steps: result.steps, currentStep: 0, scene: result.initialScene };
      } else {
        updated = { ...s, steps: result, currentStep: 0 };
      }
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
      const fresh = reset(size, stateRef.current.speed, rendererTypeRef.current, null);
      setState(fresh);
      stateRef.current = fresh;
    },
    []
  );

  // ── Stop animation on unmount ────────────────────────────────────────

  useEffect(() => {
    return () => {
      playingRef.current = false;
    };
  }, []);

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
