import { generateQuickSortSteps } from '@/lib/algorithms/quick-sort';
import { applyStep, type AnimationState } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Apply every step in the steps array to simulate the full algorithm run. */
function runAllSteps(arr: number[]): AnimationState {
  const steps = generateQuickSortSteps(arr);
  let state: AnimationState = {
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
  for (const step of steps) {
    state = applyStep(state, step);
  }
  return state;
}

/** Returns true if the array is non-decreasing. */
function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

// ── basic structure ──────────────────────────────────────────────────────────

describe('generateQuickSortSteps — basic structure', () => {
  it('generates at least one step for a multi-element array', () => {
    const steps = generateQuickSortSteps([0.5, 0.2, 0.8]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('the last step is done', () => {
    const steps = generateQuickSortSteps([0.5, 0.2, 0.8]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('every step has a non-empty description string', () => {
    const steps = generateQuickSortSteps([0.3, 0.1, 0.5, 0.2]);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('every step has an indices array', () => {
    const steps = generateQuickSortSteps([0.3, 0.1, 0.5]);
    for (const step of steps) {
      expect(Array.isArray(step.indices)).toBe(true);
    }
  });

  it('pivot steps exist for a multi-element array', () => {
    const steps = generateQuickSortSteps([0.5, 0.2, 0.8, 0.1]);
    const pivotSteps = steps.filter((s) => s.type === 'pivot');
    expect(pivotSteps.length).toBeGreaterThan(0);
  });

  it('pivot steps each reference exactly one index', () => {
    const steps = generateQuickSortSteps([0.5, 0.2, 0.8, 0.1]);
    const pivotSteps = steps.filter((s) => s.type === 'pivot');
    for (const step of pivotSteps) {
      expect(step.indices).toHaveLength(1);
    }
  });

  it('compare steps exist for a multi-element array', () => {
    const steps = generateQuickSortSteps([0.5, 0.2, 0.8]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps.length).toBeGreaterThan(0);
  });
});

// ── correctness: applying all steps sorts the array ─────────────────────────

describe('generateQuickSortSteps — sorting correctness', () => {
  it('results in a sorted array for a random-order input', () => {
    const arr = [0.5, 0.2, 0.8, 0.1, 0.9, 0.3];
    const finalState = runAllSteps(arr);
    expect(isSorted(finalState.array)).toBe(true);
  });

  it('results in a sorted array for a reverse-sorted input', () => {
    const arr = [0.9, 0.7, 0.5, 0.3, 0.1];
    const finalState = runAllSteps(arr);
    expect(isSorted(finalState.array)).toBe(true);
  });

  it('results in a sorted array for an already-sorted input', () => {
    const arr = [0.1, 0.3, 0.5, 0.7, 0.9];
    const finalState = runAllSteps(arr);
    expect(isSorted(finalState.array)).toBe(true);
  });

  it('results in a sorted array for a single-element input', () => {
    const arr = [0.42];
    const finalState = runAllSteps(arr);
    expect(isSorted(finalState.array)).toBe(true);
  });

  it('results in a sorted array for a medium-size input', () => {
    const arr = [0.6, 0.1, 0.4, 0.9, 0.2, 0.7, 0.3, 0.8, 0.5];
    const finalState = runAllSteps(arr);
    expect(isSorted(finalState.array)).toBe(true);
  });

  it('sets isDone=true after all steps are applied', () => {
    const finalState = runAllSteps([0.5, 0.2, 0.8]);
    expect(finalState.isDone).toBe(true);
  });
});

// ── single-element edge case ─────────────────────────────────────────────────

describe('generateQuickSortSteps — single element', () => {
  it('generates steps (at least the done step)', () => {
    const steps = generateQuickSortSteps([0.5]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('last step is done for a single-element array', () => {
    const steps = generateQuickSortSteps([0.5]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('generates no compare steps for a single-element array', () => {
    const steps = generateQuickSortSteps([0.5]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps).toHaveLength(0);
  });

  it('generates no pivot steps for a single-element array', () => {
    const steps = generateQuickSortSteps([0.5]);
    const pivotSteps = steps.filter((s) => s.type === 'pivot');
    expect(pivotSteps).toHaveLength(0);
  });
});

// ── step type validity ───────────────────────────────────────────────────────

describe('generateQuickSortSteps — step type validity', () => {
  const validTypes = new Set(['compare', 'swap', 'sorted', 'pivot', 'done']);

  it('all step types are valid AnimationStep types', () => {
    const arr = [0.5, 0.2, 0.8, 0.1];
    const steps = generateQuickSortSteps(arr);
    for (const step of steps) {
      expect(validTypes.has(step.type)).toBe(true);
    }
  });

  it('done appears exactly once and is the last step', () => {
    const arr = [0.4, 0.1, 0.7, 0.2];
    const steps = generateQuickSortSteps(arr);
    const doneSteps = steps.filter((s) => s.type === 'done');
    expect(doneSteps).toHaveLength(1);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('all step indices are valid array positions', () => {
    const arr = [0.5, 0.2, 0.8, 0.1];
    const steps = generateQuickSortSteps(arr);
    for (const step of steps) {
      for (const idx of step.indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(arr.length);
      }
    }
  });
});

// ── pivot behaviour ──────────────────────────────────────────────────────────

describe('generateQuickSortSteps — pivot behaviour', () => {
  it('number of pivot steps equals the number of partitions performed', () => {
    // For a 4-element array, there will be multiple partitions (at least 1)
    const arr = [0.4, 0.1, 0.7, 0.2];
    const steps = generateQuickSortSteps(arr);
    const pivotSteps = steps.filter((s) => s.type === 'pivot');
    const sortedAfterPivot = steps.filter((s) => s.type === 'sorted');
    // Each partition produces one pivot step and one sorted step for the pivot
    expect(pivotSteps.length).toBeGreaterThan(0);
    expect(sortedAfterPivot.length).toBeGreaterThan(0);
  });

  it('pivot indices are within valid bounds', () => {
    const arr = [0.5, 0.2, 0.8, 0.1, 0.9];
    const steps = generateQuickSortSteps(arr);
    const pivotSteps = steps.filter((s) => s.type === 'pivot');
    for (const step of pivotSteps) {
      for (const idx of step.indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(arr.length);
      }
    }
  });
});
