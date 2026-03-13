import { COLORS, type AnimationState, type SceneState } from '../animation-engine';

/**
 * Bar-chart renderer — extracted from useAnimation.ts.
 *
 * Draws the classic bar-chart visualization used by all sorting algorithms.
 * Bars are colored by their current state: comparing (purple), swapping (gold),
 * sorted (green), or default (muted).
 */
export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _scene: SceneState | null,
  state: AnimationState,
  overrideArray?: number[],
  overrideComparing?: number[],
  overrideSwapping?: number[],
  overrideSorted?: Set<number>,
  overrideStatus?: string
): void {
  const arr = overrideArray ?? state.array;
  const comparing = overrideComparing ?? state.comparingIndices;
  const swapping = overrideSwapping ?? state.swappingIndices;
  const sorted = overrideSorted ?? state.sortedIndices;

  ctx.clearRect(0, 0, width, height);

  const padding = 40;
  const gap = 2;
  const n = arr.length;
  const totalGaps = (n - 1) * gap;
  const barWidth = (width - padding * 2 - totalGaps) / n;
  const maxBarHeight = height - padding * 2 - 30;

  for (let i = 0; i < n; i++) {
    const x = padding + i * (barWidth + gap);
    const barH = arr[i] * maxBarHeight;
    const y = height - padding - barH;

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
        height - padding + 14
      );
    }
  }

  // Status line
  const isDone = overrideStatus === 'done' || state.isDone;
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';

  let statusText = 'ready';
  if (state.isPlaying) statusText = 'sorting…';
  if (isDone) statusText = 'sorted ✓';

  ctx.fillText(`n=${n}  |  ${statusText}`, padding, 24);

  if (comparing.length === 2) {
    ctx.fillStyle = COLORS.comparing;
    ctx.textAlign = 'right';
    ctx.fillText(
      `comparing [${comparing[0]}] & [${comparing[1]}]`,
      width - padding,
      24
    );
  }
  if (swapping.length === 2) {
    ctx.fillStyle = COLORS.swapping;
    ctx.textAlign = 'right';
    ctx.fillText(
      `swapping [${swapping[0]}] ↔ [${swapping[1]}]`,
      width - padding,
      24
    );
  }
}
