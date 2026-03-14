import type { AnimationStep, TreeScene, TreeNode, StepResult } from '../animation-engine';

/**
 * Generates AnimationSteps for a Min-Heap data structure.
 *
 * Returns { steps, initialScene } where initialScene is an empty TreeScene.
 * Each step's sceneUpdate carries the full TreeScene snapshot.
 *
 * Phases:
 *   1. Insert values one by one, bubble-up to maintain heap property
 *   2. Extract-min operations, bubble-down to restore heap property
 */
export function generateHeapSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const raw = arr.slice(0, Math.min(7, arr.length));
  const fmt = (v: number) => Math.round(v * 100).toString();

  // Internal heap array
  const heap: number[] = [];

  /** Compute normalised (x, y) for a node at a given heap index. */
  function nodePos(index: number): { x: number; y: number } {
    const level = Math.floor(Math.log2(index + 1));
    const posInLevel = index - (Math.pow(2, level) - 1);
    const nodesInLevel = Math.pow(2, level);

    const spread = 0.8;
    const levelSpread = spread / nodesInLevel;
    const x = 0.5 - spread / 2 + levelSpread * (posInLevel + 0.5);
    const y = 0.12 + level * 0.22;

    return { x, y };
  }

  /** Build a full TreeScene snapshot from the current heap. */
  function buildScene(activePathIds: number[] = []): TreeScene {
    const nodes: TreeNode[] = heap.map((val, i) => {
      const pos = nodePos(i);
      return {
        id: i,
        value: String(val),
        x: pos.x,
        y: pos.y,
        left: 2 * i + 1 < heap.length ? 2 * i + 1 : undefined,
        right: 2 * i + 2 < heap.length ? 2 * i + 2 : undefined,
      };
    });

    const edges: Array<{ from: number; to: number }> = [];
    for (let i = 0; i < heap.length; i++) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < heap.length) edges.push({ from: i, to: left });
      if (right < heap.length) edges.push({ from: i, to: right });
    }

    return { type: 'tree', nodes, edges, activePathIds };
  }

  if (raw.length === 0) {
    const initialScene: TreeScene = { type: 'tree', nodes: [], edges: [], activePathIds: [] };
    steps.push({
      type: 'done',
      indices: [],
      description: 'Empty input — nothing to insert into heap',
      sceneUpdate: initialScene,
    });
    return { steps, initialScene };
  }

  // ── Phase 1: Insert values with bubble-up ─────────────────────────────
  for (let i = 0; i < raw.length; i++) {
    const val = Math.round(raw[i] * 100);
    heap.push(val);
    let idx = heap.length - 1;

    steps.push({
      type: 'swap',
      indices: [idx],
      description: `Inserting ${val} at index ${idx}`,
      sceneUpdate: buildScene([idx]),
    });

    // Bubble up
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);

      steps.push({
        type: 'compare',
        indices: [idx, parentIdx],
        description: `Comparing ${heap[idx]} with parent ${heap[parentIdx]}`,
        sceneUpdate: buildScene([idx, parentIdx]),
      });

      if (heap[idx] < heap[parentIdx]) {
        // Swap
        [heap[idx], heap[parentIdx]] = [heap[parentIdx], heap[idx]];

        steps.push({
          type: 'swap',
          indices: [idx, parentIdx],
          description: `${heap[parentIdx]} < ${heap[idx]} — swapping (bubble up)`,
          sceneUpdate: buildScene([parentIdx]),
        });

        idx = parentIdx;
      } else {
        steps.push({
          type: 'sorted',
          indices: [idx],
          description: `${heap[idx]} >= ${heap[parentIdx]} — heap property satisfied`,
          sceneUpdate: buildScene(),
        });
        break;
      }
    }

    if (idx === 0) {
      steps.push({
        type: 'sorted',
        indices: [0],
        description: `${heap[0]} is now at the root (min). Heap size = ${heap.length}`,
        sceneUpdate: buildScene(),
      });
    }
  }

  // ── Phase 2: Extract-min operations ───────────────────────────────────
  const extractCount = Math.min(3, heap.length);
  for (let e = 0; e < extractCount; e++) {
    if (heap.length === 0) break;

    const minVal = heap[0];

    steps.push({
      type: 'compare',
      indices: [0],
      description: `Extract-min: removing root ${minVal}`,
      sceneUpdate: buildScene([0]),
    });

    if (heap.length === 1) {
      heap.pop();
      steps.push({
        type: 'sorted',
        indices: [],
        description: `Extracted ${minVal} — heap is now empty`,
        sceneUpdate: buildScene(),
      });
      continue;
    }

    // Move last element to root
    heap[0] = heap.pop()!;

    steps.push({
      type: 'swap',
      indices: [0],
      description: `Moved ${heap[0]} to root — bubble down to restore heap property`,
      sceneUpdate: buildScene([0]),
    });

    // Bubble down
    let idx = 0;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;

      if (left < heap.length) {
        steps.push({
          type: 'compare',
          indices: [idx, left],
          description: `Comparing ${heap[idx]} with left child ${heap[left]}`,
          sceneUpdate: buildScene([idx, left]),
        });
        if (heap[left] < heap[smallest]) smallest = left;
      }

      if (right < heap.length) {
        steps.push({
          type: 'compare',
          indices: [idx, right],
          description: `Comparing ${heap[idx]} with right child ${heap[right]}`,
          sceneUpdate: buildScene([idx, right]),
        });
        if (heap[right] < heap[smallest]) smallest = right;
      }

      if (smallest !== idx) {
        [heap[idx], heap[smallest]] = [heap[smallest], heap[idx]];

        steps.push({
          type: 'swap',
          indices: [idx, smallest],
          description: `Swapping ${heap[smallest]} and ${heap[idx]} (bubble down)`,
          sceneUpdate: buildScene([smallest]),
        });

        idx = smallest;
      } else {
        steps.push({
          type: 'sorted',
          indices: [idx],
          description: `Heap property restored. Extracted ${minVal}. Heap size = ${heap.length}`,
          sceneUpdate: buildScene(),
        });
        break;
      }
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────
  steps.push({
    type: 'done',
    indices: [],
    description: `Heap operations complete — ${heap.length} elements remaining`,
    sceneUpdate: buildScene(),
  });

  const initialScene: TreeScene = { type: 'tree', nodes: [], edges: [], activePathIds: [] };
  return { steps, initialScene };
}
