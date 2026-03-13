import {
  generateArray,
  createInitialState,
  applyStep,
  getSwapFrames,
  easeInOutCubic,
  type AnimationState,
  type AnimationStep,
} from '@/lib/animation-engine';

// ── easeInOutCubic ──────────────────────────────────────────────────────────

describe('easeInOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('returns 0.5 at t=0.5 (symmetry point)', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
  });

  it('is monotonically increasing between 0 and 1', () => {
    const steps = 20;
    let prev = easeInOutCubic(0);
    for (let i = 1; i <= steps; i++) {
      const curr = easeInOutCubic(i / steps);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});

// ── generateArray ───────────────────────────────────────────────────────────

describe('generateArray', () => {
  it('returns an array of the requested length', () => {
    expect(generateArray(10)).toHaveLength(10);
    expect(generateArray(1)).toHaveLength(1);
    expect(generateArray(50)).toHaveLength(50);
  });

  it('returns an empty array when size is 0', () => {
    expect(generateArray(0)).toHaveLength(0);
  });

  it('all values are within the normalized range [0.1, 0.95]', () => {
    const arr = generateArray(100);
    for (const v of arr) {
      expect(v).toBeGreaterThanOrEqual(0.1);
      expect(v).toBeLessThanOrEqual(0.95);
    }
  });

  it('values are numbers (not NaN or Infinity)', () => {
    const arr = generateArray(20);
    for (const v of arr) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

// ── createInitialState ──────────────────────────────────────────────────────

describe('createInitialState', () => {
  it('creates state with default size 24', () => {
    const state = createInitialState();
    expect(state.array).toHaveLength(24);
  });

  it('creates state with a custom size', () => {
    const state = createInitialState(10);
    expect(state.array).toHaveLength(10);
  });

  it('initializes steps as an empty array', () => {
    const state = createInitialState();
    expect(state.steps).toEqual([]);
  });

  it('initializes currentStep to 0', () => {
    const state = createInitialState();
    expect(state.currentStep).toBe(0);
  });

  it('initializes isPlaying to false', () => {
    const state = createInitialState();
    expect(state.isPlaying).toBe(false);
  });

  it('initializes speed to 1', () => {
    const state = createInitialState();
    expect(state.speed).toBe(1);
  });

  it('initializes comparisons and swaps to 0', () => {
    const state = createInitialState();
    expect(state.comparisons).toBe(0);
    expect(state.swaps).toBe(0);
  });

  it('initializes sortedIndices as an empty Set', () => {
    const state = createInitialState();
    expect(state.sortedIndices).toBeInstanceOf(Set);
    expect(state.sortedIndices.size).toBe(0);
  });

  it('initializes comparingIndices and swappingIndices as empty arrays', () => {
    const state = createInitialState();
    expect(state.comparingIndices).toEqual([]);
    expect(state.swappingIndices).toEqual([]);
  });

  it('initializes isDone to false', () => {
    const state = createInitialState();
    expect(state.isDone).toBe(false);
  });
});

// ── applyStep ───────────────────────────────────────────────────────────────

function makeBaseState(arrayOverride?: number[]): AnimationState {
  return {
    array: arrayOverride ?? [0.2, 0.5, 0.3],
    steps: [],
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

describe('applyStep — compare', () => {
  const step: AnimationStep = {
    type: 'compare',
    indices: [0, 1],
    description: 'comparing 0 and 1',
  };

  it('increments comparisons by 1', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.comparisons).toBe(1);
  });

  it('sets comparingIndices to the step indices', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.comparingIndices).toEqual([0, 1]);
  });

  it('does not mutate swappingIndices', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.swappingIndices).toEqual([]);
  });

  it('does not change the array values', () => {
    const base = makeBaseState();
    const next = applyStep(base, step);
    expect(next.array).toEqual(base.array);
  });

  it('increments currentStep by 1', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.currentStep).toBe(1);
  });
});

describe('applyStep — swap', () => {
  const step: AnimationStep = {
    type: 'swap',
    indices: [0, 1],
    description: 'swapping 0 and 1',
  };

  it('increments swaps by 1', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.swaps).toBe(1);
  });

  it('sets swappingIndices to the step indices', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.swappingIndices).toEqual([0, 1]);
  });

  it('actually swaps the array values at the given indices', () => {
    const base = makeBaseState([0.2, 0.5, 0.3]);
    const next = applyStep(base, step);
    expect(next.array[0]).toBeCloseTo(0.5);
    expect(next.array[1]).toBeCloseTo(0.2);
    // Untouched index
    expect(next.array[2]).toBeCloseTo(0.3);
  });

  it('does not mutate the original state array', () => {
    const base = makeBaseState([0.2, 0.5, 0.3]);
    applyStep(base, step);
    expect(base.array[0]).toBeCloseTo(0.2);
    expect(base.array[1]).toBeCloseTo(0.5);
  });

  it('does not change comparisons count', () => {
    const base = makeBaseState();
    const next = applyStep(base, step);
    expect(next.comparisons).toBe(0);
  });
});

describe('applyStep — sorted', () => {
  const step: AnimationStep = {
    type: 'sorted',
    indices: [2],
    description: 'index 2 is sorted',
  };

  it('adds the given indices to sortedIndices', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.sortedIndices.has(2)).toBe(true);
  });

  it('preserves previously sorted indices', () => {
    const base = makeBaseState();
    base.sortedIndices = new Set([1]);
    const next = applyStep(base, step);
    expect(next.sortedIndices.has(1)).toBe(true);
    expect(next.sortedIndices.has(2)).toBe(true);
  });

  it('does not set isDone', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.isDone).toBe(false);
  });

  it('clears comparingIndices and swappingIndices', () => {
    const base = makeBaseState();
    base.comparingIndices = [0, 1];
    base.swappingIndices = [0, 1];
    const next = applyStep(base, step);
    expect(next.comparingIndices).toEqual([]);
    expect(next.swappingIndices).toEqual([]);
  });
});

describe('applyStep — done', () => {
  const step: AnimationStep = {
    type: 'done',
    indices: [],
    description: 'all sorted',
  };

  it('sets isDone to true', () => {
    const next = applyStep(makeBaseState(), step);
    expect(next.isDone).toBe(true);
  });

  it('marks all array indices as sorted', () => {
    const base = makeBaseState([0.1, 0.2, 0.3]);
    const next = applyStep(base, step);
    expect(next.sortedIndices.has(0)).toBe(true);
    expect(next.sortedIndices.has(1)).toBe(true);
    expect(next.sortedIndices.has(2)).toBe(true);
    expect(next.sortedIndices.size).toBe(3);
  });

  it('increments currentStep', () => {
    const base = makeBaseState();
    base.currentStep = 5;
    const next = applyStep(base, step);
    expect(next.currentStep).toBe(6);
  });
});

// ── getSwapFrames ───────────────────────────────────────────────────────────

describe('getSwapFrames', () => {
  const arr = [0.2, 0.8, 0.5];

  it('returns the default number of frames (12)', () => {
    const frames = getSwapFrames(arr, 0, 1);
    expect(frames).toHaveLength(12);
  });

  it('returns the specified number of frames', () => {
    const frames = getSwapFrames(arr, 0, 1, 6);
    expect(frames).toHaveLength(6);
  });

  it('the final frame has the two indices fully swapped', () => {
    const frames = getSwapFrames(arr, 0, 1);
    const last = frames[frames.length - 1];
    expect(last[0]).toBeCloseTo(0.8, 5);
    expect(last[1]).toBeCloseTo(0.2, 5);
    // Untouched index unchanged
    expect(last[2]).toBeCloseTo(0.5, 5);
  });

  it('each frame is a full copy of the array (correct length)', () => {
    const frames = getSwapFrames(arr, 0, 1);
    for (const frame of frames) {
      expect(frame).toHaveLength(arr.length);
    }
  });

  it('does not mutate the original array', () => {
    getSwapFrames(arr, 0, 1);
    expect(arr[0]).toBeCloseTo(0.2);
    expect(arr[1]).toBeCloseTo(0.8);
  });

  it('works when swapping non-adjacent indices', () => {
    const frames = getSwapFrames(arr, 0, 2, 10);
    const last = frames[frames.length - 1];
    expect(last[0]).toBeCloseTo(0.5, 5);
    expect(last[2]).toBeCloseTo(0.2, 5);
    expect(last[1]).toBeCloseTo(0.8, 5);
  });
});
