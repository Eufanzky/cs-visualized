import { COLORS, type AnimationState, type SceneState, type HashTableScene } from '../animation-engine';

/**
 * Hash-table renderer — draws a bucket array with chained entries.
 *
 * Layout:
 *   - Bucket indices are drawn as a column on the left.
 *   - Each bucket row extends rightward with chain nodes.
 *   - The currently hashing key is highlighted in gold.
 *   - Confirmed entries are highlighted in green.
 *
 * Fallback: uses the flat index encoding from hash-table.ts
 * (bucketIndex * MAX_CHAIN + chainPosition) to position step highlights.
 */
export function drawHashTable(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, width, height);

  if (scene && scene.type === 'hash-table') {
    drawHashTableScene(ctx, width, height, scene as HashTableScene, state);
  } else {
    drawHashTableFallback(ctx, width, height, state);
  }
}

function getCellColor(cellState: string): string {
  switch (cellState) {
    case 'computing':
    case 'examining': return COLORS.comparing;
    case 'inserting': return COLORS.swapping;
    case 'confirmed':
    case 'found':     return COLORS.sorted;
    default:          return '#3a3a52';
  }
}

function drawHashTableScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: HashTableScene,
  state: AnimationState
): void {
  const { buckets, tableSize, hashComputation } = scene;
  const padding = 48;
  const usableH = height - padding * 2 - 30;
  const rowH = Math.min(52, usableH / tableSize);
  const bucketLabelW = 52;
  const cellW = Math.min(72, (width - padding * 2 - bucketLabelW) / 4);
  const cellH = Math.min(rowH * 0.75, 40);
  const startX = padding + bucketLabelW;
  const startY = padding;

  for (let b = 0; b < tableSize; b++) {
    const bucket = buckets[b] ?? { index: b, chain: [] };
    const y = startY + b * rowH + rowH / 2;

    // Bucket index label
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[${b}]`, padding + bucketLabelW - 8, y);

    // Bucket box outline (the main array cell)
    const isHashTarget =
      hashComputation !== undefined && hashComputation.bucketIndex === b;

    ctx.strokeStyle = isHashTarget ? COLORS.swapping : '#3a3a52';
    ctx.lineWidth = isHashTarget ? 2 : 1;
    ctx.strokeRect(startX, y - cellH / 2, cellW, cellH);

    if (bucket.chain.length === 0) {
      // Empty bucket — draw nil
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(startX + 1, y - cellH / 2 + 1, cellW - 2, cellH - 2);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('∅', startX + cellW / 2, y);
    }

    // Chain nodes
    for (let c = 0; c < bucket.chain.length; c++) {
      const entry = bucket.chain[c];
      const color = getCellColor(entry.state);
      const glow = entry.state !== 'default' && entry.state !== '';
      const cx = startX + c * (cellW + 20);

      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }

      // Chain connector arrow
      if (c > 0) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#4a4a66';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 20, y);
        ctx.lineTo(cx - 4, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 4, y);
        ctx.lineTo(cx - 10, y - 4);
        ctx.moveTo(cx - 4, y);
        ctx.lineTo(cx - 10, y + 4);
        ctx.stroke();

        if (glow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
        }
      }

      ctx.fillStyle = color + '99';
      ctx.fillRect(cx, y - cellH / 2, cellW, cellH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx, y - cellH / 2, cellW, cellH);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(entry.key), cx + cellW / 2, y);
    }
  }

  // Hash computation annotation
  if (hashComputation) {
    const annotY = padding - 16;
    ctx.fillStyle = COLORS.swapping;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(
      `hash(${hashComputation.key}) → bucket[${hashComputation.bucketIndex}]`,
      padding,
      annotY
    );
  }

  drawStatusLine(ctx, width, state);
}

/**
 * Fallback: decode the flat index (bucket * MAX_CHAIN + pos) used by
 * hash-table.ts to position highlights on a generic grid layout.
 */
function drawHashTableFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
  const TABLE_SIZE = 7;
  const MAX_CHAIN = 3;
  const padding = 48;
  const usableH = height - padding * 2 - 30;
  const rowH = usableH / TABLE_SIZE;
  const bucketLabelW = 52;
  const cellW = Math.min(72, (width - padding * 2 - bucketLabelW) / MAX_CHAIN - 16);
  const cellH = Math.min(rowH * 0.7, 40);
  const startX = padding + bucketLabelW;
  const startY = padding;

  for (let b = 0; b < TABLE_SIZE; b++) {
    const y = startY + b * rowH + rowH / 2;

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`[${b}]`, padding + bucketLabelW - 8, y);

    for (let c = 0; c < MAX_CHAIN; c++) {
      const flatIdx = b * MAX_CHAIN + c;
      const isComparing = state.comparingIndices.includes(flatIdx);
      const isSwapping = state.swappingIndices.includes(flatIdx);
      const isSorted = state.sortedIndices.has(flatIdx);

      const color = isComparing
        ? COLORS.comparing
        : isSwapping
        ? COLORS.swapping
        : isSorted
        ? COLORS.sorted
        : '#2a2a3a';

      const glow = isComparing || isSwapping;
      const x = startX + c * (cellW + 20);

      if (c > 0) {
        ctx.strokeStyle = '#3a3a52';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x - 4, y);
        ctx.stroke();
      }

      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = isSorted || isComparing || isSwapping ? color + '99' : '#1e1e2e';
      ctx.fillRect(x, y - cellH / 2, cellW, cellH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y - cellH / 2, cellW, cellH);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${b},${c}`, x + cellW / 2, y);
    }
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
  if (state.isPlaying) statusText = 'hashing…';
  if (state.isDone) statusText = 'complete ✓';

  ctx.fillText(`hash-table  |  ${statusText}`, 16, 24);
}
