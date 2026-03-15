import { COLORS, type AnimationState, type SceneState } from '../animation-engine';

/**
 * Color-spectrum renderer — visualizes sorting as a row of colored cells
 * where each value maps to a hue on the visible spectrum.
 *
 * Value 0.0 → hue 0° (red), value 1.0 → hue 270° (violet).
 * Cell state is conveyed through saturation/lightness shifts and glow effects.
 */
export function drawColorSpectrum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _scene: SceneState | null,
  state: AnimationState
): void {
  const arr = state.array;
  const comparing = state.comparingIndices;
  const swapping = state.swappingIndices;
  const sorted = state.sortedIndices;
  const n = arr.length;

  ctx.clearRect(0, 0, width, height);

  if (n === 0) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('n=0  |  empty', 40, 24);
    return;
  }

  const padding = 40;
  const gap = 1;
  const totalGaps = (n - 1) * gap;
  const cellWidth = (width - padding * 2 - totalGaps) / n;
  const cellHeight = height - padding * 2 - 40; // leave room for status + tick marks
  const cellY = padding + 20; // below status text
  const radius = 2;

  for (let i = 0; i < n; i++) {
    const x = padding + i * (cellWidth + gap);
    const hue = arr[i] * 270;

    let saturation = 70;
    let lightness = 50;
    let glow = false;
    let glowColor = '';
    let isSorted = false;

    if (sorted.has(i)) {
      saturation = 85;
      lightness = 55;
      isSorted = true;
    }

    if (comparing.includes(i)) {
      saturation = 90;
      lightness = 65;
      glow = true;
      glowColor = `hsl(${hue}, 90%, 75%)`;
    }

    if (swapping.includes(i)) {
      saturation = 95;
      lightness = 70;
      glow = true;
      glowColor = `hsl(${hue}, 95%, 80%)`;
    }

    const cellColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    // Glow effect
    if (glow) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;
    }

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(x + radius, cellY);
    ctx.lineTo(x + cellWidth - radius, cellY);
    ctx.quadraticCurveTo(x + cellWidth, cellY, x + cellWidth, cellY + radius);
    ctx.lineTo(x + cellWidth, cellY + cellHeight - radius);
    ctx.quadraticCurveTo(x + cellWidth, cellY + cellHeight, x + cellWidth - radius, cellY + cellHeight);
    ctx.lineTo(x + radius, cellY + cellHeight);
    ctx.quadraticCurveTo(x, cellY + cellHeight, x, cellY + cellHeight - radius);
    ctx.lineTo(x, cellY + radius);
    ctx.quadraticCurveTo(x, cellY, x + radius, cellY);
    ctx.closePath();

    ctx.fillStyle = cellColor;
    ctx.fill();

    // White top border glow for comparing
    if (comparing.includes(i)) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Pulsing border for swapping
    if (swapping.includes(i)) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Sorted indicator: small checkmark at center
    if (isSorted && !comparing.includes(i) && !swapping.includes(i)) {
      const cx = x + cellWidth / 2;
      const cy = cellY + cellHeight / 2;
      const size = Math.min(cellWidth * 0.3, 6);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx - size * 0.3, cy + size * 0.7);
      ctx.lineTo(cx + size, cy - size * 0.5);
      ctx.stroke();
    }
  }

  // Tick marks along bottom every 5 elements
  ctx.strokeStyle = COLORS.textMuted;
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 1;

  const tickY = cellY + cellHeight + 6;
  for (let i = 0; i < n; i += 5) {
    const x = padding + i * (cellWidth + gap) + cellWidth / 2;
    ctx.beginPath();
    ctx.moveTo(x, tickY);
    ctx.lineTo(x, tickY + 4);
    ctx.stroke();
    ctx.fillText(String(i), x, tickY + 14);
  }

  // Status line (top-left)
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';

  let statusText = 'ready';
  if (state.isPlaying) statusText = 'sorting\u2026';
  if (state.isDone) statusText = 'sorted \u2713';

  ctx.fillText(`n=${n}  |  ${statusText}`, padding, 24);

  // Active operation info (top-right)
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
      `swapping [${swapping[0]}] \u2194 [${swapping[1]}]`,
      width - padding,
      24
    );
  }
}
