import type { AnimationStep } from '../animation-engine';

/**
 * Generates the full ordered list of AnimationSteps for Heap Sort.
 *
 * The algorithm proceeds in two phases:
 *   1. Build — transform the input array into a max-heap (bottom-up heapify)
 *   2. Extract — repeatedly swap the max (root) to the end and sift down
 *
 * Steps produced:
 *   - compare  → two nodes in the heap are being compared (parent vs child)
 *   - swap     → a parent/child pair is swapped during heapify
 *   - sorted   → an element has been extracted to its final sorted position
 *   - done     → the entire array is sorted
 */
export function generateHeapSortSteps(arr: number[]): AnimationStep[] {
  if (arr.length === 0) {
    return [{ type: 'done', indices: [], description: 'Empty array — nothing to sort.' }];
  }

  const steps: AnimationStep[] = [];
  const a = [...arr];
  const n = a.length;
  const fmt = (v: number) => Math.round(v * 100).toString();

  /**
   * Sift-down (max-heapify) the element at position `i` within the sub-array
   * bounded by `heapSize`.  Emits compare/swap steps as it runs.
   */
  function heapify(heapSize: number, i: number): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    // Compare with left child
    if (left < heapSize) {
      steps.push({
        type: 'compare',
        indices: [largest, left],
        description: `Heapify: comparing node[${largest}] (${fmt(a[largest])}) with left child[${left}] (${fmt(a[left])})`,
      });
      if (a[left] > a[largest]) {
        largest = left;
      }
    }

    // Compare with right child
    if (right < heapSize) {
      steps.push({
        type: 'compare',
        indices: [largest, right],
        description: `Heapify: comparing current largest[${largest}] (${fmt(a[largest])}) with right child[${right}] (${fmt(a[right])})`,
      });
      if (a[right] > a[largest]) {
        largest = right;
      }
    }

    // If the largest is not the root, swap and continue sifting
    if (largest !== i) {
      steps.push({
        type: 'swap',
        indices: [i, largest],
        values: [a[largest], a[i]],
        description: `Heapify: swapping node[${i}] (${fmt(a[i])}) with largest child[${largest}] (${fmt(a[largest])})`,
      });
      [a[i], a[largest]] = [a[largest], a[i]];
      heapify(heapSize, largest);
    }
  }

  // ── Phase 1: Build max-heap (bottom-up) ───────────────────────────────
  const lastInternal = Math.floor(n / 2) - 1;
  for (let i = lastInternal; i >= 0; i--) {
    steps.push({
      type: 'compare',
      indices: [i],
      description: `Build max-heap: heapifying subtree rooted at index ${i} (value ${fmt(a[i])})`,
    });
    heapify(n, i);
  }

  // ── Phase 2: Extract max elements one by one ──────────────────────────
  for (let end = n - 1; end > 0; end--) {
    // The root (index 0) holds the current maximum — swap it to the end
    steps.push({
      type: 'compare',
      indices: [0, end],
      description: `Extract: root (max = ${fmt(a[0])}) will be swapped with last heap element[${end}] (${fmt(a[end])})`,
    });
    steps.push({
      type: 'swap',
      indices: [0, end],
      values: [a[end], a[0]],
      description: `Swapping root ${fmt(a[0])} with position ${end} (${fmt(a[end])})`,
    });
    [a[0], a[end]] = [a[end], a[0]];

    // Mark the extracted element as sorted
    steps.push({
      type: 'sorted',
      indices: [end],
      description: `${fmt(a[end])} is now in its final sorted position at index ${end}`,
    });

    // Restore the heap property for the reduced heap
    heapify(end, 0);
  }

  // The last remaining element (index 0) is trivially in its sorted position
  steps.push({
    type: 'sorted',
    indices: [0],
    description: `${fmt(a[0])} is in its final sorted position at index 0`,
  });

  steps.push({
    type: 'done',
    indices: [],
    description: 'Array is fully sorted by Heap Sort!',
  });

  return steps;
}
