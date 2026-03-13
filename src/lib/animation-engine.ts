// ── Types ──────────────────────────────────────────────────────────────────

export interface AnimationStep {
  type: 'compare' | 'swap' | 'sorted' | 'unsorted' | 'pivot' | 'done';
  indices: number[];
  values?: number[];
  description: string;
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

export function createInitialState(size = 24): AnimationState {
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

  switch (step.type) {
    case 'compare': {
      next.comparingIndices = step.indices;
      next.comparisons = state.comparisons + 1;
      break;
    }
    case 'swap': {
      next.swappingIndices = step.indices;
      next.swaps = state.swaps + 1;
      const arr = [...state.array];
      const [a, b] = step.indices;
      [arr[a], arr[b]] = [arr[b], arr[a]];
      next.array = arr;
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

export function reset(size: number, speed: number): AnimationState {
  return {
    ...createInitialState(size),
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
