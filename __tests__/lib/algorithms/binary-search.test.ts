import { generateBinarySearchSteps } from '@/lib/algorithms/binary-search';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Build a sorted array with n elements, same as the algorithm does internally. */
function buildExpectedSortedArray(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i + 1) / n);
}

// ── basic structure ──────────────────────────────────────────────────────────

describe('generateBinarySearchSteps — basic structure', () => {
  it('generates at least one step for a multi-element array', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('the last step is done', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('every step has a non-empty description string', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('every step has an indices array', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    for (const step of steps) {
      expect(Array.isArray(step.indices)).toBe(true);
    }
  });

  it('contains compare steps', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps.length).toBeGreaterThan(0);
  });
});

// ── termination ──────────────────────────────────────────────────────────────

describe('generateBinarySearchSteps — termination', () => {
  it('always terminates with a done step (small array)', () => {
    for (let i = 0; i < 10; i++) {
      const steps = generateBinarySearchSteps([0.1, 0.2, 0.3]);
      expect(steps[steps.length - 1].type).toBe('done');
    }
  });

  it('always terminates with a done step (medium array)', () => {
    for (let i = 0; i < 10; i++) {
      const steps = generateBinarySearchSteps(
        Array.from({ length: 10 }, (_, j) => (j + 1) / 10),
      );
      expect(steps[steps.length - 1].type).toBe('done');
    }
  });

  it('always terminates with a done step (larger array)', () => {
    for (let i = 0; i < 5; i++) {
      const steps = generateBinarySearchSteps(
        Array.from({ length: 20 }, (_, j) => (j + 1) / 20),
      );
      expect(steps[steps.length - 1].type).toBe('done');
    }
  });

  it('done appears exactly once', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    const doneSteps = steps.filter((s) => s.type === 'done');
    expect(doneSteps).toHaveLength(1);
  });
});

// ── search finds the target ───────────────────────────────────────────────────

describe('generateBinarySearchSteps — target found', () => {
  it('generates a sorted step marking the found element (target always in array)', () => {
    // The algorithm always picks a target that exists in the array,
    // so there should always be a "found" sorted step (single index)
    const steps = generateBinarySearchSteps(
      Array.from({ length: 8 }, (_, i) => (i + 1) / 8),
    );
    // There should be at least one sorted step
    const sortedSteps = steps.filter((s) => s.type === 'sorted');
    expect(sortedSteps.length).toBeGreaterThan(0);
  });

  it('compare steps reference valid mid indices within array bounds', () => {
    const n = 8;
    const steps = generateBinarySearchSteps(
      Array.from({ length: n }, (_, i) => (i + 1) / n),
    );
    const compareSteps = steps.filter((s) => s.type === 'compare');
    for (const step of compareSteps) {
      for (const idx of step.indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(n);
      }
    }
  });

  it('sorted steps reference valid indices within array bounds', () => {
    const n = 8;
    const steps = generateBinarySearchSteps(
      Array.from({ length: n }, (_, i) => (i + 1) / n),
    );
    const sortedSteps = steps.filter((s) => s.type === 'sorted');
    for (const step of sortedSteps) {
      for (const idx of step.indices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(n);
      }
    }
  });
});

// ── single-element edge case ─────────────────────────────────────────────────

describe('generateBinarySearchSteps — single element', () => {
  it('generates steps for a single-element array', () => {
    const steps = generateBinarySearchSteps([1.0]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('last step is done for a single-element array', () => {
    const steps = generateBinarySearchSteps([1.0]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('generates at least one compare step for a single-element array', () => {
    const steps = generateBinarySearchSteps([1.0]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps.length).toBeGreaterThan(0);
  });
});

// ── step type validity ───────────────────────────────────────────────────────

describe('generateBinarySearchSteps — step type validity', () => {
  const validTypes = new Set(['compare', 'swap', 'sorted', 'done']);

  it('all step types are valid AnimationStep types', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    for (const step of steps) {
      expect(validTypes.has(step.type)).toBe(true);
    }
  });

  it('no swap steps are generated (binary search does not move elements)', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    expect(swapSteps).toHaveLength(0);
  });

  it('compare steps each reference exactly one index (the mid pointer)', () => {
    const steps = generateBinarySearchSteps([0.1, 0.2, 0.3, 0.4, 0.5]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    for (const step of compareSteps) {
      expect(step.indices).toHaveLength(1);
    }
  });
});

// ── logarithmic termination ───────────────────────────────────────────────────

describe('generateBinarySearchSteps — logarithmic step count', () => {
  it('compare steps count is at most log2(n)+1 for an n-element array', () => {
    const n = 16;
    const steps = generateBinarySearchSteps(
      Array.from({ length: n }, (_, i) => (i + 1) / n),
    );
    const compareSteps = steps.filter((s) => s.type === 'compare');
    const maxExpected = Math.ceil(Math.log2(n)) + 1;
    expect(compareSteps.length).toBeLessThanOrEqual(maxExpected);
  });
});
