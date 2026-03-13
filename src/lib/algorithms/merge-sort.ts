import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Merge Sort.
 *
 * The algorithm works on a flat array throughout; all "sub-array" splitting is
 * tracked via index bounds so the canvas can highlight the active window.
 *
 * Steps produced:
 *   - compare  → two elements from left and right halves are compared during merge
 *   - swap     → an element is placed into the merged output at a position
 *                (represented as a swap between the destination and source index)
 *   - sorted   → a subarray has been fully merged and those indices are in order
 *   - done     → the entire array is sorted
 */
export function generateMergeSortSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const a = [...arr];

  mergeSort(a, 0, a.length - 1, steps);

  steps.push({
    type: 'done',
    indices: [],
    description: 'Array is fully sorted!',
  });

  return steps;
}

// ── Recursive helpers ──────────────────────────────────────────────────────

function mergeSort(
  a: number[],
  left: number,
  right: number,
  steps: AnimationStep[],
): void {
  if (left >= right) {
    // Single-element subarrays are trivially sorted
    steps.push({
      type: 'sorted',
      indices: [left],
      description: `Subarray [${left}..${right}] has a single element (${Math.round(a[left] * 100)}) — already sorted`,
    });
    return;
  }

  const mid = Math.floor((left + right) / 2);

  // Divide — recurse left then right
  mergeSort(a, left, mid, steps);
  mergeSort(a, mid + 1, right, steps);

  // Conquer — merge the two sorted halves
  merge(a, left, mid, right, steps);
}

function merge(
  a: number[],
  left: number,
  mid: number,
  right: number,
  steps: AnimationStep[],
): void {
  // Copy both halves into temporary buffers
  const leftHalf = a.slice(left, mid + 1);
  const rightHalf = a.slice(mid + 1, right + 1);

  let i = 0; // pointer into leftHalf
  let j = 0; // pointer into rightHalf
  let k = left; // write position in a

  const leftRange = `[${left}..${mid}]`;
  const rightRange = `[${mid + 1}..${right}]`;

  while (i < leftHalf.length && j < rightHalf.length) {
    const li = left + i;   // original index of leftHalf[i]
    const rj = mid + 1 + j; // original index of rightHalf[j]

    // Highlight the two candidates being compared
    steps.push({
      type: 'compare',
      indices: [li, rj],
      description: `Merging ${leftRange} and ${rightRange}: comparing ${Math.round(leftHalf[i] * 100)} (left) vs ${Math.round(rightHalf[j] * 100)} (right)`,
    });

    if (leftHalf[i] <= rightHalf[j]) {
      if (k !== li) {
        // Place leftHalf[i] at position k
        steps.push({
          type: 'swap',
          indices: [k, li],
          values: [leftHalf[i], a[k]],
          description: `${Math.round(leftHalf[i] * 100)} ≤ ${Math.round(rightHalf[j] * 100)} — placing ${Math.round(leftHalf[i] * 100)} from left half at position ${k}`,
        });
        // Reflect in working array
        a[k] = leftHalf[i];
      }
      i++;
    } else {
      // Place rightHalf[j] at position k
      steps.push({
        type: 'swap',
        indices: [k, rj],
        values: [rightHalf[j], a[k]],
        description: `${Math.round(rightHalf[j] * 100)} < ${Math.round(leftHalf[i] * 100)} — placing ${Math.round(rightHalf[j] * 100)} from right half at position ${k}`,
      });
      a[k] = rightHalf[j];
      j++;
    }

    k++;
  }

  // Drain remaining elements from left half
  while (i < leftHalf.length) {
    if (k !== left + i) {
      steps.push({
        type: 'swap',
        indices: [k, left + i],
        values: [leftHalf[i], a[k]],
        description: `Draining left half ${leftRange}: placing ${Math.round(leftHalf[i] * 100)} at position ${k}`,
      });
      a[k] = leftHalf[i];
    }
    i++;
    k++;
  }

  // Drain remaining elements from right half
  while (j < rightHalf.length) {
    const rj = mid + 1 + j;
    if (k !== rj) {
      steps.push({
        type: 'swap',
        indices: [k, rj],
        values: [rightHalf[j], a[k]],
        description: `Draining right half ${rightRange}: placing ${Math.round(rightHalf[j] * 100)} at position ${k}`,
      });
      a[k] = rightHalf[j];
    }
    j++;
    k++;
  }

  // Mark the fully merged subarray as sorted
  const mergedIndices: number[] = [];
  for (let idx = left; idx <= right; idx++) {
    mergedIndices.push(idx);
  }
  steps.push({
    type: 'sorted',
    indices: mergedIndices,
    description: `Merged ${leftRange} and ${rightRange} into sorted subarray [${left}..${right}]`,
  });
}
