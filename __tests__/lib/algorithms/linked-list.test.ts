import { generateLinkedListSteps } from '@/lib/algorithms/linked-list';

// ── helpers ─────────────────────────────────────────────────────────────────

/** A representative array for an 8-node linked list demo. */
const SAMPLE = [0.1, 0.3, 0.5, 0.7, 0.2, 0.4, 0.6, 0.8];

/** Unwrap StepResult → AnimationStep[] */
function getSteps(arr: number[]) {
  return generateLinkedListSteps(arr).steps;
}

// ── basic structure ──────────────────────────────────────────────────────────

describe('generateLinkedListSteps — basic structure', () => {
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

  it('generates compare steps (traversal)', () => {
    const steps = getSteps(SAMPLE);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps.length).toBeGreaterThan(0);
  });

  it('generates swap steps (insertion/deletion)', () => {
    const steps = getSteps(SAMPLE);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    expect(swapSteps.length).toBeGreaterThan(0);
  });
});

// ── done step ────────────────────────────────────────────────────────────────

describe('generateLinkedListSteps — done step', () => {
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

// ── build phase ───────────────────────────────────────────────────────────────

describe('generateLinkedListSteps — build phase (insertion)', () => {
  it('generates insertion (swap) steps for each node', () => {
    // Each node insertion produces a swap step
    const n = 4;
    const steps = getSteps([0.1, 0.2, 0.3, 0.4]);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    // n insertions + 1 deletion (middle node) = at least n swap steps
    expect(swapSteps.length).toBeGreaterThanOrEqual(n);
  });

  it('descriptions mention "inserting" during the build phase', () => {
    const steps = getSteps([0.1, 0.2, 0.3]);
    const descriptions = steps.map((s) => s.description.toLowerCase());
    const hasInsertDescription = descriptions.some((d) => d.includes('insert'));
    expect(hasInsertDescription).toBe(true);
  });

  it('sorted steps are generated after each node insertion', () => {
    const steps = getSteps([0.1, 0.2, 0.3]);
    const sortedSteps = steps.filter((s) => s.type === 'sorted');
    expect(sortedSteps.length).toBeGreaterThan(0);
  });
});

// ── traversal phase ───────────────────────────────────────────────────────────

describe('generateLinkedListSteps — traversal (search phase)', () => {
  it('compare steps mention traversal or visiting nodes', () => {
    const steps = getSteps([0.1, 0.2, 0.3, 0.4]);
    const compareDescs = steps
      .filter((s) => s.type === 'compare')
      .map((s) => s.description.toLowerCase());
    const hasTraversalDesc = compareDescs.some(
      (d) => d.includes('traversal') || d.includes('traversing') || d.includes('visiting') || d.includes('found') || d.includes('starting'),
    );
    expect(hasTraversalDesc).toBe(true);
  });
});

// ── deletion phase ────────────────────────────────────────────────────────────

describe('generateLinkedListSteps — deletion phase', () => {
  it('deletion swap step mentions re-linking or removing', () => {
    const steps = getSteps([0.1, 0.2, 0.3, 0.4]);
    const swapDescs = steps
      .filter((s) => s.type === 'swap')
      .map((s) => s.description.toLowerCase());
    const hasDeletionDesc = swapDescs.some(
      (d) => d.includes('re-linking') || d.includes('removing') || d.includes('skipping'),
    );
    expect(hasDeletionDesc).toBe(true);
  });
});

// ── edge cases ────────────────────────────────────────────────────────────────

describe('generateLinkedListSteps — edge cases', () => {
  it('generates only a done step for an empty array', () => {
    const steps = getSteps([]);
    expect(steps).toHaveLength(1);
    expect(steps[0].type).toBe('done');
  });

  it('done step description mentions "empty" for an empty array', () => {
    const steps = getSteps([]);
    expect(steps[0].description.toLowerCase()).toContain('empty');
  });

  it('generates steps for a single-element array', () => {
    const steps = getSteps([0.5]);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('generates steps for a two-element array', () => {
    const steps = getSteps([0.3, 0.7]);
    expect(steps.length).toBeGreaterThan(0);
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
    expect(stepsLarge.length).toBe(stepsSmall.length);
  });
});

// ── step type validity ───────────────────────────────────────────────────────

describe('generateLinkedListSteps — step type validity', () => {
  const validTypes = new Set(['compare', 'swap', 'sorted', 'done']);

  it('all step types are valid AnimationStep types', () => {
    const steps = getSteps(SAMPLE);
    for (const step of steps) {
      expect(validTypes.has(step.type)).toBe(true);
    }
  });
});
