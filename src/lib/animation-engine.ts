// ── Renderer types ────────────────────────────────────────────────────────

export type RendererType =
  | 'bar-chart'
  | 'graph'
  | 'tree'
  | 'linear'
  | 'hash-table'
  | 'dp-grid'
  | 'neuron';

// ── Scene state interfaces ────────────────────────────────────────────────

export interface GraphNode {
  id: number;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  weight?: number;
  highlighted?: boolean;
}

export interface GraphScene {
  type: 'graph';
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Map from node id → state string, e.g. 'visited', 'current', 'queued', 'finalized' */
  nodeStates: Record<number, string>;
  /** Optional distance labels per node id */
  distanceLabels?: Record<number, string>;
  /** Current queue or stack contents (node ids) */
  queueOrStack?: number[];
}

export interface TreeNode {
  id: number;
  value: string;
  x: number;
  y: number;
  left?: number;   // child node id
  right?: number;  // child node id
}

export interface TreeScene {
  type: 'tree';
  nodes: TreeNode[];
  edges: Array<{ from: number; to: number }>;
  /** Node ids that are on the active traversal path */
  activePathIds: number[];
}

export interface LinearItem {
  value: string;
  label?: string;
  /** 'default' | 'active' | 'comparing' | 'inserted' | 'removed' */
  state: string;
}

export interface LinearScene {
  type: 'linear';
  items: LinearItem[];
  pointers?: Array<{ index: number; label: string }>;
  /** 'stack' | 'queue' | 'linked-list' */
  structureType: string;
}

export interface HashBucket {
  index: number;
  chain: Array<{ key: number | string; state: string }>;
}

export interface HashTableScene {
  type: 'hash-table';
  buckets: HashBucket[];
  tableSize: number;
  /** Highlighted bucket index during hash computation */
  hashComputation?: { key: number | string; bucketIndex: number };
}

export interface DPCell {
  row: number;
  col: number;
  value: string;
  /** 'default' | 'computing' | 'computed' | 'highlight' | 'path' */
  state: string;
}

export interface DPGridScene {
  type: 'dp-grid';
  grid: DPCell[][];
  rowLabels?: string[];
  colLabels?: string[];
  highlightedCells?: Array<{ row: number; col: number }>;
}

export interface TrainingPoint {
  x: number;
  y: number;
  label: number;
}

export interface NeuronScene {
  type: 'neuron';
  inputs: number[];
  weights: number[];
  bias: number;
  weightedSum: number;
  output: number;
  /** Current training example index */
  currentExample?: number;
  /** Decision boundary parameters (for 2-input): w1*x + w2*y + b = 0 */
  decisionBoundary?: { w1: number; w2: number; bias: number };
  trainingPoints?: TrainingPoint[];
}

// ── Discriminated union ───────────────────────────────────────────────────

export type SceneState =
  | GraphScene
  | TreeScene
  | LinearScene
  | HashTableScene
  | DPGridScene
  | NeuronScene;

// ── Step result (scene-aware generators) ─────────────────────────────────

/**
 * Return type for scene-aware step generators.
 * `initialScene` seeds `AnimationState.scene` before the first step is applied.
 * Legacy generators return a plain `AnimationStep[]`.
 */
export interface StepResult {
  steps: AnimationStep[];
  initialScene: SceneState;
}

/** Type guard — narrows the union returned by a step generator */
export function isStepResult(value: AnimationStep[] | StepResult): value is StepResult {
  return !Array.isArray(value) && 'steps' in value && 'initialScene' in value;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface AnimationStep {
  type: 'compare' | 'swap' | 'sorted' | 'unsorted' | 'pivot' | 'done';
  indices: number[];
  values?: number[];
  description: string;
  /** Optional scene state patch applied on top of the current scene */
  sceneUpdate?: Partial<SceneState>;
}

export interface AnimationState {
  array: number[];
  steps: AnimationStep[];
  currentStep: number;
  isPlaying: boolean;
  speed: number;        // multiplier: 0.25 – 4
  comparisons: number;
  swaps: number;
  sortedIndices: Set<number>;
  comparingIndices: number[];
  swappingIndices: number[];
  isDone: boolean;
  /** Active renderer type (set from AlgorithmMeta). Defaults to 'bar-chart'. */
  rendererType?: RendererType;
  /** Current scene state for non-bar-chart renderers. Null for bar-chart mode. */
  scene?: SceneState | null;
}

// ── Color palette ─────────────────────────────────────────────────────────

export const COLORS = {
  bar:       '#3a3a52',
  barTop:    '#4a4a66',
  default:   '#908caa',
  comparing: '#c4a7e7',   // purple
  swapping:  '#f6c177',   // gold
  sorted:    '#a6da95',   // green
  text:      '#e0def4',
  textMuted: '#6e6a86',
  bg:        '#12121a',
} as const;

// ── Easing ────────────────────────────────────────────────────────────────

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Delay helper ──────────────────────────────────────────────────────────

/**
 * Convert a speed multiplier (0.25 – 4) to a delay in milliseconds.
 * At 1× → ~250 ms; at 4× → ~62 ms; at 0.25× → ~1000 ms.
 */
export function speedToDelay(speed: number): number {
  return Math.round(250 / speed);
}

// ── Array generation ──────────────────────────────────────────────────────

export function generateArray(size: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.random() * 0.85 + 0.1); // 0.1 – 0.95
  }
  return arr;
}

// ── Initial state factory ─────────────────────────────────────────────────

export function createInitialState(
  size = 24,
  rendererType: RendererType = 'bar-chart',
  scene: SceneState | null = null
): AnimationState {
  return {
    array: generateArray(size),
    steps: [],
    currentStep: 0,
    isPlaying: false,
    speed: 1,
    comparisons: 0,
    swaps: 0,
    sortedIndices: new Set(),
    comparingIndices: [],
    swappingIndices: [],
    isDone: false,
    rendererType,
    scene,
  };
}

// ── Step execution helpers ────────────────────────────────────────────────

/**
 * Apply a single AnimationStep to a mutable state snapshot.
 * Returns metadata that callers (hooks, canvas) can use for rendering.
 */
export function applyStep(
  state: AnimationState,
  step: AnimationStep
): AnimationState {
  const next: AnimationState = {
    ...state,
    comparingIndices: [],
    swappingIndices: [],
    currentStep: state.currentStep + 1,
  };

  // Apply scene update if present (for non-bar-chart renderers)
  if (step.sceneUpdate && state.scene) {
    next.scene = { ...state.scene, ...step.sceneUpdate } as SceneState;
  }

  switch (step.type) {
    case 'compare': {
      next.comparingIndices = step.indices;
      next.comparisons = state.comparisons + 1;
      break;
    }
    case 'swap': {
      next.swappingIndices = step.indices;
      next.swaps = state.swaps + 1;
      // Swap array values for bar-chart renderer (or when rendererType is not set —
      // e.g. legacy tests that construct AnimationState without the new fields).
      const rt = state.rendererType;
      if ((rt === 'bar-chart' || rt === undefined) && step.indices.length === 2) {
        const arr = [...state.array];
        const [a, b] = step.indices;
        [arr[a], arr[b]] = [arr[b], arr[a]];
        next.array = arr;
      }
      break;
    }
    case 'sorted': {
      const sorted = new Set(state.sortedIndices);
      step.indices.forEach(i => sorted.add(i));
      next.sortedIndices = sorted;
      break;
    }
    case 'done': {
      // Mark everything sorted
      const sorted = new Set<number>();
      state.array.forEach((_, i) => sorted.add(i));
      next.sortedIndices = sorted;
      next.isDone = true;
      break;
    }
  }

  return next;
}

// ── Reset ─────────────────────────────────────────────────────────────────

export function reset(
  size: number,
  speed: number,
  rendererType: RendererType = 'bar-chart',
  scene: SceneState | null = null
): AnimationState {
  return {
    ...createInitialState(size, rendererType, scene),
    speed,
  };
}

// ── Swap animation frames ─────────────────────────────────────────────────

/**
 * Returns an array of intermediate arrays representing each frame of a
 * swap animation between indices a and b.
 */
export function getSwapFrames(
  arr: number[],
  a: number,
  b: number,
  totalFrames = 12
): number[][] {
  const frames: number[][] = [];
  const startA = arr[a];
  const startB = arr[b];

  for (let f = 1; f <= totalFrames; f++) {
    const t = easeInOutCubic(f / totalFrames);
    const frame = [...arr];
    frame[a] = startA + (startB - startA) * t;
    frame[b] = startB + (startA - startB) * t;
    frames.push(frame);
  }

  return frames;
}
