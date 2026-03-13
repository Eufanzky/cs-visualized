import { COLORS, type AnimationState, type SceneState, type NeuronScene } from '../animation-engine';

/**
 * Neuron renderer — draws a perceptron / single-neuron diagram.
 *
 * Layout:
 *   Left column:   input nodes (x1, x2, ... plus bias)
 *   Center:        summation node (Σ), weighted connections
 *   Right:         activation output node
 *   Bottom half:   scatter plot with training points and decision boundary
 *
 * When no scene is available, falls back to a visual representation
 * driven by step indices (0-3 for the 4 AND-gate training examples).
 */
export function drawNeuron(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
): void {
  ctx.clearRect(0, 0, width, height);

  if (scene && scene.type === 'neuron') {
    drawNeuronScene(ctx, width, height, scene as NeuronScene, state);
  } else {
    drawNeuronFallback(ctx, width, height, state);
  }
}

const NODE_R = 24;

function drawNeuronScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: NeuronScene,
  state: AnimationState
): void {
  const {
    inputs,
    weights,
    bias,
    weightedSum,
    output,
    currentExample,
    decisionBoundary,
    trainingPoints,
  } = scene;

  const splitY = trainingPoints ? height * 0.5 : height;
  const diagramH = splitY;

  // ── Neuron diagram (top half) ──────────────────────────────────────────
  const inputCount = inputs.length;
  const inputX = width * 0.18;
  const sumX = width * 0.52;
  const outputX = width * 0.82;

  const inputSpacing = diagramH / (inputCount + 2);
  const inputNodes = inputs.map((val, i) => ({
    x: inputX,
    y: inputSpacing * (i + 1.5),
    label: `x${i + 1}`,
    value: val,
  }));

  // Bias node at bottom
  const biasNode = {
    x: inputX,
    y: inputSpacing * (inputCount + 1),
    label: 'bias',
    value: bias,
  };

  const sumNode = { x: sumX, y: diagramH * 0.5 };
  const outputNode = { x: outputX, y: diagramH * 0.5 };

  // Draw weighted connections from inputs to sum node
  for (let i = 0; i < inputNodes.length; i++) {
    const inp = inputNodes[i];
    const w = weights[i] ?? 0;
    const isActive = state.comparingIndices.includes(0) || state.swappingIndices.includes(0);
    const lineColor = isActive ? COLORS.comparing : '#3a3a52';
    const lineW = Math.abs(w) * 2 + 0.5;

    ctx.beginPath();
    ctx.moveTo(inp.x + NODE_R, inp.y);
    ctx.lineTo(sumNode.x - NODE_R, sumNode.y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineW;
    ctx.stroke();

    // Weight label near midpoint
    const mx = (inp.x + NODE_R + sumNode.x - NODE_R) / 2;
    const my = (inp.y + sumNode.y) / 2;
    ctx.fillStyle = isActive ? COLORS.comparing : COLORS.textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`w=${w.toFixed(2)}`, mx, my - 2);
  }

  // Bias connection
  {
    const isActive = state.comparingIndices.includes(0) || state.swappingIndices.includes(0);
    ctx.beginPath();
    ctx.moveTo(biasNode.x + NODE_R, biasNode.y);
    ctx.lineTo(sumNode.x - NODE_R, sumNode.y);
    ctx.strokeStyle = isActive ? COLORS.comparing : '#2a2a42';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Sum → output connection
  {
    ctx.beginPath();
    ctx.moveTo(sumNode.x + NODE_R, sumNode.y);
    ctx.lineTo(outputNode.x - NODE_R, outputNode.y);
    ctx.strokeStyle = output === 1 ? COLORS.sorted : '#3a3a52';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw input nodes
  for (const inp of inputNodes) {
    drawCircleNode(ctx, inp.x, inp.y, NODE_R, inp.label, String(inp.value), '#3a3a52', false);
  }

  // Bias node
  drawCircleNode(ctx, biasNode.x, biasNode.y, NODE_R * 0.8, 'b', bias.toFixed(2), '#2a2a42', false);

  // Sum node (Σ)
  const isMisprediction = state.swappingIndices.length > 0;
  const sumColor = isMisprediction ? COLORS.swapping : COLORS.comparing;
  drawCircleNode(ctx, sumNode.x, sumNode.y, NODE_R * 1.15, 'Σ', weightedSum.toFixed(2), sumColor, true);

  // Output node
  const outColor = output === 1 ? COLORS.sorted : '#908caa';
  drawCircleNode(ctx, outputNode.x, outputNode.y, NODE_R, 'out', String(output), outColor, output === 1);

  // ── Scatter plot (bottom half) ─────────────────────────────────────────
  if (trainingPoints && trainingPoints.length > 0) {
    const plotPad = 32;
    const plotX = plotPad;
    const plotY = splitY + plotPad;
    const plotW = width - plotPad * 2;
    const plotH = height - splitY - plotPad * 2 - 24;

    // Axes
    ctx.strokeStyle = '#3a3a52';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('x1', plotX + plotW / 2, plotY + plotH + 16);
    ctx.save();
    ctx.translate(plotX - 18, plotY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('x2', 0, 0);
    ctx.restore();

    // Decision boundary line
    if (decisionBoundary) {
      const { w1, w2, bias: db } = decisionBoundary;
      // w1*x + w2*y + bias = 0 → y = -(w1*x + bias) / w2
      if (Math.abs(w2) > 1e-6) {
        const x0 = 0, x1 = 1.2;
        const y0 = -(w1 * x0 + db) / w2;
        const y1 = -(w1 * x1 + db) / w2;
        // Map [0,1.2] → plot coords
        const px0 = plotX + (x0 / 1.2) * plotW;
        const py0 = plotY + plotH - (Math.max(0, Math.min(1.2, y0)) / 1.2) * plotH;
        const px1 = plotX + (x1 / 1.2) * plotW;
        const py1 = plotY + plotH - (Math.max(0, Math.min(1.2, y1)) / 1.2) * plotH;

        ctx.beginPath();
        ctx.moveTo(px0, py0);
        ctx.lineTo(px1, py1);
        ctx.strokeStyle = COLORS.swapping + 'bb';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Training points
    for (let i = 0; i < trainingPoints.length; i++) {
      const pt = trainingPoints[i];
      const px = plotX + (pt.x / 1.2) * plotW;
      const py = plotY + plotH - (pt.y / 1.2) * plotH;
      const isCurrentExample = currentExample === i;
      const ptColor = pt.label === 1 ? COLORS.sorted : '#908caa';

      if (isCurrentExample) {
        ctx.shadowColor = ptColor;
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      ctx.arc(px, py, isCurrentExample ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = ptColor + (isCurrentExample ? 'ee' : '99');
      ctx.fill();
      ctx.strokeStyle = ptColor;
      ctx.lineWidth = isCurrentExample ? 2 : 1;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`(${pt.x},${pt.y})=${pt.label}`, px, py - 10);
    }
  }

  drawStatusLine(ctx, width, state);
}

/**
 * Fallback: draw the static 4-example AND-gate layout,
 * highlighting the current training example from step indices.
 */
function drawNeuronFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
  // 4 training examples for AND gate
  const examples = [
    { x1: 0, x2: 0, label: 0 },
    { x1: 0, x2: 1, label: 0 },
    { x1: 1, x2: 0, label: 0 },
    { x1: 1, x2: 1, label: 1 },
  ];

  const currentIdx =
    state.comparingIndices[0] ??
    state.swappingIndices[0] ??
    -1;

  // ── Neuron diagram ────────────────────────────────────────────────────
  const diagramH = height * 0.52;
  const inputX = width * 0.18;
  const sumX = width * 0.52;
  const outputX = width * 0.82;

  const nodes = [
    { x: inputX, y: diagramH * 0.25, label: 'x1' },
    { x: inputX, y: diagramH * 0.5, label: 'x2' },
    { x: inputX, y: diagramH * 0.75, label: 'bias' },
  ];

  const sumNode = { x: sumX, y: diagramH * 0.5 };
  const outNode = { x: outputX, y: diagramH * 0.5 };
  const isMisprediction = state.swappingIndices.length > 0;

  for (const node of nodes) {
    ctx.beginPath();
    ctx.moveTo(node.x + NODE_R, node.y);
    ctx.lineTo(sumNode.x - NODE_R, sumNode.y);
    ctx.strokeStyle = isMisprediction ? COLORS.swapping : '#3a3a52';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(sumNode.x + NODE_R, sumNode.y);
  ctx.lineTo(outNode.x - NODE_R, outNode.y);
  ctx.strokeStyle = '#3a3a52';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const node of nodes) {
    const color = isMisprediction && node.label !== 'bias' ? COLORS.swapping : '#3a3a52';
    drawCircleNode(ctx, node.x, node.y, NODE_R, node.label, '', color, false);
  }

  const sumColor = isMisprediction ? COLORS.swapping : COLORS.comparing;
  drawCircleNode(ctx, sumNode.x, sumNode.y, NODE_R * 1.1, 'Σ', '', sumColor, true);
  drawCircleNode(ctx, outNode.x, outNode.y, NODE_R, 'out', '', '#908caa', false);

  // ── Training scatter plot ─────────────────────────────────────────────
  const plotPad = 40;
  const plotX = plotPad;
  const plotY = height * 0.55;
  const plotW = width - plotPad * 2;
  const plotH = height - plotY - plotPad - 24;

  ctx.strokeStyle = '#3a3a52';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('x1', plotX + plotW / 2, plotY + plotH + 16);

  for (let i = 0; i < examples.length; i++) {
    const ex = examples[i];
    const px = plotX + 24 + ex.x1 * (plotW - 48);
    const py = plotY + plotH - 20 - ex.x2 * (plotH - 40);
    const isActive = currentIdx === i;
    const ptColor = ex.label === 1 ? COLORS.sorted : '#908caa';

    if (isActive) {
      ctx.shadowColor = ptColor;
      ctx.shadowBlur = 14;
    }

    ctx.beginPath();
    ctx.arc(px, py, isActive ? 10 : 7, 0, Math.PI * 2);
    ctx.fillStyle = ptColor + (isActive ? 'ee' : '77');
    ctx.fill();
    ctx.strokeStyle = ptColor;
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`(${ex.x1},${ex.x2})=${ex.label}`, px, py - 12);
  }

  drawStatusLine(ctx, width, state);
}

function drawCircleNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  label: string,
  value: string,
  color: string,
  glow: boolean
): void {
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, color + 'dd');
  grad.addColorStop(1, color + '77');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.text;
  ctx.font = `bold ${Math.min(12, r * 0.55)}px JetBrains Mono, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = value ? 'alphabetic' : 'middle';
  ctx.fillText(label, x, value ? y - 1 : y + 1);

  if (value) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `${Math.min(10, r * 0.44)}px JetBrains Mono, monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(value, x, y + 2);
  }
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
  if (state.isPlaying) statusText = 'training…';
  if (state.isDone) statusText = 'converged ✓';

  ctx.fillText(`neuron  |  ${statusText}`, 16, 24);
}
