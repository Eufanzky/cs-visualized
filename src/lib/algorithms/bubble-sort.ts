import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Bubble Sort.
 *
 * Steps produced:
 *   - compare  → two adjacent elements are highlighted for comparison
 *   - swap     → the two elements are out-of-order and get swapped
 *   - sorted   → an element has reached its final, sorted position
 *   - done     → the entire array is sorted
 */
export function generateBubbleSortSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const a = [...arr];
  const n = a.length;

  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;

    for (let j = 0; j < n - 1 - pass; j++) {
      // Compare adjacent elements
      steps.push({
        type: 'compare',
        indices: [j, j + 1],
        description: `Pass ${pass + 1}: comparing a[${j}] (${Math.round(a[j] * 100)}) with a[${j + 1}] (${Math.round(a[j + 1] * 100)})`,
      });

      if (a[j] > a[j + 1]) {
        // Swap them
        steps.push({
          type: 'swap',
          indices: [j, j + 1],
          values: [a[j + 1], a[j]], // values after swap
          description: `a[${j}] > a[${j + 1}] — swapping ${Math.round(a[j] * 100)} ↔ ${Math.round(a[j + 1] * 100)}`,
        });
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }

    // The element that "bubbled up" is now in its final position
    steps.push({
      type: 'sorted',
      indices: [n - 1 - pass],
      description: `Element at position ${n - 1 - pass} (${Math.round(a[n - 1 - pass] * 100)}) is in its final position`,
    });

    // Early exit optimisation — if no swaps occurred this pass, everything
    // remaining is already sorted.
    if (!swapped) {
      const remainingIndices: number[] = [];
      for (let k = 0; k < n - 1 - pass; k++) {
        remainingIndices.push(k);
      }
      if (remainingIndices.length > 0) {
        steps.push({
          type: 'sorted',
          indices: remainingIndices,
          description: `No swaps in pass ${pass + 1} — remaining elements are already sorted`,
        });
      }
      break;
    }
  }

  // Ensure index 0 is always marked sorted
  steps.push({
    type: 'sorted',
    indices: [0],
    description: 'First element is in its final position',
  });

  // Signal completion
  steps.push({
    type: 'done',
    indices: [],
    description: 'Array is fully sorted!',
  });

  return steps;
}
