import { COLORS, type AnimationState, type SceneState, type LinearScene } from '../animation-engine';

/**
 * Linear renderer — draws stacks, queues, and linked lists as blocks.
 *
 * Stacks render vertically (top of stack at top of canvas).
 * Queues render horizontally (front on the left).
 * Linked lists render horizontally with arrow connectors between nodes.
 *
 * When no scene is available, falls back to using step indices on
 * the values array.
 */
export function drawLinear(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, width, height);

  if (scene && scene.type === 'linear') {
    drawLinearScene(ctx, width, height, scene as LinearScene, state);
  } else {
    drawLinearFallback(ctx, width, height, state);
  }
}

function getItemColor(itemState: string): string {
  switch (itemState) {
    case 'active':
    case 'comparing': return COLORS.comparing;
    case 'inserted':  return COLORS.swapping;
    case 'removed':   return COLORS.swapping;
    case 'settled':   return COLORS.sorted;
    default:          return '#3a3a52';
  }
}

function drawLinearScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: LinearScene,
  state: AnimationState
): void {
  const { items, pointers, structureType } = scene;

  if (items.length === 0) {
    drawStatusLine(ctx, width, state, structureType);
    return;
  }

  const isVertical = structureType === 'stack';
  const padding = 48;

  if (isVertical) {
    drawStack(ctx, width, height, items, pointers ?? [], padding, state, structureType);
  } else {
    drawHorizontal(ctx, width, height, items, pointers ?? [], padding, state, structureType);
  }
}

function drawStack(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  items: LinearScene['items'],
  pointers: NonNullable<LinearScene['pointers']>,
  padding: number,
  state: AnimationState,
  structureType: string
): void {
  const n = items.length;
  const maxVisible = Math.min(n, 10);
  const usableH = height - padding * 2 - 30;
  const blockH = Math.min(52, usableH / maxVisible);
  const blockW = Math.min(200, (width - padding * 2) * 0.5);
  const cx = width / 2;
  const startX = cx - blockW / 2;

  // Draw from bottom (index 0) to top (index n-1)
  for (let i = 0; i < maxVisible; i++) {
    const item = items[i];
    const color = getItemColor(item.state);
    const glow = item.state !== 'default';

    // y: stack grows upward — index 0 at bottom
    const y = height - padding - (i + 1) * blockH;

    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }

    const radius = 6;
    roundRect(ctx, startX, y, blockW, blockH - 2, radius);
    const grad = ctx.createLinearGradient(startX, y, startX, y + blockH);
    grad.addColorStop(0, color + 'bb');
    grad.addColorStop(1, color + '66');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Value text
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.value, cx, y + blockH / 2 - 1);
  }

  // "TOP" label
  if (n > 0) {
    const topY = height - padding - maxVisible * blockH;
    ctx.fillStyle = COLORS.comparing;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('← TOP', cx + blockW / 2 + 8, topY + blockH / 2);
  }

  drawStatusLine(ctx, width, state, structureType);
}

function drawHorizontal(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  items: LinearScene['items'],
  pointers: NonNullable<LinearScene['pointers']>,
  padding: number,
  state: AnimationState,
  structureType: string
): void {
  const n = items.length;
  const maxVisible = Math.min(n, 10);
  const usableW = width - padding * 2;
  const isLinkedList = structureType === 'linked-list';
  const arrowW = isLinkedList ? 28 : 6;
  const blockW = Math.min(80, (usableW - arrowW * (maxVisible - 1)) / maxVisible);
  const blockH = Math.min(60, (height - padding * 2 - 30) * 0.5);
  const cy = height / 2;
  const startX = padding;

  for (let i = 0; i < maxVisible; i++) {
    const item = items[i];
    const color = getItemColor(item.state);
    const glow = item.state !== 'default';
    const x = startX + i * (blockW + arrowW);

    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }

    const radius = isLinkedList ? 8 : 4;
    roundRect(ctx, x, cy - blockH / 2, blockW, blockH, radius);
    const grad = ctx.createLinearGradient(x, cy - blockH / 2, x, cy + blockH / 2);
    grad.addColorStop(0, color + 'bb');
    grad.addColorStop(1, color + '66');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.value, x + blockW / 2, cy);

    // Arrow between nodes (linked-list style)
    if (isLinkedList && i < maxVisible - 1) {
      const arrowX = x + blockW + 2;
      ctx.strokeStyle = '#4a4a66';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(arrowX, cy);
      ctx.lineTo(arrowX + arrowW - 4, cy);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(arrowX + arrowW - 4, cy);
      ctx.lineTo(arrowX + arrowW - 10, cy - 4);
      ctx.moveTo(arrowX + arrowW - 4, cy);
      ctx.lineTo(arrowX + arrowW - 10, cy + 4);
      ctx.stroke();
    }

    // Pointer labels (e.g. HEAD, TAIL)
    const ptr = pointers.find(p => p.index === i);
    if (ptr) {
      ctx.fillStyle = COLORS.comparing;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(ptr.label, x + blockW / 2, cy + blockH / 2 + 6);
    }
  }

  drawStatusLine(ctx, width, state, structureType);
}

/** Fallback: draw values as horizontal colored blocks using step state */
function drawLinearFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
  const arr = state.array.slice(0, 10);
  const n = arr.length;
  const padding = 48;
  const usableW = width - padding * 2;
  const blockW = Math.min(70, usableW / n - 4);
  const blockH = 52;
  const cy = height / 2;

  for (let i = 0; i < n; i++) {
    const x = padding + i * (blockW + 4);
    const isComparing = state.comparingIndices.includes(i);
    const isSwapping = state.swappingIndices.includes(i);
    const isSorted = state.sortedIndices.has(i);

    const color = isComparing
      ? COLORS.comparing
      : isSwapping
      ? COLORS.swapping
      : isSorted
      ? COLORS.sorted
      : '#3a3a52';

    if (isComparing || isSwapping) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }

    roundRect(ctx, x, cy - blockH / 2, blockW, blockH, 6);
    ctx.fillStyle = color + '99';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(arr[i] * 100).toString(), x + blockW / 2, cy);
  }

  drawStatusLine(ctx, width, state, 'linear');
}

function drawStatusLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  state: AnimationState,
  structureType: string
): void {
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let statusText = 'ready';
  if (state.isPlaying) statusText = 'running…';
  if (state.isDone) statusText = 'complete ✓';

  ctx.fillText(`${structureType}  |  ${statusText}`, 16, 24);
}

/** Helper: draw a rounded rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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
