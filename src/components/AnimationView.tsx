'use client';

import { useAnimation } from '@/hooks/useAnimation';
import { AnimationCanvas } from '@/components/AnimationCanvas';
import { AnimationControls } from '@/components/AnimationControls';
import { getAlgorithm } from '@/lib/algorithms';

interface AnimationViewProps {
  algorithmId: string;
  initialSize?: number;
}

/**
 * AnimationView
 *
 * Client boundary component that owns the animation lifecycle.
 * It looks up the algorithm by ID, wires up useAnimation (passing the
 * algorithm's rendererType), and renders the canvas + controls.
 * The parent server page handles all static content (breadcrumbs, title,
 * info panels) so they remain server-rendered.
 */
export function AnimationView({ algorithmId, initialSize = 24 }: AnimationViewProps) {
  const algo = getAlgorithm(algorithmId);
  const rendererType = algo?.rendererType ?? 'bar-chart';

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
    // Fall back to a no-op generator if the algorithm isn't registered yet
    algo?.generateSteps ?? (() => []),
    initialSize,
    rendererType
  );

  const canvasStatus = state.isDone
    ? 'complete'
    : state.isPlaying
    ? 'running'
    : 'ready';

  return (
    <section aria-label="Interactive algorithm visualisation" className="flex flex-col gap-3">
      <AnimationCanvas
        canvasRef={canvasRef}
        height={480}
        status={canvasStatus}
      />
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
    </section>
  );
}
