import { COLORS, type AnimationState, type SceneState, type TreeScene } from '../animation-engine';

/**
 * Tree renderer — draws a binary tree with parent-child lines.
 *
 * When no scene is available (algorithms that pre-date the scene system),
 * it falls back to a visual representation derived from the step indices
 * mapped onto a conceptual flat-heap layout.
 */
export function drawTree(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, width, height);

  if (scene && scene.type === 'tree') {
    drawTreeScene(ctx, width, height, scene as TreeScene, state);
  } else {
    drawTreeFallback(ctx, width, height, state);
  }
}

function drawTreeScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: TreeScene,
  state: AnimationState
): void {
  const { nodes, edges, activePathIds } = scene;
  const activeSet = new Set(activePathIds);

  // ── Draw edges ─────────────────────────────────────────────────────────
  for (const edge of edges) {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) continue;

    const isActive = activeSet.has(edge.from) && activeSet.has(edge.to);
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.strokeStyle = isActive ? COLORS.comparing : '#3a3a52';
    ctx.lineWidth = isActive ? 2 : 1.5;
    ctx.stroke();
  }

  // ── Draw nodes ─────────────────────────────────────────────────────────
  const NODE_RADIUS = 22;

  for (const node of nodes) {
    const isComparing = state.comparingIndices.includes(node.id);
    const isSwapping = state.swappingIndices.includes(node.id);
    const isSorted = state.sortedIndices.has(node.id);
    const isActive = activeSet.has(node.id);

    let color: string;
    if (isComparing) color = COLORS.comparing;
    else if (isSwapping) color = COLORS.swapping;
    else if (isSorted || isActive) color = COLORS.sorted;
    else color = '#3a3a52';

    const glow = isComparing || isSwapping || isActive;
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
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
    ctx.fillText(node.value, node.x, node.y);
  }

  drawStatusLine(ctx, width, state);
}

/**
 * Fallback: render a conceptual tree using the flat-heap layout.
 * Nodes are positioned by their implied tree level (index-based).
 * The max visible nodes is capped at 15 (4 levels).
 */
function drawTreeFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
  const n = Math.min(state.array.length, 15);
  if (n === 0) {
    drawStatusLine(ctx, width, state);
    return;
  }

  const padding = 40;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2 - 30;

  // Compute tree levels
  const levels = Math.floor(Math.log2(n)) + 1;
  const levelH = usableH / levels;

  const NODE_RADIUS = Math.min(22, levelH * 0.3);

  // Compute node x-positions using a simple BFS layout
  interface NodePos { x: number; y: number }
  const positions: NodePos[] = [];

  for (let i = 0; i < n; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, level) - 1);
    const countAtLevel = Math.pow(2, level);
    const slotW = usableW / countAtLevel;
    const x = padding + slotW * posInLevel + slotW / 2;
    const y = padding + level * levelH + levelH / 2;
    positions.push({ x, y });
  }

  // Draw edges (parent = floor((i-1)/2))
  for (let i = 1; i < n; i++) {
    const parent = Math.floor((i - 1) / 2);
    const childPos = positions[i];
    const parentPos = positions[parent];

    const isActive =
      (state.comparingIndices.includes(i) && state.comparingIndices.includes(parent)) ||
      (state.swappingIndices.includes(i) && state.swappingIndices.includes(parent));

    ctx.beginPath();
    ctx.moveTo(parentPos.x, parentPos.y);
    ctx.lineTo(childPos.x, childPos.y);
    ctx.strokeStyle = isActive ? COLORS.comparing : '#3a3a52';
    ctx.lineWidth = isActive ? 2 : 1.5;
    ctx.stroke();
  }

  // Draw nodes
  for (let i = 0; i < n; i++) {
    const { x, y } = positions[i];
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
      ctx.shadowBlur = 16;
    }

    ctx.beginPath();
    ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color + '99';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const label = Math.round(state.array[i] * 100).toString();
    ctx.fillStyle = COLORS.text;
    ctx.font = `bold ${Math.min(12, NODE_RADIUS * 0.6)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
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
  if (state.isPlaying) statusText = 'traversing…';
  if (state.isDone) statusText = 'complete ✓';

  ctx.fillText(`tree  |  ${statusText}`, 16, 24);
}
