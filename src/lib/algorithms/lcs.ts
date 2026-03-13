import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Longest Common Subsequence (LCS).
 *
 * The algorithm builds an (m+1) × (n+1) DP table where dp[i][j] is the length of the
 * LCS of the first i characters of sequence A and the first j characters of sequence B.
 * After filling the table, a backtracking phase traces the optimal path.
 *
 * The two sequences are derived from the input array:
 *   - Sequence A: first half of the array (up to MAX_LEN elements)
 *   - Sequence B: second half of the array (up to MAX_LEN elements)
 * Each value is converted to a single uppercase letter for readability.
 *
 * Flat index encoding:
 *   index = i * (n + 1) + j
 * where i indexes into sequence A (0 = base row) and j into sequence B (0 = base col).
 *
 * Steps produced:
 *   - compare  → comparing characters seq[i-1] and seq[j-1] (or choosing max)
 *   - swap     → writing a new value into a DP cell (diagonal match)
 *   - sorted   → a DP cell is finalised; also used for backtracking path cells
 *   - done     → the LCS table and backtracking are complete
 */
export function generateLCSSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  const MAX_LEN = 5; // keep table at most 6×6 for readability

  // Split input into two sequences
  const half = Math.ceil(arr.length / 2);
  const rawA = arr.slice(0, Math.min(MAX_LEN, half));
  const rawB = arr.slice(half, half + Math.min(MAX_LEN, arr.length - half));

  const m = rawA.length;
  const n = rawB.length;

  // Map float values → single uppercase letters A-Z
  const toChar = (v: number): string =>
    String.fromCharCode(65 + Math.round(v * 25)); // 'A' … 'Z'

  const seqA = rawA.map(toChar);
  const seqB = rawB.map(toChar);

  if (m === 0 || n === 0) {
    steps.push({
      type: 'done',
      indices: [],
      description: 'One or both sequences are empty — LCS length is 0',
    });
    return steps;
  }

  const cols = n + 1; // number of columns (j = 0 … n)
  const flatIdx = (i: number, j: number) => i * cols + j;

  // ── Base cases: row 0 and column 0 are all zeros ──────────────────────
  for (let j = 0; j <= n; j++) {
    steps.push({
      type: 'sorted',
      indices: [flatIdx(0, j)],
      description: `Base case: dp[0][${j}] = 0 (empty prefix of A)`,
    });
  }
  for (let i = 1; i <= m; i++) {
    steps.push({
      type: 'sorted',
      indices: [flatIdx(i, 0)],
      description: `Base case: dp[${i}][0] = 0 (empty prefix of B)`,
    });
  }

  // ── Fill DP table ─────────────────────────────────────────────────────
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const charA = seqA[i - 1];
      const charB = seqB[j - 1];

      // Compare characters
      steps.push({
        type: 'compare',
        indices: [flatIdx(i, j), flatIdx(i - 1, j - 1)],
        description: `Comparing A[${i - 1}]='${charA}' with B[${j - 1}]='${charB}'`,
      });

      if (charA === charB) {
        // Match — extend the diagonal
        const val = dp[i - 1][j - 1] + 1;
        steps.push({
          type: 'swap',
          indices: [flatIdx(i, j)],
          description: `Match '${charA}' = '${charB}'! dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${val}`,
        });
        dp[i][j] = val;
      } else {
        // No match — take the max of left and above
        const fromLeft = dp[i][j - 1];
        const fromAbove = dp[i - 1][j];

        steps.push({
          type: 'compare',
          indices: [flatIdx(i, j - 1), flatIdx(i - 1, j)],
          description: `No match: choosing max(dp[${i}][${j - 1}]=${fromLeft}, dp[${i - 1}][${j}]=${fromAbove})`,
        });

        dp[i][j] = Math.max(fromLeft, fromAbove);
      }

      steps.push({
        type: 'sorted',
        indices: [flatIdx(i, j)],
        description: `dp[${i}][${j}] = ${dp[i][j]} (finalised)`,
      });
    }
  }

  // ── Backtrack to find the LCS path ────────────────────────────────────
  const lcsLength = dp[m][n];
  let bi = m;
  let bj = n;
  const pathIndices: number[] = [];

  steps.push({
    type: 'compare',
    indices: [flatIdx(m, n)],
    description: `Backtracking from dp[${m}][${n}] = ${lcsLength} to find the LCS path`,
  });

  while (bi > 0 && bj > 0) {
    if (seqA[bi - 1] === seqB[bj - 1]) {
      pathIndices.push(flatIdx(bi, bj));
      steps.push({
        type: 'sorted',
        indices: [flatIdx(bi, bj)],
        description: `Backtrack: match '${seqA[bi - 1]}' at dp[${bi}][${bj}] — part of LCS`,
      });
      bi--;
      bj--;
    } else if (dp[bi - 1][bj] > dp[bi][bj - 1]) {
      steps.push({
        type: 'compare',
        indices: [flatIdx(bi - 1, bj)],
        description: `Backtrack: dp[${bi - 1}][${bj}] > dp[${bi}][${bj - 1}] — moving UP`,
      });
      bi--;
    } else {
      steps.push({
        type: 'compare',
        indices: [flatIdx(bi, bj - 1)],
        description: `Backtrack: moving LEFT to dp[${bi}][${bj - 1}]`,
      });
      bj--;
    }
  }

  const lcsChars = pathIndices.map((idx) => {
    const row = Math.floor(idx / cols);
    return seqA[row - 1];
  }).reverse();

  steps.push({
    type: 'done',
    indices: pathIndices,
    description: `LCS complete — length ${lcsLength}${lcsChars.length > 0 ? `, sequence: "${lcsChars.join('')}"` : ''}`,
  });

  return steps;
}
