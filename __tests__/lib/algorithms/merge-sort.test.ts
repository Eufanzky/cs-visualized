import { generateMergeSortSteps } from '@/lib/algorithms/merge-sort';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Returns true if the array is non-decreasing. */
function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

/**
 * Re-apply merge sort's swap steps to recover the final array state.
 *
 * The merge sort algorithm uses a non-standard "swap" step: it writes one
 * specific value (step.values[0]) into position step.indices[0], rather than
 * performing a classical two-way index swap.  We simulate this here so we can
 * verify correctness without going through the generic animation engine.
 */
function replayToSortedArray(original: number[]): number[] {
  const steps = generateMergeSortSteps(original);
  const arr = [...original];
  for (const step of steps) {
    if (step.type === 'swap' && step.values !== undefined) {
      // step.indices[0] is the destination; step.values[0] is the placed value
      arr[step.indices[0]] = step.values[0];
    }
  }
  return arr;
}

// ── basic structure ──────────────────────────────────────────────────────────

describe('generateMergeSortSteps — basic structure', () => {
  it('generates at least one step for a multi-element array', () => {
    const steps = generateMergeSortSteps([0.5, 0.2, 0.8]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('the last step is done', () => {
    const steps = generateMergeSortSteps([0.5, 0.2, 0.8]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('every step has a non-empty description string', () => {
    const steps = generateMergeSortSteps([0.3, 0.1, 0.5, 0.2]);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('every step has an indices array', () => {
    const steps = generateMergeSortSteps([0.3, 0.1, 0.5]);
    for (const step of steps) {
      expect(Array.isArray(step.indices)).toBe(true);
    }
  });

  it('contains compare steps for a multi-element array', () => {
    const steps = generateMergeSortSteps([0.5, 0.2, 0.8]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps.length).toBeGreaterThan(0);
  });
});

// ── correctness: replaying swap steps produces a sorted array ────────────────

describe('generateMergeSortSteps — sorting correctness', () => {
  it('results in a sorted array for a random-order input', () => {
    expect(isSorted(replayToSortedArray([0.5, 0.2, 0.8, 0.1, 0.9, 0.3]))).toBe(true);
  });

  it('results in a sorted array for a reverse-sorted input', () => {
    expect(isSorted(replayToSortedArray([0.9, 0.7, 0.5, 0.3, 0.1]))).toBe(true);
  });

  it('results in a sorted array for an already-sorted input', () => {
    expect(isSorted(replayToSortedArray([0.1, 0.3, 0.5, 0.7, 0.9]))).toBe(true);
  });

  it('results in a sorted array for a single-element input', () => {
    expect(isSorted(replayToSortedArray([0.42]))).toBe(true);
  });

  it('results in a sorted array for a medium-size input', () => {
    expect(
      isSorted(replayToSortedArray([0.6, 0.1, 0.4, 0.9, 0.2, 0.7, 0.3, 0.8, 0.5])),
    ).toBe(true);
  });
});

// ── single-element edge case ─────────────────────────────────────────────────

describe('generateMergeSortSteps — single element', () => {
  it('generates steps (at least the done step)', () => {
    const steps = generateMergeSortSteps([0.5]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('last step is done for a single-element array', () => {
    const steps = generateMergeSortSteps([0.5]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('generates no compare steps for a single-element array', () => {
    const steps = generateMergeSortSteps([0.5]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps).toHaveLength(0);
  });
});

// ── two-element array ─────────────────────────────────────────────────────────

describe('generateMergeSortSteps — two elements', () => {
  it('generates steps for a two-element array', () => {
    const steps = generateMergeSortSteps([0.8, 0.2]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('ends with done for a two-element array', () => {
    const steps = generateMergeSortSteps([0.8, 0.2]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('produces a compare step for a two-element array', () => {
    const steps = generateMergeSortSteps([0.8, 0.2]);
    expect(steps.some((s) => s.type === 'compare')).toBe(true);
  });

  it('results in a sorted two-element array', () => {
    expect(isSorted(replayToSortedArray([0.8, 0.2]))).toBe(true);
  });
});

// ── step type validity ───────────────────────────────────────────────────────

describe('generateMergeSortSteps — step type validity', () => {
  const validTypes = new Set(['compare', 'swap', 'sorted', 'done']);

  it('all step types are valid AnimationStep types', () => {
    const arr = [0.5, 0.2, 0.8, 0.1];
    const steps = generateMergeSortSteps(arr);
    for (const step of steps) {
      expect(validTypes.has(step.type)).toBe(true);
    }
  });

  it('done appears exactly once and is the last step', () => {
    const arr = [0.4, 0.1, 0.7, 0.2];
    const steps = generateMergeSortSteps(arr);
    const doneSteps = steps.filter((s) => s.type === 'done');
    expect(doneSteps).toHaveLength(1);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('all step indices are valid array positions', () => {
    const arr = [0.5, 0.2, 0.8, 0.1];
    const steps = generateMergeSortSteps(arr);
    for (const step of steps) {
      for (const idx of step.indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(arr.length);
      }
    }
  });

  it('swap steps carry a values array', () => {
    const arr = [0.8, 0.2, 0.6, 0.4];
    const steps = generateMergeSortSteps(arr);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    for (const step of swapSteps) {
      expect(Array.isArray(step.values)).toBe(true);
    }
  });
});
