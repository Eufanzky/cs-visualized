import { COLORS, type AnimationState, type SceneState, type MazeScene } from '../animation-engine';

/**
 * Maze renderer — draws a grid of cells colored by state.
 *
 * Cell states:
 *   'wall'     → dark background
 *   'empty'    → default passable
 *   'start'    → green with "S" label
 *   'goal'     → gold with "G" label
 *   'current'  → purple with glow
 *   'queued' / 'frontier' → gold with subtle glow
 *   'visited'  → muted purple
 *   'path'     → bright green with glow
 */

const CELL_COLORS: Record<string, { fill: string; glow: string | null; label?: string }> = {
  wall:     { fill: '#1a1a26', glow: null },
  empty:    { fill: '#2a2a3a', glow: null },
  start:    { fill: '#a6da95', glow: '#a6da95', label: 'S' },
  goal:     { fill: '#f6c177', glow: '#f6c177', label: 'G' },
  current:  { fill: '#c4a7e7', glow: '#c4a7e7' },
  queued:   { fill: '#f6c177', glow: '#f6c17744' },
  frontier: { fill: '#f6c177', glow: '#f6c17744' },
  visited:  { fill: '#5a5478', glow: null },
  path:     { fill: '#a6da95', glow: '#a6da95' },
};

const GAP = 1.5;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawMaze(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState,
): void {
  ctx.clearRect(0, 0, width, height);

  if (!scene || scene.type !== 'maze') {
    drawMazePlaceholder(ctx, width, height, state);
    return;
  }

  const mazeScene = scene as MazeScene;
  const { grid, cellStates, rows, cols, frontier } = mazeScene;

  // Reserve space for status line at top and frontier at bottom
  const topMargin = 34;
  const bottomMargin = frontier && frontier.length > 0 ? 30 : 14;
  const availW = width - 20;
  const availH = height - topMargin - bottomMargin;

  const cellW = (availW - GAP * (cols - 1)) / cols;
  const cellH = (availH - GAP * (rows - 1)) / rows;
  const cellSize = Math.min(cellW, cellH);

  const gridW = cellSize * cols + GAP * (cols - 1);
  const gridH = cellSize * rows + GAP * (rows - 1);
  const offsetX = (width - gridW) / 2;
  const offsetY = topMargin + (availH - gridH) / 2;

  const cornerR = Math.max(2, cellSize * 0.15);

  // ── Draw cells ─────────────────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const isWall = grid[r][c] === 1;
      let cellState = cellStates[key] ?? (isWall ? 'wall' : 'empty');

      // Ensure walls stay as walls unless explicitly overridden
      if (isWall && !cellStates[key]) cellState = 'wall';

      const colors = CELL_COLORS[cellState] ?? CELL_COLORS.empty;

      const x = offsetX + c * (cellSize + GAP);
      const y = offsetY + r * (cellSize + GAP);

      // Glow
      if (colors.glow) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = cellState === 'current' || cellState === 'path' ? 12 : 6;
      }

      roundedRect(ctx, x, y, cellSize, cellSize, cornerR);
      ctx.fillStyle = colors.fill;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Label (S / G)
      if (colors.label) {
        ctx.fillStyle = '#12121a';
        ctx.font = `bold ${Math.max(9, cellSize * 0.5)}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(colors.label, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // ── Frontier display ───────────────────────────────────────────────────
  if (frontier && frontier.length > 0) {
    const maxShow = Math.min(frontier.length, 20);
    const shown = frontier.slice(0, maxShow);
    const suffix = frontier.length > maxShow ? ` ... +${frontier.length - maxShow}` : '';
    const label = `[ ${shown.join(' | ')}${suffix} ]`;

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, 16, height - 14);
  }

  // ── Status line ────────────────────────────────────────────────────────
  drawMazeStatus(ctx, width, state);
}

function drawMazeStatus(
  ctx: CanvasRenderingContext2D,
  width: number,
  state: AnimationState,
): void {
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let statusText = 'ready';
  if (state.isPlaying) statusText = 'exploring...';
  if (state.isDone) statusText = 'path found';

  ctx.fillText(`maze  |  ${statusText}`, 16, 24);
}

function drawMazePlaceholder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState,
): void {
  // Draw a small placeholder grid
  const rows = 7;
  const cols = 7;
  const cellSize = Math.min((width - 40) / cols, (height - 80) / rows, 28);
  const gridW = cellSize * cols + GAP * (cols - 1);
  const gridH = cellSize * rows + GAP * (rows - 1);
  const offsetX = (width - gridW) / 2;
  const offsetY = (height - gridH) / 2;
  const cornerR = Math.max(2, cellSize * 0.15);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * (cellSize + GAP);
      const y = offsetY + r * (cellSize + GAP);
      roundedRect(ctx, x, y, cellSize, cellSize, cornerR);
      // Checkerboard-ish pattern for visual interest
      const isWall = (r + c) % 3 === 0 && !(r === 0 && c === 0) && !(r === rows - 1 && c === cols - 1);
      ctx.fillStyle = isWall ? '#1a1a26' : '#2a2a3a';
      ctx.fill();
    }
  }

  // Start and goal markers
  const sx = offsetX + 0 * (cellSize + GAP);
  const sy = offsetY + 0 * (cellSize + GAP);
  roundedRect(ctx, sx, sy, cellSize, cellSize, cornerR);
  ctx.fillStyle = '#a6da95';
  ctx.fill();
  ctx.fillStyle = '#12121a';
  ctx.font = `bold ${Math.max(9, cellSize * 0.5)}px JetBrains Mono, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', sx + cellSize / 2, sy + cellSize / 2);

  const gx = offsetX + (cols - 1) * (cellSize + GAP);
  const gy = offsetY + (rows - 1) * (cellSize + GAP);
  roundedRect(ctx, gx, gy, cellSize, cellSize, cornerR);
  ctx.fillStyle = '#f6c177';
  ctx.fill();
  ctx.fillStyle = '#12121a';
  ctx.fillText('G', gx + cellSize / 2, gy + cellSize / 2);

  drawMazeStatus(ctx, width, state);
}
