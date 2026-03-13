import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for the 0/1 Knapsack DP algorithm.
 *
 * The algorithm fills a 2-D DP table dp[i][w] = max value achievable using the
 * first i items with weight capacity w.  Items and capacity are derived from the
 * input array so the demo is always parameterised by the caller.
 *
 * Flat index encoding (column-major within the visualization array):
 *   index = i * (CAPACITY + 1) + w
 * where i is the item index (0-based) and w is the weight capacity.
 *
 * Steps produced:
 *   - compare  → evaluating whether to include or exclude the current item
 *   - swap     → writing a new (improved) value into a DP table cell
 *   - sorted   → a DP cell has been finalised (no change or cell locked in)
 *   - done     → the full DP table is built
 */
export function generateKnapsackSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  // Derive a small item set from `arr` so the table stays manageable
  const MAX_ITEMS = 5;
  const CAPACITY = 6;

  const raw = arr.slice(0, Math.min(MAX_ITEMS, arr.length));
  const numItems = raw.length;

  if (numItems === 0) {
    steps.push({ type: 'done', indices: [], description: 'No items — DP table is empty' });
    return steps;
  }

  // Map float values → integer weights [1, CAPACITY] and profits [1, 10]
  const weights = raw.map((v) => Math.max(1, Math.round(v * CAPACITY)));
  const profits = raw.map((v) => Math.max(1, Math.round(v * 10)));

  const W = CAPACITY + 1; // number of weight columns (0 … CAPACITY)

  // dp[i][w]: max value using items 0..i-1 with capacity w (i=0 is empty row)
  const dp: number[][] = Array.from({ length: numItems + 1 }, () =>
    new Array<number>(W).fill(0),
  );

  const flatIdx = (i: number, w: number) => i * W + w;

  // Mark the base row (i=0, all zeros) as settled immediately
  for (let w = 0; w < W; w++) {
    steps.push({
      type: 'sorted',
      indices: [flatIdx(0, w)],
      description: `Base case: dp[0][${w}] = 0 (no items → zero value)`,
    });
  }

  // ── Fill the DP table row by row ───────────────────────────────────────
  for (let i = 1; i <= numItems; i++) {
    const itemIdx = i - 1; // 0-based index into weights/profits
    const wi = weights[itemIdx];
    const pi = profits[itemIdx];

    for (let w = 0; w < W; w++) {
      // Evaluate the EXCLUDE option
      const exclude = dp[i - 1][w];

      steps.push({
        type: 'compare',
        indices: [flatIdx(i, w), flatIdx(i - 1, w)],
        description: `Item ${i} (weight=${wi}, profit=${pi}): exclude → dp[${i}][${w}] = dp[${i - 1}][${w}] = ${exclude}`,
      });

      let best = exclude;

      if (wi <= w) {
        // Evaluate the INCLUDE option
        const include = dp[i - 1][w - wi] + pi;

        steps.push({
          type: 'compare',
          indices: [flatIdx(i, w), flatIdx(i - 1, w - wi)],
          description: `Item ${i}: include → dp[${i - 1}][${w - wi}] + ${pi} = ${include}; exclude = ${exclude}`,
        });

        if (include > exclude) {
          best = include;
          steps.push({
            type: 'swap',
            indices: [flatIdx(i, w)],
            description: `Choosing INCLUDE for item ${i} at capacity ${w}: dp[${i}][${w}] = ${best}`,
          });
        } else {
          steps.push({
            type: 'compare',
            indices: [flatIdx(i, w)],
            description: `Choosing EXCLUDE for item ${i} at capacity ${w}: ${exclude} ≥ ${include}`,
          });
        }
      }

      dp[i][w] = best;

      steps.push({
        type: 'sorted',
        indices: [flatIdx(i, w)],
        description: `dp[${i}][${w}] = ${best} (finalised)`,
      });
    }
  }

  const optimal = dp[numItems][CAPACITY];

  steps.push({
    type: 'done',
    indices: [],
    description: `0/1 Knapsack complete — optimal value for capacity ${CAPACITY} is ${optimal}`,
  });

  return steps;
}
