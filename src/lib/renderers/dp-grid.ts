import { COLORS, type AnimationState, type SceneState, type DPGridScene } from '../animation-engine';

/**
 * DP-grid renderer — draws a 2D grid of cells with state-based coloring.
 *
 * Cell states:
 *   'computing'  → comparing (purple) — currently being evaluated
 *   'computed'   → sorted (green) — value has been filled in
 *   'highlight'  → gold — relevant to current step (e.g., parent cells)
 *   'path'       → sorted (green, brighter) — on the backtracking path
 *   default      → muted gray
 *
 * When no scene is provided, falls back to a 1D strip layout that mirrors
 * the flat-index encoding used by fibonacci.ts / lcs.ts / knapsack.ts.
 */
export function drawDPGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, width, height);

  if (scene && scene.type === 'dp-grid') {
    drawDPGridScene(ctx, width, height, scene as DPGridScene, state);
  } else {
    drawDPGridFallback(ctx, width, height, state);
  }
}

function getCellColor(cellState: string): { fill: string; stroke: string } {
  switch (cellState) {
    case 'computing':
      return { fill: COLORS.comparing + '88', stroke: COLORS.comparing };
    case 'computed':
      return { fill: COLORS.sorted + '55', stroke: COLORS.sorted };
    case 'highlight':
      return { fill: COLORS.swapping + '77', stroke: COLORS.swapping };
    case 'path':
      return { fill: COLORS.sorted + '99', stroke: COLORS.sorted };
    default:
      return { fill: '#1e1e2e', stroke: '#3a3a52' };
  }
}

function drawDPGridScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: DPGridScene,
  state: AnimationState
): void {
  const { grid, rowLabels, colLabels } = scene;
  if (!grid || grid.length === 0) {
    drawStatusLine(ctx, width, state);
    return;
  }

  if (!grid[0]) { drawStatusLine(ctx, width, state); return; }

  const numRows = grid.length;
  const numCols = grid[0].length;

  const padding = 48;
  const labelW = rowLabels ? 32 : 0;
  const labelH = colLabels ? 28 : 0;
  const usableW = width - padding * 2 - labelW;
  const usableH = height - padding * 2 - 30 - labelH;
  const cellW = Math.min(60, usableW / numCols);
  const cellH = Math.min(48, usableH / numRows);
  const startX = padding + labelW;
  const startY = padding + labelH;

  // Column labels
  if (colLabels) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let j = 0; j < numCols && j < colLabels.length; j++) {
      ctx.fillText(colLabels[j], startX + j * cellW + cellW / 2, padding + labelH / 2);
    }
  }

  // Row labels
  if (rowLabels) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < numRows && i < rowLabels.length; i++) {
      ctx.fillText(rowLabels[i], padding + labelW - 6, startY + i * cellH + cellH / 2);
    }
  }

  // Grid cells
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      const cell = grid[i][j];
      const { fill, stroke } = getCellColor(cell.state);
      const x = startX + j * cellW;
      const y = startY + i * cellH;
      const isGlow = cell.state === 'computing' || cell.state === 'path';

      if (isGlow) {
        ctx.shadowColor = stroke;
        ctx.shadowBlur = 10;
      }

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, cellW - 1, cellH - 1);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = cell.state === 'computing' || cell.state === 'path' ? 1.5 : 0.75;
      ctx.strokeRect(x, y, cellW - 1, cellH - 1);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Value
      if (cell.value !== '' && cell.value !== '—') {
        const textColor =
          cell.state === 'computed' || cell.state === 'path'
            ? COLORS.sorted
            : cell.state === 'computing'
            ? COLORS.comparing
            : cell.state === 'highlight'
            ? COLORS.swapping
            : COLORS.textMuted;

        ctx.fillStyle = textColor;
        ctx.font = `${Math.min(13, cellW * 0.3)}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.value, x + cellW / 2, y + cellH / 2);
      }
    }
  }

  drawStatusLine(ctx, width, state);
}

/**
 * Fallback: draw a 1D strip for algorithms like fibonacci that use a
 * linear DP table encoded as flat indices.
 */
function drawDPGridFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
  // Detect problem size from step indices (max index seen in comparing/sorting)
  const allIndices = [
    ...state.comparingIndices,
    ...state.swappingIndices,
    ...Array.from(state.sortedIndices),
  ];
  const maxIdx = allIndices.length > 0 ? Math.max(...allIndices) : 14;
  const n = Math.min(maxIdx + 1, 20);

  if (n === 0) {
    drawStatusLine(ctx, width, state);
    return;
  }

  const padding = 48;
  const usableW = width - padding * 2;
  const cellW = Math.min(56, usableW / n - 4);
  const cellH = 52;
  const cy = height / 2;

  for (let i = 0; i < n; i++) {
    const x = padding + i * (cellW + 4);
    const isComparing = state.comparingIndices.includes(i);
    const isSwapping = state.swappingIndices.includes(i);
    const isSorted = state.sortedIndices.has(i);

    const color = isComparing
      ? COLORS.comparing
      : isSwapping
      ? COLORS.swapping
      : isSorted
      ? COLORS.sorted
      : '#1e1e2e';

    const glow = isComparing || isSwapping || isSorted;

    if (glow) {
      ctx.shadowColor = isComparing || isSwapping ? color : COLORS.sorted;
      ctx.shadowBlur = 8;
    }

    ctx.fillStyle = isSorted || isComparing || isSwapping ? color + '88' : '#1e1e2e';
    ctx.fillRect(x, cy - cellH / 2, cellW, cellH);
    ctx.strokeStyle = color;
    ctx.lineWidth = isComparing ? 1.5 : 0.75;
    ctx.strokeRect(x, cy - cellH / 2, cellW, cellH);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Index label
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${i}`, x + cellW / 2, cy + cellH / 2 + 4);

    // Cell label (fib(i))
    ctx.fillStyle = isSorted ? COLORS.sorted : isComparing ? COLORS.comparing : COLORS.textMuted;
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`f(${i})`, x + cellW / 2, cy);
  }

  drawStatusLine(ctx, width, state);
}

function drawStatusLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  state: AnimationState
): void {
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let statusText = 'ready';
  if (state.isPlaying) statusText = 'computing…';
  if (state.isDone) statusText = 'complete ✓';

  ctx.fillText(`dp-grid  |  ${statusText}`, 16, 24);
}
