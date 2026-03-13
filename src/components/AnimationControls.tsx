'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationState, type RendererType } from '../lib/animation-engine';

interface AnimationControlsProps {
  state: AnimationState;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSizeChange: (size: number) => void;
  minSize?: number;
  maxSize?: number;
  /** Controls Size slider visibility and stat label wording */
  rendererType?: RendererType;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function StepIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5a.5.5 0 0 1 .765-.424l7 3.85V2.5a.5.5 0 0 1 1 0v11a.5.5 0 0 1-1 0v-3.426l-7 3.85A.5.5 0 0 1 3 13.5v-11Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 8a5.5 5.5 0 1 1 1.1 3.3" />
      <polyline points="2.5 13 2.5 9 6.5 9" />
    </svg>
  );
}

// ── Ripple hook ────────────────────────────────────────────────────────────

interface Ripple { id: number; x: number; y: number }

function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const counter = useRef(0);

  const trigger = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++counter.current;
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 600);
  }, []);

  return { ripples, trigger };
}

// ── Animated number (ticks on change) ──────────────────────────────────────

function AnimatedNumber({ value }: { value: number | string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={String(value)}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        style={{ display: 'inline-block' }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function PlayPauseButton({
  isPlaying,
  disabled,
  onPlay,
  onPause,
}: {
  isPlaying: boolean;
  disabled: boolean;
  onPlay: () => void;
  onPause: () => void;
}) {
  const { ripples, trigger } = useRipple();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) trigger(e);
    if (isPlaying) onPause(); else onPlay();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={isPlaying ? 'Pause' : 'Play'}
      aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
      className={[
        // Base layout & sizing — larger than regular buttons
        'relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5',
        'text-sm font-semibold font-mono tracking-wide',
        'transition-all duration-200 ease-out',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a7e7]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#12121a]',
        // Press feedback
        'active:scale-95',
        // Colors
        'bg-[#c4a7e7]/20 text-[#c4a7e7] border border-[#c4a7e7]/35',
        'hover:bg-[#c4a7e7]/30 hover:border-[#c4a7e7]/60 hover:shadow-[0_0_16px_rgba(196,167,231,0.2)]',
        // Playing-state pulse glow via CSS animation class
        isPlaying ? 'shadow-[0_0_20px_rgba(196,167,231,0.25)] animate-play-glow' : '',
      ].join(' ')}
    >
      {/* Ripple elements */}
      {ripples.map(({ id, x, y }) => (
        <motion.span
          key={id}
          initial={{ scale: 0, opacity: 0.45 }}
          animate={{ scale: 5, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 36,
            height: 36,
            marginLeft: -18,
            marginTop: -18,
            borderRadius: '50%',
            background: 'rgba(196, 167, 231, 0.5)',
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Icon — crossfades play ↔ pause */}
      <AnimatePresence mode="wait" initial={false}>
        {isPlaying ? (
          <motion.span key="pause-icon" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}>
            <PauseIcon />
          </motion.span>
        ) : (
          <motion.span key="play-icon" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.15 }}>
            <PlayIcon />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={isPlaying ? 'pause-label' : 'play-label'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
          {isPlaying ? 'Pause' : 'Play'}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function IconButton({
  onClick,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={[
        'inline-flex items-center gap-2 rounded-lg px-3.5 py-2',
        'text-sm font-medium font-mono text-[#908caa]',
        'bg-white/5 border border-white/8',
        'transition-all duration-200 ease-out',
        'hover:bg-white/10 hover:border-white/15 hover:text-[#e0def4]',
        'active:scale-95',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1 focus-visible:ring-offset-[#12121a]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  displayValue,
  onChange,
  fillPercent,
  ariaLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue?: string;
  onChange: (value: number) => void;
  fillPercent?: number;
  /** Accessible label for screen readers (falls back to label) */
  ariaLabel?: string;
}) {
  const pct = fillPercent ?? ((value - min) / (max - min)) * 100;
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center gap-2.5">
      <label
        htmlFor={id}
        className="text-xs font-mono text-[#6e6a86] min-w-[38px] uppercase tracking-widest"
      >
        {label}
      </label>
      <div className="relative flex items-center" style={{ width: 112 }}>
        {/* Custom track fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
          style={{
            top: '50%',
            height: 4,
            transform: 'translateY(-50%)',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #c4a7e7cc, #c4a7e7)',
          }}
          aria-hidden
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={ariaLabel ?? label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={displayValue ?? String(value)}
          onChange={e => onChange(Number(e.target.value))}
          className="slider-thumb w-full cursor-pointer"
        />
      </div>
      <span
        aria-hidden="true"
        className="text-xs font-mono text-[#c4a7e7] min-w-[40px] text-right tabular-nums"
      >
        {displayValue ?? String(value)}
      </span>
    </div>
  );
}

function Separator() {
  return <div className="h-5 w-px bg-white/8 mx-0.5" aria-hidden />;
}

function StatPill({
  label,
  fullLabel,
  value,
  color,
}: {
  label: string;
  /** Expanded human-readable label for screen readers (e.g. "comparisons") */
  fullLabel?: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-white/4 border border-white/6 px-3 py-1 overflow-hidden"
      title={fullLabel ? `${fullLabel}: ${value}` : undefined}
    >
      <span
        aria-hidden="true"
        className="text-[10px] font-mono text-[#6e6a86] uppercase tracking-widest"
      >
        {label}
      </span>
      <span
        className={`text-xs font-mono font-semibold tabular-nums ${color}`}
        aria-label={`${fullLabel ?? label}: ${value}`}
      >
        <AnimatedNumber value={value} />
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

/**
 * AnimationControls
 *
 * Renders Play/Pause, Step, Reset buttons plus Speed and Size sliders.
 * Also shows real-time counters for the current step, comparisons, and swaps.
 *
 * Keyboard shortcuts (when no text field is focused):
 *   Space       → Play / Pause
 *   ArrowRight  → Step forward
 *   R           → Reset
 */
// ── Renderer-specific stat labels ─────────────────────────────────────────

const RENDERER_STAT_LABELS: Record<string, { primary: string; primaryFull: string; secondary: string; secondaryFull: string }> = {
  'bar-chart':  { primary: 'cmp',   primaryFull: 'comparisons', secondary: 'swp',  secondaryFull: 'swaps' },
  'graph':      { primary: 'nodes', primaryFull: 'nodes visited', secondary: 'edges', secondaryFull: 'edges relaxed' },
  'tree':       { primary: 'nodes', primaryFull: 'nodes visited', secondary: 'ins',   secondaryFull: 'insertions' },
  'linear':     { primary: 'ops',   primaryFull: 'operations',   secondary: 'moves', secondaryFull: 'moves' },
  'hash-table': { primary: 'ins',   primaryFull: 'insertions',   secondary: 'coll',  secondaryFull: 'collisions' },
  'dp-grid':    { primary: 'cells', primaryFull: 'cells computed', secondary: 'hits',  secondaryFull: 'cache hits' },
  'neuron':     { primary: 'epoch', primaryFull: 'examples seen', secondary: 'err',   secondaryFull: 'mispredictions' },
};

export function AnimationControls({
  state,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onSizeChange,
  minSize = 5,
  maxSize = 100,
  rendererType = 'bar-chart',
}: AnimationControlsProps) {
  const { isPlaying, isDone, speed, array, comparisons, swaps, currentStep, steps } =
    state;

  const isBarChart = rendererType === 'bar-chart';
  const arraySize = array.length;

  const sliderSpeedValue = Math.round(speed * 4);
  const speedLabel = `${speed === Math.floor(speed) ? speed + '.0' : speed}×`;
  const totalSteps = steps.length;

  const speedFillPct = ((sliderSpeedValue - 1) / (16 - 1)) * 100;
  const sizeFillPct = ((arraySize - minSize) / (maxSize - minSize)) * 100;

  const stepDisplay = totalSteps > 0 ? `${currentStep}/${totalSteps}` : '—';

  const statLabels = RENDERER_STAT_LABELS[rendererType] ?? RENDERER_STAT_LABELS['bar-chart'];

  // Derive a human-readable status string for the aria-live region
  let liveStatus: string;
  if (isDone) {
    liveStatus = `Animation complete. ${comparisons} ${statLabels.primaryFull}, ${swaps} ${statLabels.secondaryFull} in ${totalSteps} steps.`;
  } else if (isPlaying) {
    liveStatus = `Playing — step ${currentStep} of ${totalSteps}.`;
  } else if (currentStep > 0) {
    liveStatus = `Paused at step ${currentStep} of ${totalSteps}. ${comparisons} ${statLabels.primaryFull}, ${swaps} ${statLabels.secondaryFull} so far.`;
  } else if (isBarChart) {
    liveStatus = `Ready. Array size: ${arraySize}. Press Space to play or Right Arrow to step.`;
  } else {
    liveStatus = `Ready. Press Space to play or Right Arrow to step.`;
  }

  // ── Global keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Do not intercept when the user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case ' ':
        case 'Space':
          e.preventDefault();
          if (isPlaying) {
            onPause();
          } else if (!isDone) {
            onPlay();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isPlaying && !isDone) onStep();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onReset();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isDone, onPlay, onPause, onStep, onReset]);

  return (
    <div
      role="group"
      aria-label="Animation controls"
      className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/6 bg-[#12121a]/80 backdrop-blur-md px-5 py-3.5 shadow-[0_1px_1px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      {/* Screen-reader live region for animation status updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveStatus}
      </div>

      {/* Play/Pause — hero button */}
      <PlayPauseButton
        isPlaying={isPlaying}
        disabled={isDone && !isPlaying}
        onPlay={onPlay}
        onPause={onPause}
      />

      {/* Step */}
      <IconButton
        onClick={onStep}
        disabled={isPlaying || isDone}
        title="Step forward one operation (Right Arrow)"
      >
        <StepIcon />
        <span>Step</span>
      </IconButton>

      {/* Reset */}
      <IconButton onClick={onReset} title="Reset with a new random array (R)">
        <ResetIcon />
        <span>Reset</span>
      </IconButton>

      <Separator />

      {/* Speed slider */}
      <Slider
        label="Speed"
        ariaLabel="Animation speed"
        value={sliderSpeedValue}
        min={1}
        max={16}
        step={1}
        displayValue={speedLabel}
        fillPercent={speedFillPct}
        onChange={v => onSpeedChange(v / 4)}
      />

      {/* Size slider — only shown for bar-chart (array-based) renderers */}
      {isBarChart && (
        <>
          <Separator />
          <Slider
            label="Size"
            ariaLabel="Array size"
            value={arraySize}
            min={minSize}
            max={maxSize}
            step={1}
            fillPercent={sizeFillPct}
            onChange={onSizeChange}
          />
        </>
      )}

      <Separator />

      {/* Stats as pill badges */}
      <div className="flex items-center gap-1.5" aria-label="Animation statistics">
        <StatPill label="step" fullLabel="step" value={stepDisplay} color="text-[#908caa]" />
        <StatPill label={statLabels.primary} fullLabel={statLabels.primaryFull} value={comparisons} color="text-[#c4a7e7]" />
        <StatPill label={statLabels.secondary} fullLabel={statLabels.secondaryFull} value={swaps} color="text-[#f6c177]" />
      </div>

      {/* Keyboard hint — visually subtle, sr-accessible */}
      <p className="sr-only">
        Keyboard shortcuts: Space to play or pause, Right Arrow to step forward, R to reset.
      </p>
    </div>
  );
}
