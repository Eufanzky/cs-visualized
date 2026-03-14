import { COLORS, type AnimationState, type SceneState } from '../animation-engine';

/**
 * Box-swap renderer — visualizes sorting as numbered boxes that physically swap.
 *
 * Each box displays `Math.round(value * 100)` as a label and is colored
 * according to its current state (comparing, swapping, sorted, default).
 * Pointer arrows below active boxes indicate algorithm pointers (i, j).
 */
export function drawBoxSwap(
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

  const padding = 40;
  const boxGap = 6;
  const maxBoxWidth = 60;
  const totalGaps = (n - 1) * boxGap;
  const availableWidth = width - padding * 2 - totalGaps;
  const boxWidth = Math.min(maxBoxWidth, availableWidth / n);
  const boxHeight = boxWidth * 0.9;
  const radius = 8;

  // Center boxes horizontally
  const totalWidth = n * boxWidth + totalGaps;
  const startX = (width - totalWidth) / 2;

  // Center boxes vertically (leave room for status at top and pointers below)
  const centerY = height / 2 - 10;
  const boxY = centerY - boxHeight / 2;

  for (let i = 0; i < n; i++) {
    const x = startX + i * (boxWidth + boxGap);
    const value = Math.round(arr[i] * 100);

    let fillColor = '#3a3a52';
    let textColor: string = COLORS.text;
    let glow = false;
    let glowColor = '';

    if (sorted.has(i)) {
      fillColor = COLORS.sorted;
      textColor = '#1a1a2e';
    }
    if (comparing.includes(i)) {
      fillColor = COLORS.comparing;
      textColor = '#1a1a2e';
      glow = true;
      glowColor = COLORS.comparing;
    }
    if (swapping.includes(i)) {
      fillColor = COLORS.swapping;
      textColor = '#1a1a2e';
      glow = true;
      glowColor = COLORS.swapping;
    }

    // Glow effect
    if (glow) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20;
    }

    // Draw rounded rectangle with gradient fill
    ctx.beginPath();
    ctx.moveTo(x + radius, boxY);
    ctx.lineTo(x + boxWidth - radius, boxY);
    ctx.quadraticCurveTo(x + boxWidth, boxY, x + boxWidth, boxY + radius);
    ctx.lineTo(x + boxWidth, boxY + boxHeight - radius);
    ctx.quadraticCurveTo(x + boxWidth, boxY + boxHeight, x + boxWidth - radius, boxY + boxHeight);
    ctx.lineTo(x + radius, boxY + boxHeight);
    ctx.quadraticCurveTo(x, boxY + boxHeight, x, boxY + boxHeight - radius);
    ctx.lineTo(x, boxY + radius);
    ctx.quadraticCurveTo(x, boxY, x + radius, boxY);
    ctx.closePath();

    // Gradient fill — lighter at top for depth
    const grad = ctx.createLinearGradient(x, boxY, x, boxY + boxHeight);
    grad.addColorStop(0, lightenColor(fillColor, 15));
    grad.addColorStop(1, fillColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = lightenColor(fillColor, 25);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Value text inside box
    const fontSize = Math.min(16, boxWidth * 0.4);
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + boxWidth / 2, boxY + boxHeight / 2);
  }

  // Pointer arrows below active boxes
  const arrowY = boxY + boxHeight + 12;
  const arrowSize = 6;

  if (comparing.length >= 1) {
    drawPointer(ctx, startX, boxWidth, boxGap, comparing[0], arrowY, arrowSize, COLORS.comparing, 'i');
  }
  if (comparing.length >= 2) {
    drawPointer(ctx, startX, boxWidth, boxGap, comparing[1], arrowY, arrowSize, COLORS.comparing, 'j');
  }
  if (swapping.length >= 1) {
    drawPointer(ctx, startX, boxWidth, boxGap, swapping[0], arrowY, arrowSize, COLORS.swapping, 'i');
  }
  if (swapping.length >= 2) {
    drawPointer(ctx, startX, boxWidth, boxGap, swapping[1], arrowY, arrowSize, COLORS.swapping, 'j');
  }

  // Status line (top-left)
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

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

/**
 * Draws a small triangular pointer below a box with a label underneath.
 */
function drawPointer(
  ctx: CanvasRenderingContext2D,
  startX: number,
  boxWidth: number,
  boxGap: number,
  index: number,
  arrowY: number,
  arrowSize: number,
  color: string,
  label: string
): void {
  const cx = startX + index * (boxWidth + boxGap) + boxWidth / 2;

  // Triangle pointing up
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, arrowY);
  ctx.lineTo(cx - arrowSize, arrowY + arrowSize);
  ctx.lineTo(cx + arrowSize, arrowY + arrowSize);
  ctx.closePath();
  ctx.fill();

  // Label below triangle
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, cx, arrowY + arrowSize + 2);
}

/**
 * Attempt to lighten a hex color by a given percentage.
 * Falls back to the original color if parsing fails.
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  r = Math.min(255, r + Math.round((255 - r) * (percent / 100)));
  g = Math.min(255, g + Math.round((255 - g) * (percent / 100)));
  b = Math.min(255, b + Math.round((255 - b) * (percent / 100)));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
