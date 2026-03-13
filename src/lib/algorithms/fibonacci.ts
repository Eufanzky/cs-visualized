import type { AnimationStep, DPCell, DPGridScene, StepResult } from '../animation-engine';

/**
 * Generates a StepResult for Fibonacci computed with memoization.
 *
 * Returns:
 *   - initialScene: a DPGridScene with a single row of n+1 empty cells
 *   - steps: each step carries a full sceneUpdate patching the grid
 *
 * n = clamp(arr.length + 3, 6, 14)
 *
 * Cell states used:
 *   'computing'  → currently being evaluated (purple)
 *   'computed'   → value stored in cache (green)
 *   'backtrack'  → cache hit highlight (gold) — mapped to 'highlight' for renderer
 */

function makeGrid(n: number, values: (string | null)[], computingIdx: number | null, highlightIdx: number | null): DPCell[][] {
  const row: DPCell[] = [];
  for (let k = 0; k <= n; k++) {
    let state = 'default';
    if (k === computingIdx) state = 'computing';
    else if (k === highlightIdx) state = 'highlight';
    else if (values[k] !== null) state = 'computed';
    row.push({ row: 0, col: k, value: values[k] ?? '', state });
  }
  return [row];
}

export function generateFibonacciSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  // Derive n from arr length; clamp to [6, 14]
  const n = Math.min(14, Math.max(6, arr.length + 3));

  const colLabels = Array.from({ length: n + 1 }, (_, k) => String(k));

  // Track which cells have been filled
  const values: (string | null)[] = new Array(n + 1).fill(null);

  const memo: Map<number, number> = new Map();
  memo.set(0, 0);
  memo.set(1, 1);
  values[0] = '0';
  values[1] = '1';

  // Initial scene: row of n+1 empty cells with base cases pre-filled
  const initialScene: DPGridScene = {
    type: 'dp-grid',
    grid: makeGrid(n, values, null, null),
    colLabels,
  };

  // Intro step — show the initial seeded grid
  steps.push({
    type: 'compare',
    indices: [n],
    description: `Computing fib(${n}) with memoization — cache pre-seeded: fib(0)=0, fib(1)=1`,
    sceneUpdate: {
      type: 'dp-grid',
      grid: makeGrid(n, values, null, null),
      colLabels,
    },
  });

  for (let k = 2; k <= n; k++) {
    // Cache lookup — highlight the cell being computed
    steps.push({
      type: 'compare',
      indices: [k],
      description: `computing fib(${k}) — looking up cache`,
      sceneUpdate: {
        type: 'dp-grid',
        grid: makeGrid(n, values, k, null),
        colLabels,
      },
    });

    if (memo.has(k)) {
      // Cache hit — highlight gold
      steps.push({
        type: 'sorted',
        indices: [k],
        description: `cache hit for fib(${k}) = ${memo.get(k)}`,
        sceneUpdate: {
          type: 'dp-grid',
          grid: makeGrid(n, values, null, k),
          colLabels,
        },
      });
    } else {
      // Cache miss — compute and store
      const result = memo.get(k - 1)! + memo.get(k - 2)!;
      memo.set(k, result);
      values[k] = String(result);

      // Show writing the result (still computing color until 'sorted' step)
      steps.push({
        type: 'swap',
        indices: [k],
        values: [result],
        description: `cache miss — computing fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${memo.get(k - 1)} + ${memo.get(k - 2)} = ${result}, storing in cache`,
        sceneUpdate: {
          type: 'dp-grid',
          grid: makeGrid(n, values, k, null),
          colLabels,
        },
      });

      // Settle the cell as computed (green)
      steps.push({
        type: 'sorted',
        indices: [k],
        description: `fib(${k}) = ${result} cached`,
        sceneUpdate: {
          type: 'dp-grid',
          grid: makeGrid(n, values, null, null),
          colLabels,
        },
      });
    }
  }

  steps.push({
    type: 'done',
    indices: [n],
    description: `fib(${n}) = ${memo.get(n)} — computed in ${n - 1} unique subproblems (memoization avoided ${Math.pow(2, n) - 1} redundant calls of naïve recursion)`,
    sceneUpdate: {
      type: 'dp-grid',
      grid: makeGrid(n, values, null, null),
      colLabels,
    },
  });

  return { steps, initialScene };
}
