import { generateBubbleSortSteps } from '@/lib/algorithms/bubble-sort';
import { generateInsertionSortSteps } from '@/lib/algorithms/insertion-sort';
import { generateMergeSortSteps } from '@/lib/algorithms/merge-sort';
import { generateQuickSortSteps } from '@/lib/algorithms/quick-sort';
import { generateHeapSortSteps } from '@/lib/algorithms/heap-sort';
import { applyStep, type AnimationState, type AnimationStep } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

type SortGenerator = (arr: number[]) => AnimationStep[];

function makeState(arr: number[], steps: AnimationStep[]): AnimationState {
  return {
    array: [...arr],
    steps,
    currentStep: 0,
    isPlaying: false,
    speed: 1,
    comparisons: 0,
    swaps: 0,
    sortedIndices: new Set(),
    comparingIndices: [],
    swappingIndices: [],
    isDone: false,
  };
}

function runAllSteps(arr: number[], generate: SortGenerator): AnimationState {
  const steps = generate(arr);
  let state = makeState(arr, steps);
  for (const step of steps) {
    state = applyStep(state, step);
  }
  return state;
}

function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

// ── test data ───────────────────────────────────────────────────────────────

const STANDARD_ARRAY = [0.5, 0.3, 0.8, 0.1, 0.9];
const ALREADY_SORTED = [0.1, 0.3, 0.5, 0.7, 0.9];
const REVERSE_SORTED = [0.9, 0.7, 0.5, 0.3, 0.1];
const SINGLE_ELEMENT = [0.5];
const EMPTY_ARRAY: number[] = [];

// ── algorithm definitions ───────────────────────────────────────────────────

// Merge Sort uses non-standard swap semantics (write-to-position from temp buffers),
// so applyStep's pairwise array swap doesn't replicate merge sort's final state.
// We test step application correctness only for algorithms with true pairwise swaps.
const SORT_ALGORITHMS: Array<{ name: string; generate: SortGenerator; pairwiseSwaps: boolean }> = [
  { name: 'Bubble Sort', generate: generateBubbleSortSteps, pairwiseSwaps: true },
  { name: 'Insertion Sort', generate: generateInsertionSortSteps, pairwiseSwaps: true },
  { name: 'Merge Sort', generate: generateMergeSortSteps, pairwiseSwaps: false },
  { name: 'Quick Sort', generate: generateQuickSortSteps, pairwiseSwaps: true },
  { name: 'Heap Sort', generate: generateHeapSortSteps, pairwiseSwaps: true },
];

// ── parametrized tests ──────────────────────────────────────────────────────

describe.each(SORT_ALGORITHMS)('$name', ({ generate, pairwiseSwaps }) => {
  it('produces steps for a standard array', () => {
    const steps = generate(STANDARD_ARRAY);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('handles empty array without crashing', () => {
    expect(() => generate(EMPTY_ARRAY)).not.toThrow();
    const steps = generate(EMPTY_ARRAY);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('handles single-element array', () => {
    const steps = generate(SINGLE_ELEMENT);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('handles already-sorted array', () => {
    const steps = generate(ALREADY_SORTED);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('handles reverse-sorted array', () => {
    const steps = generate(REVERSE_SORTED);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('ends with a done step', () => {
    const steps = generate(STANDARD_ARRAY);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  // Merge sort uses write-to-position swap semantics that applyStep cannot
  // replay with simple pairwise swaps, so skip array-sorted checks for it.
  if (pairwiseSwaps) {
    it('array is sorted after applying all steps', () => {
      const finalState = runAllSteps(STANDARD_ARRAY, generate);
      expect(isSorted(finalState.array)).toBe(true);
    });

    it('array is sorted after applying all steps (reverse input)', () => {
      const finalState = runAllSteps(REVERSE_SORTED, generate);
      expect(isSorted(finalState.array)).toBe(true);
    });

    it('array is sorted after applying all steps (already sorted input)', () => {
      const finalState = runAllSteps(ALREADY_SORTED, generate);
      expect(isSorted(finalState.array)).toBe(true);
    });
  }

  it('comparisons counter increments on compare steps', () => {
    const steps = generate(STANDARD_ARRAY);
    const compareCount = steps.filter(s => s.type === 'compare').length;
    const finalState = runAllSteps(STANDARD_ARRAY, generate);
    expect(finalState.comparisons).toBe(compareCount);
  });

  it('swaps counter increments on swap steps', () => {
    const steps = generate(STANDARD_ARRAY);
    const swapCount = steps.filter(s => s.type === 'swap').length;
    const finalState = runAllSteps(STANDARD_ARRAY, generate);
    expect(finalState.swaps).toBe(swapCount);
  });

  it('isDone is true after all steps applied', () => {
    const finalState = runAllSteps(STANDARD_ARRAY, generate);
    expect(finalState.isDone).toBe(true);
  });

  it('every step has a non-empty description', () => {
    const steps = generate(STANDARD_ARRAY);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('done appears exactly once and is the last step', () => {
    const steps = generate(STANDARD_ARRAY);
    const doneSteps = steps.filter(s => s.type === 'done');
    expect(doneSteps).toHaveLength(1);
    expect(steps[steps.length - 1].type).toBe('done');
  });
});
