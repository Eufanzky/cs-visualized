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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function StepIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5a.5.5 0 0 1 .765-.424l7 3.85V2.5a.5.5 0 0 1 1 0v11a.5.5 0 0 1-1 0v-3.426l-7 3.85A.5.5 0 0 1 3 13.5v-11Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        // Circle button — prominent hero control
        'relative inline-flex items-center justify-center',
        'w-11 h-11 rounded-full',
        'text-sm font-semibold font-mono',
        'transition-all duration-200 ease-out',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a7e7]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12121a]',
        // Press feedback
        'active:scale-90',
        // Accent ring + colors
        'bg-[#c4a7e7]/15 text-[#c4a7e7]',
        'ring-2 ring-[#c4a7e7]/50',
        'hover:bg-[#c4a7e7]/25 hover:ring-[#c4a7e7]/80 hover:shadow-[0_0_20px_rgba(196,167,231,0.25)]',
        // Playing-state pulse glow
        isPlaying ? 'shadow-[0_0_24px_rgba(196,167,231,0.3)] animate-play-glow ring-[#c4a7e7]/70' : '',
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
        'inline-flex items-center justify-center w-10 h-10 rounded-lg',
        'text-sm font-medium font-mono text-[#908caa]',
        'bg-white/5 border border-white/8',
        'transition-all duration-200 ease-out',
        'hover:bg-white/10 hover:border-white/15 hover:text-[#e0def4]',
        'active:scale-90',
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
        className="text-[11px] font-mono text-[#6e6a86] min-w-[38px] uppercase tracking-widest"
      >
        {label}
      </label>
      <div className="relative flex items-center" style={{ width: 120 }}>
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

function ZoneSeparator() {
  return <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" aria-hidden />;
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
      className="flex items-center gap-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 overflow-hidden stat-pill-bg"
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
 * Developer-tool console style controls bar with three zones:
 *   Zone 1: Playback (Play/Pause circle, Step icon, Reset icon)
 *   Zone 2: Parameters (Speed, Size sliders)
 *   Zone 3: Metrics (step counter, comparisons, swaps)
 *
 * Includes a progress bar at the bottom edge.
 *
 * Keyboard shortcuts (when no text field is focused):
 *   Space       -> Play / Pause
 *   ArrowRight  -> Step forward
 *   R           -> Reset
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
  'maze':           { primary: 'cells', primaryFull: 'cells explored', secondary: 'path',  secondaryFull: 'path length' },
  'recursion-tree': { primary: 'calls', primaryFull: 'recursive calls', secondary: 'hits', secondaryFull: 'cache hits' },
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
  const speedLabel = `${speed === Math.floor(speed) ? speed + '.0' : speed}\u00d7`;
  const totalSteps = steps.length;

  const speedFillPct = ((sliderSpeedValue - 1) / (16 - 1)) * 100;
  const sizeFillPct = ((arraySize - minSize) / (maxSize - minSize)) * 100;

  const stepDisplay = totalSteps > 0 ? `${currentStep}/${totalSteps}` : '\u2014';

  const statLabels = RENDERER_STAT_LABELS[rendererType] ?? RENDERER_STAT_LABELS['bar-chart'];

  const progressPct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  // Derive a human-readable status string for the aria-live region
  let liveStatus: string;
  if (isDone) {
    liveStatus = `Animation complete. ${comparisons} ${statLabels.primaryFull}, ${swaps} ${statLabels.secondaryFull} in ${totalSteps} steps.`;
  } else if (isPlaying) {
    liveStatus = `Playing \u2014 step ${currentStep} of ${totalSteps}.`;
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
      className="relative flex flex-col bg-[#0e0e16] overflow-hidden border-t border-white/[0.06]"
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

      {/* Main controls row */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3">
        {/* CONTROLS label */}
        <span
          aria-hidden="true"
          className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#4a4860] mr-0.5 select-none hidden sm:inline"
        >
          controls
        </span>

        <ZoneSeparator />

        {/* Zone 1: Playback */}
        <div className="flex items-center gap-2">
          <PlayPauseButton
            isPlaying={isPlaying}
            disabled={isDone && !isPlaying}
            onPlay={onPlay}
            onPause={onPause}
          />
          <IconButton
            onClick={onStep}
            disabled={isPlaying || isDone}
            title="Step forward one operation (Right Arrow)"
          >
            <StepIcon />
          </IconButton>
          <IconButton onClick={onReset} title="Reset with a new random array (R)">
            <ResetIcon />
          </IconButton>
        </div>

        <ZoneSeparator />

        {/* Zone 2: Parameters */}
        <div className="flex items-center gap-4">
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

          {isBarChart && (
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
          )}
        </div>

        <ZoneSeparator />

        {/* Zone 3: Metrics */}
        <div className="flex items-center gap-2" aria-label="Animation statistics">
          <StatPill label="step" fullLabel="step" value={stepDisplay} color="text-[#908caa]" />
          <StatPill label={statLabels.primary} fullLabel={statLabels.primaryFull} value={comparisons} color="text-[#c4a7e7]" />
          <StatPill label={statLabels.secondary} fullLabel={statLabels.secondaryFull} value={swaps} color="text-[#f6c177]" />
        </div>
      </div>

      {/* Progress bar at the very bottom */}
      <div className="h-[2px] w-full bg-white/[0.04]" aria-hidden>
        <motion.div
          className="h-full bg-[#c4a7e7]"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ boxShadow: progressPct > 0 ? '0 0 8px rgba(196,167,231,0.4)' : 'none' }}
        />
      </div>

      {/* Keyboard hint — visually subtle, sr-accessible */}
      <p className="sr-only">
        Keyboard shortcuts: Space to play or pause, Right Arrow to step forward, R to reset.
      </p>
    </div>
  );
}
