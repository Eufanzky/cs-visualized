import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Binary Search.
 *
 * The function builds its own sorted array internally and picks a random
 * target so that the caller can pass any placeholder array.
 *
 * Steps produced:
 *   - compare  → the mid element is highlighted and compared to the target
 *   - sorted   → a half of the search space has been eliminated (marked done)
 *   - done     → the target was found (or confirmed absent)
 */
export function generateBinarySearchSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const n = arr.length;

  // Build a sorted array from 1..n (normalised to 0–1 range for rendering)
  const sorted: number[] = Array.from({ length: n }, (_, i) => (i + 1) / n);

  // Pick a random target that exists in the array
  const targetIndex = Math.floor(Math.random() * n);
  const target = sorted[targetIndex];
  const targetDisplay = Math.round(target * 100);

  let left = 0;
  let right = n - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = sorted[mid];
    const midDisplay = Math.round(midVal * 100);

    // Highlight the current search window (left..right) as "comparing"
    const windowIndices: number[] = [];
    for (let i = left; i <= right; i++) windowIndices.push(i);

    // Compare step — focus on the mid pointer
    steps.push({
      type: 'compare',
      indices: [mid],
      description: `Checking middle element a[${mid}] = ${midDisplay} against target ${targetDisplay}`,
    });

    if (midVal === target) {
      // Found — mark the target index as sorted (found)
      steps.push({
        type: 'sorted',
        indices: [mid],
        description: `Found target ${targetDisplay} at index ${mid}!`,
      });
      break;
    } else if (midVal < target) {
      // Eliminate left half (indices left..mid)
      const eliminated: number[] = [];
      for (let i = left; i <= mid; i++) eliminated.push(i);

      steps.push({
        type: 'sorted',
        indices: eliminated,
        description: `${midDisplay} < ${targetDisplay} — eliminating left half (indices ${left}–${mid})`,
      });
      left = mid + 1;
    } else {
      // Eliminate right half (indices mid..right)
      const eliminated: number[] = [];
      for (let i = mid; i <= right; i++) eliminated.push(i);

      steps.push({
        type: 'sorted',
        indices: eliminated,
        description: `${midDisplay} > ${targetDisplay} — eliminating right half (indices ${mid}–${right})`,
      });
      right = mid - 1;
    }
  }

  if (left > right) {
    // Target not found (shouldn't happen since we picked a valid target, but
    // guard for edge cases)
    steps.push({
      type: 'done',
      indices: [],
      description: `Target ${targetDisplay} not found in array`,
    });
  } else {
    steps.push({
      type: 'done',
      indices: [],
      description: `Binary search complete — target ${targetDisplay} found!`,
    });
  }

  return steps;
}
