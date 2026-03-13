import { generateBubbleSortSteps } from '@/lib/algorithms/bubble-sort';
import { applyStep, type AnimationState } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Apply every step in the steps array to simulate the full algorithm run. */
function runAllSteps(arr: number[]): AnimationState {
  const steps = generateBubbleSortSteps(arr);
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

describe('generateBubbleSortSteps — basic structure', () => {
  it('generates at least one step for a multi-element array', () => {
    const steps = generateBubbleSortSteps([0.5, 0.2, 0.8]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('the first step is a compare', () => {
    const steps = generateBubbleSortSteps([0.5, 0.2, 0.8]);
    expect(steps[0].type).toBe('compare');
  });

  it('the last step is done', () => {
    const steps = generateBubbleSortSteps([0.5, 0.2, 0.8]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('every step has a non-empty description string', () => {
    const steps = generateBubbleSortSteps([0.3, 0.1, 0.5, 0.2]);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('every step has an indices array', () => {
    const steps = generateBubbleSortSteps([0.3, 0.1, 0.5]);
    for (const step of steps) {
      expect(Array.isArray(step.indices)).toBe(true);
    }
  });
});

// ── correctness: applying all steps sorts the array ─────────────────────────

describe('generateBubbleSortSteps — sorting correctness', () => {
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

  it('sets isDone=true after all steps are applied', () => {
    const finalState = runAllSteps([0.5, 0.2, 0.8]);
    expect(finalState.isDone).toBe(true);
  });

  it('marks all indices as sorted after all steps', () => {
    const arr = [0.5, 0.2, 0.8];
    const finalState = runAllSteps(arr);
    for (let i = 0; i < arr.length; i++) {
      expect(finalState.sortedIndices.has(i)).toBe(true);
    }
  });
});

// ── single-element edge case ─────────────────────────────────────────────────

describe('generateBubbleSortSteps — single element', () => {
  it('generates steps (at least the done step)', () => {
    const steps = generateBubbleSortSteps([0.5]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('last step is done for a single-element array', () => {
    const steps = generateBubbleSortSteps([0.5]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('generates no compare steps for a single-element array', () => {
    const steps = generateBubbleSortSteps([0.5]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps).toHaveLength(0);
  });
});

// ── already-sorted array ─────────────────────────────────────────────────────

describe('generateBubbleSortSteps — already-sorted array', () => {
  it('generates no swap steps when input is already sorted', () => {
    const arr = [0.1, 0.3, 0.5, 0.7, 0.9];
    const steps = generateBubbleSortSteps(arr);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    expect(swapSteps).toHaveLength(0);
  });

  it('still ends with a done step', () => {
    const arr = [0.1, 0.3, 0.5];
    const steps = generateBubbleSortSteps(arr);
    expect(steps[steps.length - 1].type).toBe('done');
  });
});

// ── reverse-sorted array ─────────────────────────────────────────────────────

describe('generateBubbleSortSteps — reverse-sorted array', () => {
  it('generates swap steps (worst case has the most swaps)', () => {
    const arr = [0.9, 0.7, 0.5, 0.3, 0.1];
    const steps = generateBubbleSortSteps(arr);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    expect(swapSteps.length).toBeGreaterThan(0);
  });

  it('every swap step has exactly 2 indices', () => {
    const arr = [0.9, 0.7, 0.5, 0.3, 0.1];
    const steps = generateBubbleSortSteps(arr);
    for (const step of steps.filter((s) => s.type === 'swap')) {
      expect(step.indices).toHaveLength(2);
    }
  });
});

// ── step type validity ───────────────────────────────────────────────────────

describe('generateBubbleSortSteps — step type validity', () => {
  const validTypes = new Set(['compare', 'swap', 'sorted', 'done']);

  it('all step types are valid AnimationStep types', () => {
    const arr = [0.5, 0.2, 0.8, 0.1];
    const steps = generateBubbleSortSteps(arr);
    for (const step of steps) {
      expect(validTypes.has(step.type)).toBe(true);
    }
  });

  it('done appears exactly once and is the last step', () => {
    const arr = [0.4, 0.1, 0.7, 0.2];
    const steps = generateBubbleSortSteps(arr);
    const doneSteps = steps.filter((s) => s.type === 'done');
    expect(doneSteps).toHaveLength(1);
    expect(steps[steps.length - 1].type).toBe('done');
  });
});
