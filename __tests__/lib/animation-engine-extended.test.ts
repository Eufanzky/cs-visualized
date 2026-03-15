import {
  applyStep,
  createInitialState,
  reset,
  generateArray,
  speedToDelay,
  getSwapFrames,
  easeInOutCubic,
  type AnimationState,
  type AnimationStep,
  type GraphScene,
} from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

function makeState(arr: number[], overrides?: Partial<AnimationState>): AnimationState {
  return {
    array: [...arr],
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
    ...overrides,
  };
}

// ── applyStep tests ─────────────────────────────────────────────────────────

describe('applyStep', () => {
  it('correctly handles compare step', () => {
    const state = makeState([0.5, 0.3, 0.8]);
    const step: AnimationStep = {
      type: 'compare',
      indices: [0, 1],
      description: 'Comparing indices 0 and 1',
    };
    const next = applyStep(state, step);

    expect(next.comparingIndices).toEqual([0, 1]);
    expect(next.comparisons).toBe(1);
    expect(next.swappingIndices).toEqual([]);
    expect(next.currentStep).toBe(1);
    // Array should not change on compare
    expect(next.array).toEqual([0.5, 0.3, 0.8]);
  });

  it('correctly handles swap step for bar-chart', () => {
    const state = makeState([0.5, 0.3, 0.8], { rendererType: 'bar-chart' });
    const step: AnimationStep = {
      type: 'swap',
      indices: [0, 1],
      description: 'Swapping indices 0 and 1',
    };
    const next = applyStep(state, step);

    expect(next.swappingIndices).toEqual([0, 1]);
    expect(next.swaps).toBe(1);
    // Values should be swapped
    expect(next.array[0]).toBe(0.3);
    expect(next.array[1]).toBe(0.5);
    expect(next.array[2]).toBe(0.8);
  });

  it('correctly handles swap step for box-swap', () => {
    const state = makeState([0.5, 0.3, 0.8], { rendererType: 'box-swap' });
    const step: AnimationStep = {
      type: 'swap',
      indices: [0, 2],
      description: 'Swapping indices 0 and 2',
    };
    const next = applyStep(state, step);

    expect(next.swappingIndices).toEqual([0, 2]);
    expect(next.swaps).toBe(1);
    // Values should be swapped for box-swap renderer too
    expect(next.array[0]).toBe(0.8);
    expect(next.array[2]).toBe(0.5);
  });

  it('correctly handles sorted step', () => {
    const state = makeState([0.3, 0.5, 0.8]);
    const step: AnimationStep = {
      type: 'sorted',
      indices: [2],
      description: 'Index 2 is sorted',
    };
    const next = applyStep(state, step);

    expect(next.sortedIndices.has(2)).toBe(true);
    expect(next.sortedIndices.size).toBe(1);
  });

  it('correctly handles done step', () => {
    const state = makeState([0.3, 0.5, 0.8]);
    const step: AnimationStep = {
      type: 'done',
      indices: [],
      description: 'Sorting complete',
    };
    const next = applyStep(state, step);

    expect(next.isDone).toBe(true);
    // All indices should be marked sorted
    expect(next.sortedIndices.size).toBe(3);
    expect(next.sortedIndices.has(0)).toBe(true);
    expect(next.sortedIndices.has(1)).toBe(true);
    expect(next.sortedIndices.has(2)).toBe(true);
  });

  it('applies sceneUpdate to existing scene', () => {
    const initialScene: GraphScene = {
      type: 'graph',
      nodes: [{ id: 0, label: 'A', x: 0.5, y: 0.5 }],
      edges: [],
      nodeStates: { 0: 'unvisited' },
    };
    const state = makeState([0.5], {
      rendererType: 'graph',
      scene: initialScene,
    });
    const step: AnimationStep = {
      type: 'compare',
      indices: [0],
      description: 'Visiting node A',
      sceneUpdate: {
        type: 'graph',
        nodes: [{ id: 0, label: 'A', x: 0.5, y: 0.5 }],
        edges: [],
        nodeStates: { 0: 'visiting' },
      } as GraphScene,
    };
    const next = applyStep(state, step);

    expect(next.scene).toBeDefined();
    expect((next.scene as GraphScene).nodeStates[0]).toBe('visiting');
  });

  it('does not apply sceneUpdate when scene is null', () => {
    const state = makeState([0.5], { scene: null });
    const step: AnimationStep = {
      type: 'compare',
      indices: [0],
      description: 'Test',
      sceneUpdate: {
        type: 'graph',
        nodes: [],
        edges: [],
        nodeStates: {},
      } as GraphScene,
    };
    const next = applyStep(state, step);
    // Scene remains null/undefined when no initial scene is set
    expect(next.scene).toBeNull();
  });

  it('accumulates sorted indices across multiple sorted steps', () => {
    let state = makeState([0.1, 0.3, 0.5, 0.8]);

    state = applyStep(state, { type: 'sorted', indices: [3], description: 'step 1' });
    expect(state.sortedIndices.has(3)).toBe(true);

    state = applyStep(state, { type: 'sorted', indices: [2], description: 'step 2' });
    expect(state.sortedIndices.has(2)).toBe(true);
    expect(state.sortedIndices.has(3)).toBe(true);
    expect(state.sortedIndices.size).toBe(2);
  });

  it('increments currentStep on each call', () => {
    let state = makeState([0.5, 0.3]);
    state = applyStep(state, { type: 'compare', indices: [0, 1], description: 'a' });
    expect(state.currentStep).toBe(1);
    state = applyStep(state, { type: 'compare', indices: [0, 1], description: 'b' });
    expect(state.currentStep).toBe(2);
  });
});

// ── reset / createInitialState tests ────────────────────────────────────────

describe('reset and createInitialState', () => {
  it('reset creates fresh state', () => {
    const state = reset(10, 2);
    expect(state.array).toHaveLength(10);
    expect(state.speed).toBe(2);
    expect(state.comparisons).toBe(0);
    expect(state.swaps).toBe(0);
    expect(state.isDone).toBe(false);
    expect(state.steps).toEqual([]);
    expect(state.sortedIndices.size).toBe(0);
  });

  it('createInitialState defaults to bar-chart renderer', () => {
    const state = createInitialState();
    expect(state.rendererType).toBe('bar-chart');
    expect(state.scene).toBeNull();
  });

  it('createInitialState accepts custom renderer and scene', () => {
    const scene: GraphScene = {
      type: 'graph',
      nodes: [],
      edges: [],
      nodeStates: {},
    };
    const state = createInitialState(5, 'graph', scene);
    expect(state.rendererType).toBe('graph');
    expect(state.scene).toEqual(scene);
    expect(state.array).toHaveLength(5);
  });
});

// ── generateArray tests ─────────────────────────────────────────────────────

describe('generateArray', () => {
  it('produces array of correct size', () => {
    expect(generateArray(10)).toHaveLength(10);
    expect(generateArray(1)).toHaveLength(1);
    expect(generateArray(0)).toHaveLength(0);
    expect(generateArray(50)).toHaveLength(50);
  });

  it('all values are between 0.1 and 0.95', () => {
    const arr = generateArray(100);
    for (const v of arr) {
      expect(v).toBeGreaterThanOrEqual(0.1);
      expect(v).toBeLessThanOrEqual(0.95);
    }
  });
});

// ── speedToDelay tests ──────────────────────────────────────────────────────

describe('speedToDelay', () => {
  it('returns reasonable values', () => {
    // At 1x → 250ms
    expect(speedToDelay(1)).toBe(250);
    // At 4x → 62.5 → 63ms
    expect(speedToDelay(4)).toBe(63);
    // At 0.25x → 1000ms
    expect(speedToDelay(0.25)).toBe(1000);
    // At 2x → 125ms
    expect(speedToDelay(2)).toBe(125);
  });

  it('higher speed means lower delay', () => {
    expect(speedToDelay(2)).toBeLessThan(speedToDelay(1));
    expect(speedToDelay(4)).toBeLessThan(speedToDelay(2));
  });
});

// ── getSwapFrames tests ─────────────────────────────────────────────────────

describe('getSwapFrames', () => {
  it('produces correct number of frames', () => {
    const arr = [0.3, 0.7, 0.5];
    const frames = getSwapFrames(arr, 0, 1, 12);
    expect(frames).toHaveLength(12);
  });

  it('uses default totalFrames of 12', () => {
    const arr = [0.3, 0.7];
    const frames = getSwapFrames(arr, 0, 1);
    expect(frames).toHaveLength(12);
  });

  it('last frame has values fully swapped', () => {
    const arr = [0.3, 0.7, 0.5];
    const frames = getSwapFrames(arr, 0, 1, 12);
    const lastFrame = frames[frames.length - 1];
    // After swap: index 0 should have 0.7, index 1 should have 0.3
    expect(lastFrame[0]).toBeCloseTo(0.7, 5);
    expect(lastFrame[1]).toBeCloseTo(0.3, 5);
    // Untouched index should remain
    expect(lastFrame[2]).toBe(0.5);
  });

  it('intermediate frames have values between start and end', () => {
    const arr = [0.2, 0.8];
    const frames = getSwapFrames(arr, 0, 1, 10);
    const midFrame = frames[4]; // halfway-ish
    // Values should be somewhere between original positions
    expect(midFrame[0]).toBeGreaterThan(0.2);
    expect(midFrame[0]).toBeLessThan(0.8);
  });
});

// ── easeInOutCubic tests ────────────────────────────────────────────────────

describe('easeInOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('returns 0.5 at t=0.5', () => {
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });

  it('is monotonically increasing from 0 to 1', () => {
    let prev = 0;
    for (let t = 0.01; t <= 1; t += 0.01) {
      const val = easeInOutCubic(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it('output stays in [0, 1] for inputs in [0, 1]', () => {
    for (let t = 0; t <= 1; t += 0.05) {
      const val = easeInOutCubic(t);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});
