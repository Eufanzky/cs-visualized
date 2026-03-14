import type { RendererType, SceneState, AnimationState } from '../animation-engine';
import { drawBarChart } from './bar-chart';
import { drawGraph } from './graph';
import { drawTree } from './tree';
import { drawLinear } from './linear';
import { drawHashTable } from './hash-table';
import { drawDPGrid } from './dp-grid';
import { drawNeuron } from './neuron';
import { drawMaze } from './maze';
import { drawRecursionTree } from './recursion-tree';

// ── Renderer function signature ────────────────────────────────────────────

/**
 * A CanvasRenderer draws the current animation state onto a 2D canvas context.
 *
 * Parameters:
 *   ctx         — the 2D rendering context (already scaled for DPR)
 *   width       — CSS width of the canvas
 *   height      — CSS height of the canvas
 *   scene       — current SceneState (may be null for bar-chart / legacy)
 *   state       — full AnimationState (contains array, indices, flags, etc.)
 */
export type CanvasRenderer = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneState | null,
  state: AnimationState
) => void;

// ── Registry ──────────────────────────────────────────────────────────────

// Wrap bar-chart to match the CanvasRenderer signature (no override params)
const barChartRenderer: CanvasRenderer = (ctx, width, height, scene, state) => {
  drawBarChart(ctx, width, height, scene, state);
};

const RENDERER_REGISTRY: Record<RendererType, CanvasRenderer> = {
  'bar-chart':  barChartRenderer,
  'graph':      drawGraph,
  'tree':       drawTree,
  'linear':     drawLinear,
  'hash-table': drawHashTable,
  'dp-grid':    drawDPGrid,
  'neuron':     drawNeuron,
  'maze':           drawMaze,
  'recursion-tree': drawRecursionTree,
};

/**
 * Returns the canvas renderer function for the given renderer type.
 * Falls back to the bar-chart renderer if an unknown type is provided.
 */
export function getRenderer(type: RendererType): CanvasRenderer {
  return RENDERER_REGISTRY[type] ?? RENDERER_REGISTRY['bar-chart'];
}

export {
  drawBarChart,
  drawGraph,
  drawTree,
  drawLinear,
  drawHashTable,
  drawDPGrid,
  drawNeuron,
  drawMaze,
  drawRecursionTree,
};
