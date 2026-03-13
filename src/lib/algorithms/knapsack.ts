import type { AnimationStep, DPCell, DPGridScene, StepResult } from '../animation-engine';

/**
 * Generates a StepResult for the 0/1 Knapsack DP algorithm.
 *
 * Returns:
 *   - initialScene: a (numItems+1) × (capacity+1) grid of empty cells
 *   - steps: each step carries a full sceneUpdate reflecting current grid state
 *
 * Cell states:
 *   'computing'  → cell currently being evaluated (purple)
 *   'computed'   → cell finalised (green)
 *   'highlight'  → cells used as reference in current decision (gold)
 *   'path'       → optimal backtrack path (bright green)
 */

const MAX_ITEMS = 5;
const CAPACITY = 6;
const W = CAPACITY + 1; // columns: capacities 0 … CAPACITY

function buildGrid(
  dp: number[][],
  numItems: number,
  filledUpTo: { row: number; col: number },
  computingCell: { row: number; col: number } | null,
  highlightCells: Array<{ row: number; col: number }>,
  pathCells: Set<string>,
): DPCell[][] {
  const grid: DPCell[][] = [];
  for (let i = 0; i <= numItems; i++) {
    const row: DPCell[] = [];
    for (let w = 0; w < W; w++) {
      const key = `${i},${w}`;
      const isFilled =
        i < filledUpTo.row ||
        (i === filledUpTo.row && w <= filledUpTo.col);

      let state = 'default';
      if (pathCells.has(key)) {
        state = 'path';
      } else if (computingCell && computingCell.row === i && computingCell.col === w) {
        state = 'computing';
      } else if (highlightCells.some(h => h.row === i && h.col === w)) {
        state = 'highlight';
      } else if (isFilled) {
        state = 'computed';
      }

      row.push({
        row: i,
        col: w,
        value: isFilled || pathCells.has(key) ? String(dp[i][w]) : '',
        state,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function generateKnapsackSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const raw = arr.slice(0, Math.min(MAX_ITEMS, arr.length));
  const numItems = raw.length;

  if (numItems === 0) {
    const emptyScene: DPGridScene = {
      type: 'dp-grid',
      grid: [[{ row: 0, col: 0, value: '0', state: 'computed' }]],
      rowLabels: ['—'],
      colLabels: ['0'],
    };
    steps.push({
      type: 'done',
      indices: [],
      description: 'No items — DP table is empty',
      sceneUpdate: emptyScene,
    });
    return { steps, initialScene: emptyScene };
  }

  // Map float values → integer weights [1, CAPACITY] and profits [1, 10]
  const weights = raw.map((v) => Math.max(1, Math.round(v * CAPACITY)));
  const profits = raw.map((v) => Math.max(1, Math.round(v * 10)));

  // dp[i][w]: max value using items 0..i-1 with capacity w
  const dp: number[][] = Array.from({ length: numItems + 1 }, () =>
    new Array<number>(W).fill(0),
  );

  const rowLabels = ['∅', ...weights.map((w, i) => `i${i + 1}(w${w},p${profits[i]})`)];
  const colLabels = Array.from({ length: W }, (_, w) => String(w));
  const pathCells = new Set<string>();

  // Helper: snapshot the current grid state
  const snap = (
    filledUpTo: { row: number; col: number },
    computingCell: { row: number; col: number } | null,
    highlightCells: Array<{ row: number; col: number }>,
  ): DPGridScene => ({
    type: 'dp-grid',
    grid: buildGrid(dp, numItems, filledUpTo, computingCell, highlightCells, pathCells),
    rowLabels,
    colLabels,
  });

  // Initial scene: all cells empty (filledUpTo = row -1)
  const initialScene: DPGridScene = snap({ row: -1, col: -1 }, null, []);

  // Base row (i=0): all zeros, mark as filled
  for (let w = 0; w < W; w++) {
    steps.push({
      type: 'sorted',
      indices: [w],
      description: `Base case: dp[0][${w}] = 0 (no items → zero value)`,
      sceneUpdate: snap({ row: 0, col: w }, null, []),
    });
  }

  // Fill the DP table row by row
  for (let i = 1; i <= numItems; i++) {
    const itemIdx = i - 1;
    const wi = weights[itemIdx];
    const pi = profits[itemIdx];

    for (let w = 0; w < W; w++) {
      const exclude = dp[i - 1][w];

      // Show which cells are being referenced
      steps.push({
        type: 'compare',
        indices: [i * W + w],
        description: `Item ${i} (weight=${wi}, profit=${pi}): exclude → dp[${i}][${w}] = dp[${i - 1}][${w}] = ${exclude}`,
        sceneUpdate: snap(
          { row: i - 1, col: W - 1 },
          { row: i, col: w },
          [{ row: i - 1, col: w }],
        ),
      });

      let best = exclude;

      if (wi <= w) {
        const include = dp[i - 1][w - wi] + pi;

        steps.push({
          type: 'compare',
          indices: [i * W + w],
          description: `Item ${i}: include → dp[${i - 1}][${w - wi}] + ${pi} = ${include}; exclude = ${exclude}`,
          sceneUpdate: snap(
            { row: i - 1, col: W - 1 },
            { row: i, col: w },
            [
              { row: i - 1, col: w },
              { row: i - 1, col: w - wi },
            ],
          ),
        });

        if (include > exclude) {
          best = include;
          steps.push({
            type: 'swap',
            indices: [i * W + w],
            description: `Choosing INCLUDE for item ${i} at capacity ${w}: dp[${i}][${w}] = ${best}`,
            sceneUpdate: snap(
              { row: i - 1, col: W - 1 },
              { row: i, col: w },
              [{ row: i - 1, col: w - wi }],
            ),
          });
        } else {
          steps.push({
            type: 'compare',
            indices: [i * W + w],
            description: `Choosing EXCLUDE for item ${i} at capacity ${w}: ${exclude} ≥ ${include}`,
            sceneUpdate: snap(
              { row: i - 1, col: W - 1 },
              { row: i, col: w },
              [{ row: i - 1, col: w }],
            ),
          });
        }
      }

      dp[i][w] = best;

      steps.push({
        type: 'sorted',
        indices: [i * W + w],
        description: `dp[${i}][${w}] = ${best} (finalised)`,
        sceneUpdate: snap({ row: i, col: w }, null, []),
      });
    }
  }

  // Backtrack to find optimal path
  let bi = numItems;
  let bw = CAPACITY;
  while (bi > 0) {
    if (dp[bi][bw] !== dp[bi - 1][bw]) {
      pathCells.add(`${bi},${bw}`);
      bw -= weights[bi - 1];
    }
    bi--;
  }
  pathCells.add(`0,${bw}`);

  const optimal = dp[numItems][CAPACITY];

  steps.push({
    type: 'done',
    indices: [],
    description: `0/1 Knapsack complete — optimal value for capacity ${CAPACITY} is ${optimal}`,
    sceneUpdate: snap({ row: numItems, col: W - 1 }, null, []),
  });

  return { steps, initialScene };
}
