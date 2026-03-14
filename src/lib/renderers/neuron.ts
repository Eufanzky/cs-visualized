import { COLORS, type AnimationState, type SceneState, type NeuronScene } from '../animation-engine';

/**
 * Neuron renderer — draws different visualizations based on scene.variant:
 *
 *   'perceptron' (default): Single neuron diagram (inputs -> sum -> output) + scatter plot
 *   'multilayer':           Multi-layer network with forward/backward phase indicators
 *   'convolution':          Input grid, sliding kernel, feature map, pooling output
 *   'gradient-descent':     2D loss contour plot with descent path
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
    const ns = scene as NeuronScene;
    switch (ns.variant) {
      case 'multilayer':
        drawMultilayerScene(ctx, width, height, ns, state);
        break;
      case 'convolution':
        drawConvolutionScene(ctx, width, height, ns, state);
        break;
      case 'gradient-descent':
        drawGradientDescentScene(ctx, width, height, ns, state);
        break;
      default:
        drawPerceptronScene(ctx, width, height, ns, state);
        break;
    }
  } else {
    drawNeuronFallback(ctx, width, height, state);
  }
}

// ── Shared constants & helpers ──────────────────────────────────────────────

const NODE_R = 24;

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
  state: AnimationState,
  label: string = 'neuron'
): void {
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  let statusText = 'ready';
  if (state.isPlaying) statusText = 'training\u2026';
  if (state.isDone) statusText = 'complete \u2713';

  ctx.fillText(`${label}  |  ${statusText}`, 16, 24);
}

/** Interpolate between two hex colors. t in [0, 1]. */
function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PERCEPTRON (default) — single neuron + scatter plot
// ═══════════════════════════════════════════════════════════════════════════

function drawPerceptronScene(
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

  // -- Neuron diagram (top half) --
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

  const biasNode = {
    x: inputX,
    y: inputSpacing * (inputCount + 1),
    label: 'bias',
    value: bias,
  };

  const sumNode = { x: sumX, y: diagramH * 0.5 };
  const outputNode = { x: outputX, y: diagramH * 0.5 };

  // Weighted connections
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

  // Sum -> output connection
  {
    ctx.beginPath();
    ctx.moveTo(sumNode.x + NODE_R, sumNode.y);
    ctx.lineTo(outputNode.x - NODE_R, outputNode.y);
    ctx.strokeStyle = output === 1 ? COLORS.sorted : '#3a3a52';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw nodes
  for (const inp of inputNodes) {
    drawCircleNode(ctx, inp.x, inp.y, NODE_R, inp.label, String(inp.value), '#3a3a52', false);
  }
  drawCircleNode(ctx, biasNode.x, biasNode.y, NODE_R * 0.8, 'b', bias.toFixed(2), '#2a2a42', false);

  const isMisprediction = state.swappingIndices.length > 0;
  const sumColor = isMisprediction ? COLORS.swapping : COLORS.comparing;
  drawCircleNode(ctx, sumNode.x, sumNode.y, NODE_R * 1.15, '\u03A3', weightedSum.toFixed(2), sumColor, true);

  const outColor = output === 1 ? COLORS.sorted : '#908caa';
  drawCircleNode(ctx, outputNode.x, outputNode.y, NODE_R, 'out', String(output), outColor, output === 1);

  // -- Scatter plot (bottom half) --
  if (trainingPoints && trainingPoints.length > 0) {
    drawScatterPlot(ctx, width, height, splitY, trainingPoints, decisionBoundary, currentExample);
  }

  drawStatusLine(ctx, width, state, 'perceptron');
}

function drawScatterPlot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  splitY: number,
  trainingPoints: Array<{ x: number; y: number; label: number }>,
  decisionBoundary?: { w1: number; w2: number; bias: number },
  currentExample?: number
): void {
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

  // Decision boundary
  if (decisionBoundary) {
    const { w1, w2, bias: db } = decisionBoundary;
    if (Math.abs(w2) > 1e-6) {
      const x0 = 0, x1 = 1.2;
      const y0 = -(w1 * x0 + db) / w2;
      const y1 = -(w1 * x1 + db) / w2;
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

  // Points
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


// ═══════════════════════════════════════════════════════════════════════════
// 2. MULTILAYER — multi-layer network for backpropagation
// ═══════════════════════════════════════════════════════════════════════════

function drawMultilayerScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: NeuronScene,
  state: AnimationState
): void {
  const { layers, layerEdges, networkPhase, loss } = scene;
  if (!layers || layers.length === 0) {
    drawPerceptronScene(ctx, width, height, scene, state);
    return;
  }

  const pad = 48;
  const diagramTop = 40;
  const diagramH = height - pad - diagramTop - 40; // leave room for status + loss bar
  const diagramW = width - pad * 2;
  const numLayers = layers.length;

  // Phase-based colors
  const phaseColor =
    networkPhase === 'forward' ? COLORS.comparing :
    networkPhase === 'backward' ? COLORS.swapping :
    networkPhase === 'update' ? COLORS.sorted :
    '#3a3a52';

  // Compute node positions
  const layerX: number[] = [];
  const nodePositions: Array<Array<{ x: number; y: number }>> = [];

  for (let l = 0; l < numLayers; l++) {
    const x = pad + (l / (numLayers - 1)) * diagramW;
    layerX.push(x);
    const nodes = layers[l].nodes;
    const count = nodes.length;
    const spacing = Math.min(diagramH / (count + 1), 60);
    const totalH = spacing * (count - 1);
    const startY = diagramTop + (diagramH - totalH) / 2;

    const positions: Array<{ x: number; y: number }> = [];
    for (let n = 0; n < count; n++) {
      positions.push({ x, y: startY + n * spacing });
    }
    nodePositions.push(positions);
  }

  // Draw edges
  if (layerEdges) {
    for (const edge of layerEdges) {
      const [fromLayer, fromNode] = edge.from;
      const [toLayer, toNode] = edge.to;
      const fromPos = nodePositions[fromLayer]?.[fromNode];
      const toPos = nodePositions[toLayer]?.[toNode];
      if (!fromPos || !toPos) continue;

      const w = Math.abs(edge.weight);
      const lineW = Math.min(3, w * 1.5 + 0.3);
      const isHighlighted = edge.highlighted;

      let edgeColor: string;
      if (isHighlighted) {
        edgeColor = phaseColor;
      } else {
        edgeColor = '#2a2a42';
      }

      // For backward pass, draw dashed edges to indicate gradient flow
      if (networkPhase === 'backward' && isHighlighted) {
        ctx.setLineDash([4, 3]);
      }

      ctx.beginPath();
      ctx.moveTo(fromPos.x + NODE_R * 0.8, fromPos.y);
      ctx.lineTo(toPos.x - NODE_R * 0.8, toPos.y);
      ctx.strokeStyle = edgeColor + (isHighlighted ? 'cc' : '66');
      ctx.lineWidth = lineW;
      ctx.stroke();
      ctx.setLineDash([]);

      // Weight label on highlighted edges
      if (isHighlighted && w > 0.05) {
        const mx = (fromPos.x + toPos.x) / 2;
        const my = (fromPos.y + toPos.y) / 2 - 6;
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(edge.weight.toFixed(2), mx, my);
      }
    }
  }

  // Draw flow direction arrow
  if (networkPhase === 'forward' || networkPhase === 'backward') {
    const arrowY = diagramTop - 14;
    const arrowStartX = pad + 20;
    const arrowEndX = width - pad - 20;
    const isForward = networkPhase === 'forward';

    ctx.strokeStyle = phaseColor + '88';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    if (isForward) {
      ctx.moveTo(arrowStartX, arrowY);
      ctx.lineTo(arrowEndX, arrowY);
      // arrowhead
      ctx.moveTo(arrowEndX - 8, arrowY - 5);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.lineTo(arrowEndX - 8, arrowY + 5);
    } else {
      ctx.moveTo(arrowEndX, arrowY);
      ctx.lineTo(arrowStartX, arrowY);
      ctx.moveTo(arrowStartX + 8, arrowY - 5);
      ctx.lineTo(arrowStartX, arrowY);
      ctx.lineTo(arrowStartX + 8, arrowY + 5);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = phaseColor + 'cc';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isForward ? 'forward pass' : 'backward pass', width / 2, arrowY - 4);
  }

  // Draw nodes
  for (let l = 0; l < numLayers; l++) {
    const layer = layers[l];
    const labels = layer.labels ?? [];
    for (let n = 0; n < layer.nodes.length; n++) {
      const pos = nodePositions[l][n];
      const activation = layer.nodes[n];
      const label = labels[n] ?? `${n}`;

      // Color: intensity based on activation, tinted by phase
      let nodeColor: string;
      if (l === 0) {
        nodeColor = '#3a3a52';
      } else if (l === numLayers - 1) {
        nodeColor = activation > 0.5 ? COLORS.sorted : '#908caa';
      } else {
        // Hidden layer: blend from muted to phase color based on activation
        const t = Math.min(1, Math.max(0, activation));
        nodeColor = lerpColor('#3a3a52', phaseColor, t * 0.7 + 0.3);
      }

      const glowing = l > 0 && (
        (networkPhase === 'forward' && l === numLayers - 1) ||
        (networkPhase === 'backward' && l > 0 && l < numLayers - 1)
      );

      const r = l === 0 || l === numLayers - 1 ? NODE_R * 0.85 : NODE_R;
      drawCircleNode(ctx, pos.x, pos.y, r, label, activation.toFixed(2), nodeColor, glowing);
    }

    // Layer label at bottom
    const layerLabel = l === 0 ? 'input' : l === numLayers - 1 ? 'output' : `hidden ${l}`;
    const bottomY = diagramTop + diagramH + 20;
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(layerLabel, layerX[l], bottomY);
  }

  // Loss indicator bar at bottom
  if (loss !== undefined) {
    const barY = height - 28;
    const barW = width - pad * 2;
    const barH = 6;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(pad, barY, barW, barH, 3);
    ctx.fill();

    // Loss fill (clamp to 0-1 range for display)
    const fillT = Math.min(1, Math.max(0, loss * 4)); // scale loss for visibility
    const fillW = Math.max(2, fillT * barW);
    const lossColor = lerpColor(COLORS.sorted, COLORS.swapping, fillT);
    ctx.fillStyle = lossColor + 'cc';
    ctx.beginPath();
    ctx.roundRect(pad, barY, fillW, barH, 3);
    ctx.fill();

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`loss: ${loss.toFixed(4)}`, pad, barY - 4);
  }

  drawStatusLine(ctx, width, state, 'backprop');
}


// ═══════════════════════════════════════════════════════════════════════════
// 3. CONVOLUTION — CNN forward pass visualization
// ═══════════════════════════════════════════════════════════════════════════

function drawConvolutionScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: NeuronScene,
  state: AnimationState
): void {
  const { inputGrid, kernel, featureMap, kernelPosition, poolingResult, cnnPhase } = scene;

  if (!inputGrid || !kernel) {
    drawPerceptronScene(ctx, width, height, scene, state);
    return;
  }

  const pad = 24;
  const topY = 44;
  const availW = width - pad * 2;
  const availH = height - topY - pad - 14;

  const inputRows = inputGrid.length;
  const inputCols = inputGrid[0]?.length ?? 0;
  const kernelSize = kernel.length;
  const fmRows = featureMap?.length ?? 0;
  const fmCols = featureMap?.[0]?.length ?? 0;
  const poolRows = poolingResult?.length ?? 0;
  const poolCols = poolingResult?.[0]?.length ?? 0;

  // Compute cell size to fit all grids
  // Layout: [input] [kernel] [feature map] [pooled] arranged horizontally
  const gridGap = 16;
  const labelH = 18;
  const totalCols = inputCols + kernelSize + fmCols + (poolRows > 0 ? poolCols : 0);
  const numGaps = poolRows > 0 ? 3 : 2;
  const maxCellByWidth = (availW - numGaps * gridGap) / totalCols;
  const maxRows = Math.max(inputRows, kernelSize, fmRows, poolRows || 1);
  const maxCellByHeight = (availH - labelH) / maxRows;
  const cell = Math.min(maxCellByWidth, maxCellByHeight, 36);

  // Section positioning
  const inputW = inputCols * cell;
  const kernelW = kernelSize * cell;
  const fmW = fmCols * cell;
  const poolW = poolCols * cell;
  const totalW = inputW + kernelW + fmW + (poolRows > 0 ? poolW + gridGap : 0) + numGaps * gridGap;
  let curX = pad + (availW - totalW) / 2;

  // ---- Input Grid ----
  const inputStartX = curX;
  const inputStartY = topY + labelH;
  drawGrid(ctx, inputGrid, inputStartX, inputStartY, cell, inputRows, inputCols, null, COLORS.comparing);

  // Kernel overlay on input grid
  if (kernelPosition && kernelPosition.row >= 0 && cnnPhase === 'conv') {
    const kx = inputStartX + kernelPosition.col * cell;
    const ky = inputStartY + kernelPosition.row * cell;
    ctx.strokeStyle = COLORS.swapping;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.swapping;
    ctx.shadowBlur = 8;
    ctx.strokeRect(kx, ky, kernelSize * cell, kernelSize * cell);
    ctx.shadowBlur = 0;
  }

  // Label
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('input', inputStartX + inputW / 2, topY + 10);

  curX += inputW + gridGap;

  // ---- Kernel ----
  const kernelStartX = curX;
  const kernelStartY = topY + labelH + (inputRows - kernelSize) * cell / 2; // center vertically
  drawGrid(ctx, kernel, kernelStartX, kernelStartY, cell, kernelSize, kernelSize, null, COLORS.swapping);

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('kernel', kernelStartX + kernelW / 2, topY + 10);

  // Arrow from kernel to feature map
  const arrowFromX = kernelStartX + kernelW + 4;
  curX += kernelW + gridGap;
  const arrowToX = curX - 4;
  const arrowY = topY + labelH + (inputRows * cell) / 2;
  drawArrow(ctx, arrowFromX, arrowY, arrowToX, arrowY, COLORS.textMuted);

  // ---- Feature Map ----
  if (featureMap) {
    const fmStartX = curX;
    const fmStartY = topY + labelH + (inputRows - fmRows) * cell / 2;

    // Determine highlighted cell in feature map
    let highlightCell: { row: number; col: number } | null = null;
    if (kernelPosition && kernelPosition.row >= 0 && cnnPhase === 'conv') {
      highlightCell = { row: kernelPosition.row, col: kernelPosition.col };
    }

    drawGrid(ctx, featureMap, fmStartX, fmStartY, cell, fmRows, fmCols, highlightCell, COLORS.sorted);

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('feature map', fmStartX + fmW / 2, topY + 10);

    curX += fmW + gridGap;
  }

  // ---- Pooled Output ----
  if (poolingResult && poolRows > 0) {
    // Arrow
    drawArrow(ctx, curX - gridGap + 4, arrowY, curX - 4, arrowY, COLORS.textMuted);

    const poolStartX = curX;
    const poolStartY = topY + labelH + (inputRows - poolRows) * cell / 2;

    let poolHighlight: { row: number; col: number } | null = null;
    if (cnnPhase === 'pool' && scene.currentExample !== undefined) {
      const pc = poolCols > 0 ? scene.currentExample % poolCols : 0;
      const pr = poolCols > 0 ? Math.floor(scene.currentExample / poolCols) : 0;
      poolHighlight = { row: pr, col: pc };
    }

    drawGrid(ctx, poolingResult, poolStartX, poolStartY, cell, poolRows, poolCols, poolHighlight, COLORS.comparing);

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('pooled', poolStartX + poolW / 2, topY + 10);
  }

  // Phase indicator
  const phaseLabel = cnnPhase === 'conv' ? 'convolution' : cnnPhase === 'pool' ? 'max pooling' : 'complete';
  const phaseCol = cnnPhase === 'conv' ? COLORS.comparing : cnnPhase === 'pool' ? COLORS.swapping : COLORS.sorted;
  ctx.fillStyle = phaseCol + 'cc';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(phaseLabel, width - pad, topY + 10);

  drawStatusLine(ctx, width, state, 'cnn');
}

/** Draw a 2D grid of numbers as colored cells */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: (number | null)[][],
  startX: number,
  startY: number,
  cellSize: number,
  rows: number,
  cols: number,
  highlightCell: { row: number; col: number } | null,
  accentColor: string
): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r]?.[c];
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const isHighlighted = highlightCell && highlightCell.row === r && highlightCell.col === c;

      // Cell background
      if (val === null || val === undefined) {
        ctx.fillStyle = '#1a1a2e';
      } else {
        // Map value to color intensity
        const t = Math.min(1, Math.max(0, Math.abs(val)));
        ctx.fillStyle = lerpColor('#1a1a2e', accentColor, t * 0.6 + 0.1);
      }

      ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

      // Highlight border
      if (isHighlighted) {
        ctx.strokeStyle = COLORS.swapping;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.swapping;
        ctx.shadowBlur = 6;
        ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
        ctx.shadowBlur = 0;
      }

      // Value text (only show if cell is big enough)
      if (cellSize >= 22 && val !== null && val !== undefined) {
        ctx.fillStyle = COLORS.text + 'cc';
        ctx.font = `${Math.min(9, cellSize * 0.32)}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayVal = Number.isInteger(val) ? String(val) : val.toFixed(1);
        ctx.fillText(displayVal, x + cellSize / 2 - 0.5, y + cellSize / 2);
      }
    }
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string
): void {
  ctx.strokeStyle = color + '88';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, fromY);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = color + '88';
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 5, toY - 3);
  ctx.lineTo(toX - 5, toY + 3);
  ctx.closePath();
  ctx.fill();
}


// ═══════════════════════════════════════════════════════════════════════════
// 4. GRADIENT DESCENT — 2D loss contour plot with descent path
// ═══════════════════════════════════════════════════════════════════════════

function drawGradientDescentScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: NeuronScene,
  state: AnimationState
): void {
  const { lossPath, currentPosition, surfaceParams, gradient, learningRate } = scene;

  if (!surfaceParams || !currentPosition) {
    drawPerceptronScene(ctx, width, height, scene, state);
    return;
  }

  const pad = 40;
  const topY = 44;
  const plotX = pad;
  const plotY = topY;
  const plotW = width - pad * 2;
  const plotH = height - topY - pad - 30;

  // Coordinate range for plotting
  const range = 3.5;
  const cx = surfaceParams.centerX;
  const cy = surfaceParams.centerY;
  const minX = cx - range;
  const maxX = cx + range;
  const minY = cy - range;
  const maxY = cy + range;

  // Map world coords to canvas coords
  const toCanvasX = (wx: number) => plotX + ((wx - minX) / (maxX - minX)) * plotW;
  const toCanvasY = (wy: number) => plotY + plotH - ((wy - minY) / (maxY - minY)) * plotH;

  // Draw contour plot
  const contourRes = 3; // pixel step size for performance
  const cosA = Math.cos(surfaceParams.angle);
  const sinA = Math.sin(surfaceParams.angle);

  for (let px = plotX; px < plotX + plotW; px += contourRes) {
    for (let py = plotY; py < plotY + plotH; py += contourRes) {
      const wx = minX + ((px - plotX) / plotW) * (maxX - minX);
      const wy = maxY - ((py - plotY) / plotH) * (maxY - minY);

      const rx = cosA * (wx - cx) + sinA * (wy - cy);
      const ry = -sinA * (wx - cx) + cosA * (wy - cy);
      const loss = surfaceParams.a * rx * rx + surfaceParams.b * ry * ry;

      // Map loss to color: low loss = dark teal, high loss = warm purple
      const t = Math.min(1, loss / 8);
      const color = getContourColor(t);
      ctx.fillStyle = color;
      ctx.fillRect(px, py, contourRes, contourRes);
    }
  }

  // Draw contour lines
  const contourLevels = [0.1, 0.3, 0.6, 1.0, 1.5, 2.5, 4.0, 6.0];
  for (const level of contourLevels) {
    drawContourLine(ctx, plotX, plotY, plotW, plotH, minX, maxX, minY, maxY, surfaceParams, level);
  }

  // Draw descent path
  if (lossPath && lossPath.length > 1) {
    // Path line
    ctx.beginPath();
    const firstPt = lossPath[0];
    ctx.moveTo(toCanvasX(firstPt.x), toCanvasY(firstPt.y));
    for (let i = 1; i < lossPath.length; i++) {
      ctx.lineTo(toCanvasX(lossPath[i].x), toCanvasY(lossPath[i].y));
    }
    ctx.strokeStyle = COLORS.swapping + 'cc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Path dots (last 20)
    const showPath = lossPath.slice(-20);
    for (let i = 0; i < showPath.length; i++) {
      const pt = showPath[i];
      const px = toCanvasX(pt.x);
      const py = toCanvasY(pt.y);
      const isLast = i === showPath.length - 1;
      const dotR = isLast ? 5 : 2.5;
      const alpha = 0.4 + 0.6 * (i / showPath.length);

      if (isLast) {
        ctx.shadowColor = COLORS.swapping;
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.swapping + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();

      if (isLast) {
        ctx.strokeStyle = COLORS.swapping;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }
  }

  // Draw gradient arrow at current position
  if (gradient && currentPosition) {
    const px = toCanvasX(currentPosition.x);
    const py = toCanvasY(currentPosition.y);
    const gradMag = Math.sqrt(gradient.dx * gradient.dx + gradient.dy * gradient.dy);

    if (gradMag > 0.01) {
      const scale = Math.min(40, 15 * gradMag);
      const arrowEndX = px - (gradient.dx / gradMag) * scale;
      const arrowEndY = py + (gradient.dy / gradMag) * scale; // flipped Y

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(arrowEndX, arrowEndY);
      ctx.strokeStyle = COLORS.sorted + 'cc';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(arrowEndY - py, arrowEndX - px);
      ctx.beginPath();
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(arrowEndX - 7 * Math.cos(angle - 0.4), arrowEndY - 7 * Math.sin(angle - 0.4));
      ctx.lineTo(arrowEndX - 7 * Math.cos(angle + 0.4), arrowEndY - 7 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = COLORS.sorted + 'cc';
      ctx.fill();
    }
  }

  // Draw minimum marker (cross)
  {
    const mx = toCanvasX(cx);
    const my = toCanvasY(cy);
    ctx.strokeStyle = COLORS.sorted;
    ctx.lineWidth = 1.5;
    const crossR = 6;
    ctx.beginPath();
    ctx.moveTo(mx - crossR, my - crossR);
    ctx.lineTo(mx + crossR, my + crossR);
    ctx.moveTo(mx + crossR, my - crossR);
    ctx.lineTo(mx - crossR, my + crossR);
    ctx.stroke();

    ctx.fillStyle = COLORS.sorted + '88';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('min', mx + 8, my + 3);
  }

  // Axes labels
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('w1', plotX + plotW / 2, plotY + plotH + 18);
  ctx.save();
  ctx.translate(plotX - 20, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('w2', 0, 0);
  ctx.restore();

  // Info panel (top-right)
  if (currentPosition) {
    const infoX = width - pad;
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`loss: ${currentPosition.loss.toFixed(4)}`, infoX, topY + 14);
    if (learningRate !== undefined) {
      ctx.fillStyle = COLORS.textMuted;
      ctx.fillText(`lr: ${learningRate}`, infoX, topY + 28);
    }
    if (gradient) {
      const gradMag = Math.sqrt(gradient.dx * gradient.dx + gradient.dy * gradient.dy);
      ctx.fillText(`|\u2207L|: ${gradMag.toFixed(4)}`, infoX, topY + 42);
    }
  }

  drawStatusLine(ctx, width, state, 'gradient descent');
}

/** Map a normalized loss value (0-1) to a contour color */
function getContourColor(t: number): string {
  // Dark teal (low loss) -> muted purple -> warm (high loss)
  if (t < 0.3) {
    return lerpColor('#0d1b2a', '#1b3a4b', t / 0.3);
  } else if (t < 0.6) {
    return lerpColor('#1b3a4b', '#3a2a52', (t - 0.3) / 0.3);
  } else {
    return lerpColor('#3a2a52', '#52303a', (t - 0.6) / 0.4);
  }
}

/** Draw a single contour line at a given loss level using marching squares approximation */
function drawContourLine(
  ctx: CanvasRenderingContext2D,
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  surface: { a: number; b: number; angle: number; centerX: number; centerY: number },
  level: number
): void {
  // Sample points around the contour using parametric ellipse
  const cosA = Math.cos(surface.angle);
  const sinA = Math.sin(surface.angle);

  // For loss = level: a*rx^2 + b*ry^2 = level
  // Parametrize: rx = sqrt(level/a)*cos(t), ry = sqrt(level/b)*sin(t)
  if (level / surface.a < 0 || level / surface.b < 0) return;
  const rxa = Math.sqrt(level / surface.a);
  const rya = Math.sqrt(level / surface.b);

  const numPts = 60;
  ctx.beginPath();
  let started = false;

  for (let i = 0; i <= numPts; i++) {
    const t = (i / numPts) * 2 * Math.PI;
    const rx = rxa * Math.cos(t);
    const ry = rya * Math.sin(t);

    // Rotate back to world coordinates
    const wx = cosA * rx - sinA * ry + surface.centerX;
    const wy = sinA * rx + cosA * ry + surface.centerY;

    // Map to canvas
    const px = plotX + ((wx - minX) / (maxX - minX)) * plotW;
    const py = plotY + plotH - ((wy - minY) / (maxY - minY)) * plotH;

    // Clip to plot area
    if (px < plotX || px > plotX + plotW || py < plotY || py > plotY + plotH) {
      started = false;
      continue;
    }

    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  const alpha = Math.max(0.15, 0.5 - level * 0.05);
  ctx.strokeStyle = COLORS.text + Math.round(alpha * 255).toString(16).padStart(2, '0');
  ctx.lineWidth = 0.7;
  ctx.stroke();
}


// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK — static AND-gate perceptron (no scene data)
// ═══════════════════════════════════════════════════════════════════════════

function drawNeuronFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: AnimationState
): void {
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
  drawCircleNode(ctx, sumNode.x, sumNode.y, NODE_R * 1.1, '\u03A3', '', sumColor, true);
  drawCircleNode(ctx, outNode.x, outNode.y, NODE_R, 'out', '', '#908caa', false);

  // Scatter plot
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

  drawStatusLine(ctx, width, state, 'neuron');
}
