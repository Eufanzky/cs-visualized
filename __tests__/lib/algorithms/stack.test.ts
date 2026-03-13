import { generateStackSteps } from '@/lib/algorithms/stack';

// ── helpers ─────────────────────────────────────────────────────────────────

/** A representative array that gives an 8-value push/pop demo. */
const SAMPLE = [0.1, 0.3, 0.5, 0.7, 0.2, 0.4, 0.6, 0.8];

/** Unwrap StepResult → AnimationStep[] */
function getSteps(arr: number[]) {
  return generateStackSteps(arr).steps;
}

// ── basic structure ──────────────────────────────────────────────────────────

describe('generateStackSteps — basic structure', () => {
  it('generates at least one step for a non-empty array', () => {
    const steps = getSteps(SAMPLE);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('the last step is done', () => {
    const steps = getSteps(SAMPLE);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('every step has a non-empty description string', () => {
    const steps = getSteps(SAMPLE);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('every step has an indices array', () => {
    const steps = getSteps(SAMPLE);
    for (const step of steps) {
      expect(Array.isArray(step.indices)).toBe(true);
    }
  });

  it('generates push (swap) steps when values are provided', () => {
    const steps = getSteps(SAMPLE);
    const pushSteps = steps.filter((s) => s.type === 'swap');
    expect(pushSteps.length).toBeGreaterThan(0);
  });

  it('generates compare steps (peek before push/pop)', () => {
    // With > 1 value there will be peek-before-push compare steps
    const steps = getSteps([0.1, 0.2, 0.3]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps.length).toBeGreaterThan(0);
  });
});

// ── done step ────────────────────────────────────────────────────────────────

describe('generateStackSteps — done step', () => {
  it('done appears exactly once', () => {
    const steps = getSteps(SAMPLE);
    const doneSteps = steps.filter((s) => s.type === 'done');
    expect(doneSteps).toHaveLength(1);
  });

  it('done is the last step', () => {
    const steps = getSteps(SAMPLE);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('done step has an empty indices array', () => {
    const steps = getSteps(SAMPLE);
    const doneStep = steps[steps.length - 1];
    expect(doneStep.indices).toHaveLength(0);
  });
});

// ── push/pop sequence ────────────────────────────────────────────────────────

describe('generateStackSteps — push/pop sequence', () => {
  it('number of push (swap) steps equals the number of values used', () => {
    // Uses at most 8 values; pop count = floor(push count / 2)
    const values = [0.1, 0.2, 0.3, 0.4]; // 4 values → 2 pops
    const steps = getSteps(values);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    // 4 pushes + 2 pops = 6 swap steps
    expect(swapSteps).toHaveLength(6);
  });

  it('generates settled (sorted) steps after each push', () => {
    const steps = getSteps([0.1, 0.2]);
    const sortedSteps = steps.filter((s) => s.type === 'sorted');
    expect(sortedSteps.length).toBeGreaterThan(0);
  });

  it('generates pop steps when there are enough values to pop', () => {
    // 2 values → 1 pop
    const steps = getSteps([0.5, 0.3]);
    const descriptions = steps.map((s) => s.description);
    const hasPopDescription = descriptions.some((d) => d.toLowerCase().includes('popping'));
    expect(hasPopDescription).toBe(true);
  });
});

// ── edge cases ────────────────────────────────────────────────────────────────

describe('generateStackSteps — edge cases', () => {
  it('generates steps for a single-element array', () => {
    const steps = getSteps([0.5]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('last step is done for a single-element array', () => {
    const steps = getSteps([0.5]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('generates steps for a medium-size input (5 elements)', () => {
    const steps = getSteps([0.1, 0.3, 0.5, 0.7, 0.9]);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('only uses the first 8 elements even for larger arrays', () => {
    const large = Array.from({ length: 20 }, (_, i) => (i + 1) / 20);
    const small = large.slice(0, 8);
    const stepsLarge = getSteps(large);
    const stepsSmall = getSteps(small);
    // Step counts should be identical when same values are used
    expect(stepsLarge.length).toBe(stepsSmall.length);
  });
});

// ── step type validity ───────────────────────────────────────────────────────

describe('generateStackSteps — step type validity', () => {
  const validTypes = new Set(['compare', 'swap', 'sorted', 'done']);

  it('all step types are valid AnimationStep types', () => {
    const steps = getSteps(SAMPLE);
    for (const step of steps) {
      expect(validTypes.has(step.type)).toBe(true);
    }
  });
});
