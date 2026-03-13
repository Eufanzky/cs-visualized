import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Quick Sort.
 *
 * Uses the last element of each subarray as the pivot (Lomuto partition scheme).
 *
 * Steps produced:
 *   - pivot    → pivot element is selected and highlighted
 *   - compare  → an element is compared against the pivot during partitioning
 *   - swap     → two elements are exchanged as part of the partition process
 *   - sorted   → the pivot has been placed in its final position
 *   - done     → the entire array is sorted
 */
export function generateQuickSortSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const a = [...arr];

  quickSort(a, 0, a.length - 1, steps);

  steps.push({
    type: 'done',
    indices: [],
    description: 'Array is fully sorted!',
  });

  return steps;
}

// ── Recursive helpers ──────────────────────────────────────────────────────

function quickSort(
  a: number[],
  low: number,
  high: number,
  steps: AnimationStep[],
): void {
  if (low >= high) {
    if (low === high) {
      steps.push({
        type: 'sorted',
        indices: [low],
        description: `Single element at position ${low} (${Math.round(a[low] * 100)}) is trivially sorted`,
      });
    }
    return;
  }

  const pivotIndex = partition(a, low, high, steps);
  quickSort(a, low, pivotIndex - 1, steps);
  quickSort(a, pivotIndex + 1, high, steps);
}

/**
 * Lomuto partition: pivot = a[high].
 * Returns the final index of the pivot after partitioning.
 */
function partition(
  a: number[],
  low: number,
  high: number,
  steps: AnimationStep[],
): number {
  const pivotValue = a[high];
  const rangeStr = `[${low}..${high}]`;

  // Announce pivot selection
  steps.push({
    type: 'pivot' as AnimationStep['type'],
    indices: [high],
    description: `Pivot selected: ${Math.round(pivotValue * 100)} at index ${high} (partitioning subarray ${rangeStr})`,
  });

  let i = low - 1; // boundary of the "less than pivot" region

  for (let j = low; j < high; j++) {
    // Compare each element with the pivot
    steps.push({
      type: 'compare',
      indices: [j, high],
      description: `Partitioning ${rangeStr}: comparing a[${j}] (${Math.round(a[j] * 100)}) with pivot ${Math.round(pivotValue * 100)}`,
    });

    if (a[j] <= pivotValue) {
      i++;
      if (i !== j) {
        // Swap a[i] and a[j] to grow the left partition
        steps.push({
          type: 'swap',
          indices: [i, j],
          values: [a[j], a[i]], // values after swap
          description: `a[${j}] (${Math.round(a[j] * 100)}) ≤ pivot ${Math.round(pivotValue * 100)} — swapping a[${i}] and a[${j}]`,
        });
        [a[i], a[j]] = [a[j], a[i]];
      }
    }
  }

  // Place pivot in its final position
  const pivotFinalIndex = i + 1;
  if (pivotFinalIndex !== high) {
    steps.push({
      type: 'swap',
      indices: [pivotFinalIndex, high],
      values: [a[high], a[pivotFinalIndex]], // values after swap
      description: `Placing pivot ${Math.round(pivotValue * 100)} at its final position ${pivotFinalIndex}`,
    });
    [a[pivotFinalIndex], a[high]] = [a[high], a[pivotFinalIndex]];
  }

  // Pivot is now in its correct sorted position
  steps.push({
    type: 'sorted',
    indices: [pivotFinalIndex],
    description: `Pivot ${Math.round(pivotValue * 100)} is now at its final position ${pivotFinalIndex}`,
  });

  return pivotFinalIndex;
}
