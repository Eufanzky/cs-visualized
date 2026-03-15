import { COLORS, easeInOutCubic, type AnimationState, type SceneState } from '../animation-engine';

/**
 * Box-swap renderer — visualizes sorting as numbered boxes that physically
 * exchange positions along arced paths during swaps.
 *
 * Supports an optional `swapAnimation` parameter so the hook can drive
 * frame-by-frame swap interpolation (boxes arc over/under each other).
 */

export interface BoxSwapAnimation {
  a: number;       // index of first box
  b: number;       // index of second box
  progress: number; // 0 → 1 (eased)
}

// ── Layout helpers ───────────────────────────────────────────────────────

function getLayout(width: number, height: number, n: number) {
  const padding = 40;
  const boxGap = 6;
  const maxBoxWidth = 60;
  const totalGaps = (n - 1) * boxGap;
  const availableWidth = width - padding * 2 - totalGaps;
  const boxWidth = Math.min(maxBoxWidth, availableWidth / n);
  const boxHeight = boxWidth * 0.9;
  const radius = 8;
  const totalWidth = n * boxWidth + totalGaps;
  const startX = (width - totalWidth) / 2;
  const centerY = height / 2 - 10;
  const boxY = centerY - boxHeight / 2;
  // Arc height — taller arc for closer boxes, proportional to box size
  const arcHeight = boxHeight * 1.4;
  return { padding, boxGap, boxWidth, boxHeight, radius, startX, boxY, arcHeight };
}

function boxCenterX(startX: number, boxWidth: number, boxGap: number, index: number) {
  return startX + index * (boxWidth + boxGap) + boxWidth / 2;
}

// ── Main draw function ───────────────────────────────────────────────────

export function drawBoxSwap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _scene: SceneState | null,
  state: AnimationState,
  swapAnim?: BoxSwapAnimation
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

  const layout = getLayout(width, height, n);
  const { padding, boxGap, boxWidth, boxHeight, radius, startX, boxY, arcHeight } = layout;

  // ── Draw each box ────────────────────────────────────────────────────

  for (let i = 0; i < n; i++) {
    const value = Math.round(arr[i] * 100);

    // Compute box position — default is its slot position
    let x = startX + i * (boxWidth + boxGap);
    let y = boxY;

    // If this box is part of an active swap animation, offset it along an arc
    if (swapAnim && (i === swapAnim.a || i === swapAnim.b)) {
      const t = swapAnim.progress;
      const posA = startX + swapAnim.a * (boxWidth + boxGap);
      const posB = startX + swapAnim.b * (boxWidth + boxGap);

      if (i === swapAnim.a) {
        // Box A arcs UP and over to B's position
        x = posA + (posB - posA) * t;
        y = boxY - arcHeight * Math.sin(t * Math.PI);
      } else {
        // Box B arcs DOWN and under to A's position
        x = posB + (posA - posB) * t;
        y = boxY + arcHeight * 0.6 * Math.sin(t * Math.PI);
      }
    }

    // Determine colors
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
    if (swapping.includes(i) || (swapAnim && (i === swapAnim.a || i === swapAnim.b))) {
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

    // Draw rounded rectangle
    drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);

    // Gradient fill
    const grad = ctx.createLinearGradient(x, y, x, y + boxHeight);
    grad.addColorStop(0, lightenColor(fillColor, 15));
    grad.addColorStop(1, fillColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = lightenColor(fillColor, 25);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Value label
    const fontSize = Math.min(16, boxWidth * 0.4);
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x + boxWidth / 2, y + boxHeight / 2);
  }

  // ── Draw arc trail during swap ───────────────────────────────────────

  if (swapAnim && swapAnim.progress > 0 && swapAnim.progress < 1) {
    const posA = startX + swapAnim.a * (boxWidth + boxGap) + boxWidth / 2;
    const posB = startX + swapAnim.b * (boxWidth + boxGap) + boxWidth / 2;

    // Top arc (A's path)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.swapping + '40';
    ctx.lineWidth = 1.5;
    for (let t = 0; t <= 1; t += 0.02) {
      const px = posA + (posB - posA) * t;
      const py = (boxY + boxHeight / 2) - arcHeight * Math.sin(t * Math.PI);
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Bottom arc (B's path)
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.02) {
      const px = posB + (posA - posB) * t;
      const py = (boxY + boxHeight / 2) + arcHeight * 0.6 * Math.sin(t * Math.PI);
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Pointer arrows ───────────────────────────────────────────────────

  if (!swapAnim) {
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
  }

  // ── Status & info text ───────────────────────────────────────────────

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let statusText = 'ready';
  if (state.isPlaying) statusText = 'sorting\u2026';
  if (state.isDone) statusText = 'sorted \u2713';

  ctx.fillText(`n=${n}  |  ${statusText}`, padding, 24);

  if (!swapAnim) {
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
}

// ── Helpers ──────────────────────────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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
  const cx = boxCenterX(startX, boxWidth, boxGap, index);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, arrowY);
  ctx.lineTo(cx - arrowSize, arrowY + arrowSize);
  ctx.lineTo(cx + arrowSize, arrowY + arrowSize);
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, cx, arrowY + arrowSize + 2);
}

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

/**
 * Generate swap animation frames as progress values (0→1, eased).
 * Used by the hook to drive the arc animation.
 */
export function getBoxSwapFrames(totalFrames = 18): number[] {
  const frames: number[] = [];
  for (let f = 1; f <= totalFrames; f++) {
    frames.push(easeInOutCubic(f / totalFrames));
  }
  return frames;
}
