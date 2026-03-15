import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Insertion Sort.
 *
 * Steps produced:
 *   - compare  → current element is compared against the element to its left
 *   - swap     → element shifts one position right to make room for insertion
 *   - sorted   → current element has been placed in its correct position
 *   - done     → the entire array is sorted
 */
export function generateInsertionSortSteps(arr: number[]): AnimationStep[] {
  if (arr.length === 0) {
    return [{ type: 'done', indices: [], description: 'Empty array — nothing to sort.' }];
  }

  const steps: AnimationStep[] = [];
  const a = [...arr];
  const n = a.length;

  // Index 0 is trivially sorted; start inserting from index 1
  steps.push({
    type: 'sorted',
    indices: [0],
    description: `Element at position 0 (${Math.round(a[0] * 100)}) is the initial sorted portion`,
  });

  for (let i = 1; i < n; i++) {
    let j = i;

    // Compare the new element against the sorted portion to its left
    steps.push({
      type: 'compare',
      indices: [j, j - 1],
      description: `Inserting a[${i}] (${Math.round(a[i] * 100)}) — comparing with a[${j - 1}] (${Math.round(a[j - 1] * 100)})`,
    });

    while (j > 0 && a[j - 1] > a[j]) {
      // Shift a[j-1] one position right
      steps.push({
        type: 'swap',
        indices: [j - 1, j],
        values: [a[j], a[j - 1]], // values after shift
        description: `a[${j - 1}] (${Math.round(a[j - 1] * 100)}) > a[${j}] (${Math.round(a[j] * 100)}) — shifting right`,
      });
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      j--;

      if (j > 0) {
        // Continue scanning left
        steps.push({
          type: 'compare',
          indices: [j, j - 1],
          description: `Still inserting ${Math.round(a[j] * 100)} — comparing with a[${j - 1}] (${Math.round(a[j - 1] * 100)})`,
        });
      }
    }

    // Element has reached its correct insertion position
    steps.push({
      type: 'sorted',
      indices: [j],
      description: `a[${j}] (${Math.round(a[j] * 100)}) is now in its correct position; sorted portion is indices 0–${i}`,
    });
  }

  // Signal completion
  steps.push({
    type: 'done',
    indices: [],
    description: 'Array is fully sorted!',
  });

  return steps;
}
