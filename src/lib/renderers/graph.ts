import { COLORS, type AnimationState, type SceneState, type GraphScene } from '../animation-engine';

/**
 * Graph renderer — draws nodes as circles with labeled edges.
 *
 * Node states map to colors:
 *   'current'   → comparing (purple)
 *   'queued'    → swapping (gold)
 *   'visited'   → sorted (green)
 *   'finalized' → sorted (green, brighter glow)
 *   default     → muted
 *
 * Edge weights are drawn at midpoints when present.
 */
export function drawGraph(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, width, height);

  if (!scene || scene.type !== 'graph') {
    drawGraphPlaceholder(ctx, width, height, state);
    return;
  }

  const graphScene = scene as GraphScene;
  const { nodes, edges, nodeStates, distanceLabels, queueOrStack } = graphScene;

  if (nodes.length === 0) {
    drawGraphPlaceholder(ctx, width, height, state);
    return;
  }

  const NODE_RADIUS = Math.min(26, Math.max(18, Math.min(width, height) / (nodes.length * 1.5)));

  // ── Scale normalized 0-1 node positions to canvas pixel coordinates ────
  // Nodes store x/y as fractions (0–1). We map them onto a padded canvas
  // region so no node circle clips against the edge.
  const pad = NODE_RADIUS + 20;
  function toPixel(node: { x: number; y: number }): { px: number; py: number } {
    return {
      px: pad + node.x * (width  - 2 * pad),
      py: pad + node.y * (height - 2 * pad),
    };
  }

  // ── Draw edges ─────────────────────────────────────────────────────────
  for (const edge of edges) {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode   = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) continue;

    const { px: fx, py: fy } = toPixel(fromNode);
    const { px: tx, py: ty } = toPixel(toNode);
    const isHighlighted = edge.highlighted === true;

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = isHighlighted ? COLORS.swapping : '#3a3a52';
    ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
    ctx.stroke();

    // Draw weight label at midpoint
    if (edge.weight !== undefined) {
      const mx = (fx + tx) / 2;
      const my = (fy + ty) / 2;
      ctx.fillStyle = isHighlighted ? COLORS.swapping : COLORS.textMuted;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(edge.weight), mx, my - 8);
    }
  }

  // ── Draw nodes ─────────────────────────────────────────────────────────
  for (const node of nodes) {
    const { px, py } = toPixel(node);
    const nodeState = nodeStates[node.id] ?? 'default';

    let fillColor: string;
    let glowColor: string | null = null;

    switch (nodeState) {
      case 'visiting':
      case 'current':
        fillColor = COLORS.comparing;
        glowColor = COLORS.comparing;
        break;
      case 'queued':
        fillColor = COLORS.swapping;
        glowColor = COLORS.swapping;
        break;
      case 'visited':
        fillColor = COLORS.sorted;
        glowColor = null;
        break;
      case 'finalized':
        fillColor = COLORS.sorted;
        glowColor = COLORS.sorted;
        break;
      default:
        fillColor = '#3a3a52';
        glowColor = null;
    }

    if (glowColor) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(px, py, NODE_RADIUS, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      px - NODE_RADIUS * 0.3, py - NODE_RADIUS * 0.3, NODE_RADIUS * 0.1,
      px, py, NODE_RADIUS
    );
    grad.addColorStop(0, fillColor + 'ee');
    grad.addColorStop(1, fillColor + '99');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Node label
    ctx.fillStyle = nodeState === 'default' ? COLORS.default : COLORS.text;
    ctx.font = `bold ${Math.min(14, NODE_RADIUS * 0.7)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, px, py);

    // Distance label (for Dijkstra)
    if (distanceLabels && distanceLabels[node.id] !== undefined) {
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(distanceLabels[node.id], px, py + NODE_RADIUS + 4);
    }
  }

  // ── Queue/stack display ────────────────────────────────────────────────
  if (queueOrStack && queueOrStack.length > 0) {
    const labelMap: Record<number, string> = {};
    nodes.forEach(n => { labelMap[n.id] = n.label; });
    const qsLabel = queueOrStack.map(id => labelMap[id] ?? String(id)).join(' → ');

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`[ ${qsLabel} ]`, 16, height - 14);
  }

  // ── Status line ────────────────────────────────────────────────────────
  drawStatusLine(ctx, width, state);
}

function drawGraphPlaceholder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
  // Draw a default 8-node circular layout as a visual placeholder
  const n = 8;
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.32;
  const nodeR = 22;
  const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,7],[4,7],[6,7]];

  const nodePositions = labels.map((_, i) => ({
    x: cx + r * Math.cos((i / n) * 2 * Math.PI - Math.PI / 2),
    y: cy + r * Math.sin((i / n) * 2 * Math.PI - Math.PI / 2),
  }));

  // Edges
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(nodePositions[a].x, nodePositions[a].y);
    ctx.lineTo(nodePositions[b].x, nodePositions[b].y);
    ctx.strokeStyle = '#3a3a52';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Nodes
  for (let i = 0; i < n; i++) {
    const { x, y } = nodePositions[i];
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
    ctx.arc(x, y, nodeR, 0, Math.PI * 2);
    ctx.fillStyle = color + '99';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], x, y);
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

  ctx.fillText(`graph  |  ${statusText}`, 16, 24);
}
