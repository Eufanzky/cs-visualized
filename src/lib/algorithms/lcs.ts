import type { AnimationStep, DPCell, DPGridScene, StepResult } from '../animation-engine';

/**
 * Generates a StepResult for the Longest Common Subsequence (LCS) algorithm.
 *
 * Returns:
 *   - initialScene: an (m+1) × (n+1) grid of empty cells
 *   - steps: each step carries a full sceneUpdate reflecting current grid state
 *
 * Cell states:
 *   'computing'  → cell being evaluated now (purple)
 *   'computed'   → cell finalised (green)
 *   'highlight'  → referenced parent cells (gold)
 *   'path'       → LCS backtrack path (bright green)
 */

const MAX_LEN = 5;

function buildGrid(
  dp: number[][],
  m: number,
  n: number,
  filledUpTo: { row: number; col: number },
  computingCell: { row: number; col: number } | null,
  highlightCells: Array<{ row: number; col: number }>,
  pathCells: Set<string>,
): DPCell[][] {
  const grid: DPCell[][] = [];
  for (let i = 0; i <= m; i++) {
    const row: DPCell[] = [];
    for (let j = 0; j <= n; j++) {
      const key = `${i},${j}`;
      const isFilled =
        i < filledUpTo.row ||
        (i === filledUpTo.row && j <= filledUpTo.col);

      let state = 'default';
      if (pathCells.has(key)) {
        state = 'path';
      } else if (computingCell && computingCell.row === i && computingCell.col === j) {
        state = 'computing';
      } else if (highlightCells.some(h => h.row === i && h.col === j)) {
        state = 'highlight';
      } else if (isFilled) {
        state = 'computed';
      }

      row.push({
        row: i,
        col: j,
        value: isFilled || pathCells.has(key) ? String(dp[i][j]) : '',
        state,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function generateLCSSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  const half = Math.ceil(arr.length / 2);
  const rawA = arr.slice(0, Math.min(MAX_LEN, half));
  const rawB = arr.slice(half, half + Math.min(MAX_LEN, arr.length - half));

  const m = rawA.length;
  const n = rawB.length;

  const toChar = (v: number): string =>
    String.fromCharCode(65 + Math.round(v * 25));

  const seqA = rawA.map(toChar);
  const seqB = rawB.map(toChar);

  if (m === 0 || n === 0) {
    const emptyScene: DPGridScene = {
      type: 'dp-grid',
      grid: [[{ row: 0, col: 0, value: '0', state: 'computed' }]],
      rowLabels: ['∅'],
      colLabels: ['∅'],
    };
    steps.push({
      type: 'done',
      indices: [],
      description: 'One or both sequences are empty — LCS length is 0',
      sceneUpdate: emptyScene,
    });
    return { steps, initialScene: emptyScene };
  }

  // Row labels: ∅ then characters of seqA
  // Col labels: ∅ then characters of seqB
  const rowLabels = ['∅', ...seqA];
  const colLabels = ['∅', ...seqB];

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  const pathCells = new Set<string>();

  const snap = (
    filledUpTo: { row: number; col: number },
    computingCell: { row: number; col: number } | null,
    highlightCells: Array<{ row: number; col: number }>,
  ): DPGridScene => ({
    type: 'dp-grid',
    grid: buildGrid(dp, m, n, filledUpTo, computingCell, highlightCells, pathCells),
    rowLabels,
    colLabels,
  });

  // Initial scene: all cells empty
  const initialScene: DPGridScene = snap({ row: -1, col: -1 }, null, []);

  // Base cases: row 0
  for (let j = 0; j <= n; j++) {
    steps.push({
      type: 'sorted',
      indices: [j],
      description: `Base case: dp[0][${j}] = 0 (empty prefix of A)`,
      sceneUpdate: snap({ row: 0, col: j }, null, []),
    });
  }

  // Base cases: col 0, rows 1..m
  for (let i = 1; i <= m; i++) {
    steps.push({
      type: 'sorted',
      indices: [i * (n + 1)],
      description: `Base case: dp[${i}][0] = 0 (empty prefix of B)`,
      sceneUpdate: snap({ row: i, col: 0 }, null, []),
    });
  }

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const charA = seqA[i - 1];
      const charB = seqB[j - 1];

      // Show character comparison, highlight the diagonal cell
      steps.push({
        type: 'compare',
        indices: [i * (n + 1) + j],
        description: `Comparing A[${i - 1}]='${charA}' with B[${j - 1}]='${charB}'`,
        sceneUpdate: snap(
          { row: i - 1, col: n },
          { row: i, col: j },
          [{ row: i - 1, col: j - 1 }],
        ),
      });

      if (charA === charB) {
        const val = dp[i - 1][j - 1] + 1;
        dp[i][j] = val;

        steps.push({
          type: 'swap',
          indices: [i * (n + 1) + j],
          description: `Match '${charA}' = '${charB}'! dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${val}`,
          sceneUpdate: snap(
            { row: i - 1, col: n },
            { row: i, col: j },
            [{ row: i - 1, col: j - 1 }],
          ),
        });
      } else {
        const fromLeft = dp[i][j - 1];
        const fromAbove = dp[i - 1][j];

        steps.push({
          type: 'compare',
          indices: [i * (n + 1) + j - 1, (i - 1) * (n + 1) + j],
          description: `No match: choosing max(dp[${i}][${j - 1}]=${fromLeft}, dp[${i - 1}][${j}]=${fromAbove})`,
          sceneUpdate: snap(
            { row: i - 1, col: n },
            { row: i, col: j },
            [
              { row: i, col: j - 1 },
              { row: i - 1, col: j },
            ],
          ),
        });

        dp[i][j] = Math.max(fromLeft, fromAbove);
      }

      steps.push({
        type: 'sorted',
        indices: [i * (n + 1) + j],
        description: `dp[${i}][${j}] = ${dp[i][j]} (finalised)`,
        sceneUpdate: snap({ row: i, col: j }, null, []),
      });
    }
  }

  // Backtrack
  const lcsLength = dp[m][n];
  let bi = m;
  let bj = n;
  const pathIndices: number[] = [];

  steps.push({
    type: 'compare',
    indices: [m * (n + 1) + n],
    description: `Backtracking from dp[${m}][${n}] = ${lcsLength} to find the LCS path`,
    sceneUpdate: snap(
      { row: m, col: n },
      { row: m, col: n },
      [],
    ),
  });

  while (bi > 0 && bj > 0) {
    if (seqA[bi - 1] === seqB[bj - 1]) {
      pathIndices.push(bi * (n + 1) + bj);
      pathCells.add(`${bi},${bj}`);

      steps.push({
        type: 'sorted',
        indices: [bi * (n + 1) + bj],
        description: `Backtrack: match '${seqA[bi - 1]}' at dp[${bi}][${bj}] — part of LCS`,
        sceneUpdate: snap({ row: m, col: n }, null, []),
      });
      bi--;
      bj--;
    } else if (dp[bi - 1][bj] > dp[bi][bj - 1]) {
      steps.push({
        type: 'compare',
        indices: [(bi - 1) * (n + 1) + bj],
        description: `Backtrack: dp[${bi - 1}][${bj}] > dp[${bi}][${bj - 1}] — moving UP`,
        sceneUpdate: snap(
          { row: m, col: n },
          null,
          [{ row: bi - 1, col: bj }],
        ),
      });
      bi--;
    } else {
      steps.push({
        type: 'compare',
        indices: [bi * (n + 1) + bj - 1],
        description: `Backtrack: moving LEFT to dp[${bi}][${bj - 1}]`,
        sceneUpdate: snap(
          { row: m, col: n },
          null,
          [{ row: bi, col: bj - 1 }],
        ),
      });
      bj--;
    }
  }

  const lcsChars = pathIndices
    .map((idx) => {
      const row = Math.floor(idx / (n + 1));
      return seqA[row - 1];
    })
    .reverse();

  steps.push({
    type: 'done',
    indices: pathIndices,
    description: `LCS complete — length ${lcsLength}${lcsChars.length > 0 ? `, sequence: "${lcsChars.join('')}"` : ''}`,
    sceneUpdate: snap({ row: m, col: n }, null, []),
  });

  return { steps, initialScene };
}
