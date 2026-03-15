import { COLORS, type AnimationState, type SceneState, type RecursionTreeScene } from '../animation-engine';

/**
 * Recursion tree renderer — draws the Fibonacci recursion tree with
 * memoization highlights.
 *
 * Node states map to colors:
 *   'default'    → muted gray (#3a3a52)
 *   'computing'  → purple (#c4a7e7) with glow
 *   'computed'   → green (#a6da95)
 *   'cached'     → gold (#f6c177) with glow — cache hit (key DP insight)
 *   'current'    → bright purple with stronger glow
 */

const STATE_COLORS: Record<string, { fill: string; glow: string | null }> = {
  default:   { fill: '#3a3a52', glow: null },
  computing: { fill: COLORS.comparing, glow: COLORS.comparing },
  computed:  { fill: COLORS.sorted,    glow: null },
  cached:    { fill: COLORS.swapping,  glow: COLORS.swapping },
  current:   { fill: '#d4b9f9',        glow: '#d4b9f9' },
};

export function drawRecursionTree(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, width, height);

  if (!scene || scene.type !== 'recursion-tree') {
    drawPlaceholder(ctx, width, height, state);
    return;
  }

  const rtScene = scene as RecursionTreeScene;
  const { nodes, edges, memo } = rtScene;

  if (nodes.length === 0) {
    drawPlaceholder(ctx, width, height, state);
    return;
  }

  // Reserve bottom area for memo table
  const memoKeys = Object.keys(memo).map(Number).sort((a, b) => a - b);
  const hasMemo = memoKeys.length > 0;
  const memoAreaHeight = hasMemo ? 60 : 0;
  const treeHeight = height - memoAreaHeight;

  // Node sizing — scale with canvas and node count
  const NODE_RADIUS = Math.min(22, Math.max(14, Math.min(width, treeHeight) / (nodes.length * 0.8)));

  // ── Scale normalized 0-1 positions to canvas pixels ──────────────────
  const padX = NODE_RADIUS + 16;
  const padY = NODE_RADIUS + 28;
  function toPixel(node: { x: number; y: number }): { px: number; py: number } {
    return {
      px: padX + node.x * (width - 2 * padX),
      py: padY + node.y * (treeHeight - 2 * padY),
    };
  }

  // ── Draw edges ─────────────────────────────────────────────────────────
  for (const edge of edges) {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode   = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) continue;

    // Only draw edge if the child node is visible (not default state means it has appeared)
    if (toNode.state === 'default' && !toNode.result) continue;

    const { px: fx, py: fy } = toPixel(fromNode);
    const { px: tx, py: ty } = toPixel(toNode);

    const childColors = STATE_COLORS[toNode.state] ?? STATE_COLORS.default;
    const edgeColor = childColors.glow ? childColors.fill + 'aa' : '#3a3a52';

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── Draw nodes ─────────────────────────────────────────────────────────
  for (const node of nodes) {
    // Skip nodes that haven't appeared yet
    if (node.state === 'default' && !node.result) continue;

    const { px, py } = toPixel(node);
    const colors = STATE_COLORS[node.state] ?? STATE_COLORS.default;

    // Glow effect
    if (colors.glow) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = node.state === 'current' ? 24 : 18;
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(px, py, NODE_RADIUS, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      px - NODE_RADIUS * 0.3, py - NODE_RADIUS * 0.3, NODE_RADIUS * 0.1,
      px, py, NODE_RADIUS
    );
    grad.addColorStop(0, colors.fill + 'ee');
    grad.addColorStop(1, colors.fill + '99');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = colors.fill;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // "memo" badge for cached nodes
    if (node.state === 'cached') {
      const badgeX = px + NODE_RADIUS * 0.6;
      const badgeY = py - NODE_RADIUS * 0.8;
      ctx.fillStyle = COLORS.swapping;
      ctx.font = `bold ${Math.max(8, NODE_RADIUS * 0.4)}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Small pill badge
      const bw = 22;
      const bh = 12;
      ctx.beginPath();
      const bx = badgeX - bw / 2, by = badgeY - bh / 2, br = 4;
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.fillStyle = COLORS.swapping + '33';
      ctx.fill();
      ctx.strokeStyle = COLORS.swapping;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = COLORS.swapping;
      ctx.fillText('memo', badgeX, badgeY);
    }

    // Node label (e.g. "f(5)")
    ctx.fillStyle = node.state === 'default' ? COLORS.default : COLORS.text;
    ctx.font = `bold ${Math.min(12, NODE_RADIUS * 0.65)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, px, py);

    // Result value below node
    if (node.result) {
      ctx.fillStyle = node.state === 'cached' ? COLORS.swapping : COLORS.sorted;
      ctx.font = `${Math.min(10, NODE_RADIUS * 0.5)}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`= ${node.result}`, px, py + NODE_RADIUS + 3);
    }
  }

  // ── Memo table at the bottom ──────────────────────────────────────────
  if (hasMemo) {
    const tableY = treeHeight + 8;
    const cellW = Math.min(50, (width - 100) / (memoKeys.length + 1));
    const cellH = 24;
    const startX = (width - cellW * memoKeys.length) / 2;

    // "Memo table" label
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('memo table', startX, tableY);

    const rowY = tableY + 16;

    for (let i = 0; i < memoKeys.length; i++) {
      const k = memoKeys[i];
      const x = startX + i * cellW;

      // Key cell (top)
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(x, rowY, cellW - 2, cellH);
      ctx.strokeStyle = '#3a3a52';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, rowY, cellW - 2, cellH);

      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`f(${k})`, x + (cellW - 2) / 2, rowY + 2);

      // Value
      ctx.fillStyle = COLORS.sorted;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(memo[k]), x + (cellW - 2) / 2, rowY + cellH - 2);
    }
  }

  // ── Status line ────────────────────────────────────────────────────────
  drawStatusLine(ctx, width, state);
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
  // Draw a simple placeholder tree
  const cx = width / 2;
  const levels = [
    [{ x: cx, y: 60, label: 'f(5)' }],
    [{ x: cx - 100, y: 140, label: 'f(4)' }, { x: cx + 100, y: 140, label: 'f(3)' }],
    [{ x: cx - 150, y: 220, label: 'f(3)' }, { x: cx - 50, y: 220, label: 'f(2)' },
     { x: cx + 50, y: 220, label: 'f(2)' }, { x: cx + 150, y: 220, label: 'f(1)' }],
  ];

  const nodeR = 20;
  const allNodes = levels.flat();

  // Edges
  const edgePairs = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
  for (const [a, b] of edgePairs) {
    if (a < allNodes.length && b < allNodes.length) {
      ctx.beginPath();
      ctx.moveTo(allNodes[a].x, allNodes[a].y);
      ctx.lineTo(allNodes[b].x, allNodes[b].y);
      ctx.strokeStyle = '#3a3a52';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Nodes
  for (const node of allNodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeR, 0, Math.PI * 2);
    ctx.fillStyle = '#3a3a52' + '99';
    ctx.fill();
    ctx.strokeStyle = '#3a3a52';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = COLORS.default;
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y);
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
  if (state.isPlaying) statusText = 'computing...';
  if (state.isDone) statusText = 'complete';

  ctx.fillText(`recursion tree  |  ${statusText}`, 16, 24);
}
