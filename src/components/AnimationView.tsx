'use client';

import { useAnimation } from '@/hooks/useAnimation';
import { AnimationCanvas } from '@/components/AnimationCanvas';
import { AnimationControls } from '@/components/AnimationControls';
import { getAlgorithm } from '@/lib/algorithms';

interface AnimationViewProps {
  algorithmId: string;
  initialSize?: number;
}

const STATUS_DOT_COLOR: Record<string, string> = {
  ready: 'bg-[#908caa]',
  running: 'bg-[#a6da95] animate-pulse',
  complete: 'bg-[#f6c177]',
};

/**
 * AnimationView
 *
 * Client boundary component that owns the animation lifecycle.
 * Wraps the canvas + controls in a cohesive "tool window" container
 * with a terminal-style top bar showing the algorithm name and status dot.
 */
export function AnimationView({ algorithmId, initialSize = 24 }: AnimationViewProps) {
  const algo = getAlgorithm(algorithmId);
  const rendererType = algo?.rendererType ?? 'bar-chart';
  const algorithmName = algo?.name ?? algorithmId;

  const {
    state,
    canvasRef,
    play,
    pause,
    stepForward,
    resetAnimation,
    setSpeed,
    setSize,
  } = useAnimation(
    algorithmId,
    algo?.generateSteps ?? (() => []),
    initialSize,
    rendererType
  );

  const canvasStatus = state.isDone
    ? 'complete'
    : state.isPlaying
    ? 'running'
    : 'ready';

  const dotClass = STATUS_DOT_COLOR[canvasStatus] ?? STATUS_DOT_COLOR.ready;

  return (
    <section aria-label="Interactive algorithm visualisation" className="flex flex-col">
      {/* Tool window container */}
      <div className="rounded-lg border border-white/[0.08] bg-[#0a0a11] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {/* Top title bar — terminal / IDE panel feel */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-[#0e0e16]">
          <span className={`block h-2 w-2 rounded-full ${dotClass} shrink-0`} aria-hidden />
          <span className="text-[11px] font-mono text-[#6e6a86] tracking-wide select-none">
            {algorithmName}
          </span>
        </div>

        {/* Canvas area */}
        <div className="p-0">
          <AnimationCanvas
            canvasRef={canvasRef}
            height={480}
            status={canvasStatus}
            algorithmName={algorithmName}
          />
        </div>

        {/* Controls */}
        <AnimationControls
          state={state}
          onPlay={play}
          onPause={pause}
          onStep={stepForward}
          onReset={resetAnimation}
          onSpeedChange={setSpeed}
          onSizeChange={setSize}
          minSize={5}
          maxSize={100}
          rendererType={rendererType}
        />
      </div>
    </section>
  );
}
