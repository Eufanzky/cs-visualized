'use client';

import { AnimationState } from '../lib/animation-engine';

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
}

// ── Sub-components ────────────────────────────────────────────────────────

function ControlButton({
  onClick,
  variant = 'default',
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  variant?: 'primary' | 'default';
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium font-mono transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30';

  const variants = {
    primary:
      'bg-[#c4a7e7]/20 text-[#c4a7e7] border border-[#c4a7e7]/30 hover:bg-[#c4a7e7]/30 active:scale-95',
    default:
      'bg-white/5 text-[#e0def4] border border-white/10 hover:bg-white/10 active:scale-95',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${variants[variant]}`}
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
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-[#6e6a86] min-w-[40px]">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-28 accent-[#c4a7e7] cursor-pointer"
      />
      <span className="text-xs font-mono text-[#908caa] min-w-[36px]">
        {displayValue ?? String(value)}
      </span>
    </div>
  );
}

function Separator() {
  return <div className="h-6 w-px bg-white/10" aria-hidden />;
}

// ── Main component ────────────────────────────────────────────────────────

/**
 * AnimationControls
 *
 * Renders Play/Pause, Step, Reset buttons plus Speed and Size sliders.
 * Also shows real-time counters for the current step, comparisons, and swaps.
 */
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
}: AnimationControlsProps) {
  const { isPlaying, isDone, speed, array, comparisons, swaps, currentStep, steps } =
    state;

  const arraySize = array.length;

  // Speed is stored as a multiplier (0.25 – 4); map to a 1–16 slider integer
  // so we get fine-grained control at low end, coarse at high end.
  // Slider value = speed * 4  (0.25→1, 1→4, 4→16)
  const sliderSpeedValue = Math.round(speed * 4);
  const speedLabel = `${speed === Math.floor(speed) ? speed + '.0' : speed}×`;

  const totalSteps = steps.length;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#1a1a2e] border border-white/5 px-5 py-3">
      {/* Playback buttons */}
      <ControlButton
        variant="primary"
        onClick={isPlaying ? onPause : onPlay}
        disabled={isDone && !isPlaying}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <>
            <span>❚❚</span> Pause
          </>
        ) : (
          <>
            <span>▶</span> Play
          </>
        )}
      </ControlButton>

      <ControlButton
        onClick={onStep}
        disabled={isPlaying || isDone}
        title="Step forward one operation"
      >
        Step
      </ControlButton>

      <ControlButton onClick={onReset} title="Reset with a new random array">
        Reset
      </ControlButton>

      <Separator />

      {/* Speed slider */}
      <Slider
        label="Speed"
        value={sliderSpeedValue}
        min={1}
        max={16}
        step={1}
        displayValue={speedLabel}
        onChange={v => onSpeedChange(v / 4)}
      />

      <Separator />

      {/* Size slider */}
      <Slider
        label="Size"
        value={arraySize}
        min={minSize}
        max={maxSize}
        step={1}
        onChange={onSizeChange}
      />

      <Separator />

      {/* Counters */}
      <div className="flex items-center gap-4 font-mono text-xs text-[#6e6a86]">
        <span>
          step{' '}
          <span className="text-[#908caa]">
            {totalSteps > 0 ? `${currentStep}/${totalSteps}` : '—'}
          </span>
        </span>
        <span>
          cmp{' '}
          <span className="text-[#c4a7e7]">{comparisons}</span>
        </span>
        <span>
          swp{' '}
          <span className="text-[#f6c177]">{swaps}</span>
        </span>
      </div>
    </div>
  );
}
