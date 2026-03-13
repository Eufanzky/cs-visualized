import { generateQueueSteps } from '@/lib/algorithms/queue';

// ── helpers ─────────────────────────────────────────────────────────────────

/** A representative array that gives an 8-value enqueue/dequeue demo. */
const SAMPLE = [0.1, 0.3, 0.5, 0.7, 0.2, 0.4, 0.6, 0.8];

// ── basic structure ──────────────────────────────────────────────────────────

describe('generateQueueSteps — basic structure', () => {
  it('generates at least one step for a non-empty array', () => {
    const steps = generateQueueSteps(SAMPLE);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('the last step is done', () => {
    const steps = generateQueueSteps(SAMPLE);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('every step has a non-empty description string', () => {
    const steps = generateQueueSteps(SAMPLE);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('every step has an indices array', () => {
    const steps = generateQueueSteps(SAMPLE);
    for (const step of steps) {
      expect(Array.isArray(step.indices)).toBe(true);
    }
  });

  it('generates enqueue (swap) steps when values are provided', () => {
    const steps = generateQueueSteps(SAMPLE);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    expect(swapSteps.length).toBeGreaterThan(0);
  });

  it('generates compare steps (rear highlight before enqueue / front before dequeue)', () => {
    const steps = generateQueueSteps([0.1, 0.2, 0.3]);
    const compareSteps = steps.filter((s) => s.type === 'compare');
    expect(compareSteps.length).toBeGreaterThan(0);
  });
});

// ── done step ────────────────────────────────────────────────────────────────

describe('generateQueueSteps — done step', () => {
  it('done appears exactly once', () => {
    const steps = generateQueueSteps(SAMPLE);
    const doneSteps = steps.filter((s) => s.type === 'done');
    expect(doneSteps).toHaveLength(1);
  });

  it('done is the last step', () => {
    const steps = generateQueueSteps(SAMPLE);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('done step has an empty indices array', () => {
    const steps = generateQueueSteps(SAMPLE);
    const doneStep = steps[steps.length - 1];
    expect(doneStep.indices).toHaveLength(0);
  });
});

// ── enqueue/dequeue sequence ─────────────────────────────────────────────────

describe('generateQueueSteps — enqueue/dequeue sequence', () => {
  it('number of enqueue+dequeue swap steps equals enqueueCount + dequeueCount', () => {
    const values = [0.1, 0.2, 0.3, 0.4]; // 4 enqueues → 2 dequeues = 6 swap steps
    const steps = generateQueueSteps(values);
    const swapSteps = steps.filter((s) => s.type === 'swap');
    expect(swapSteps).toHaveLength(6);
  });

  it('generates settled (sorted) steps after each enqueue', () => {
    const steps = generateQueueSteps([0.1, 0.2]);
    const sortedSteps = steps.filter((s) => s.type === 'sorted');
    expect(sortedSteps.length).toBeGreaterThan(0);
  });

  it('generates dequeue steps when there are enough values', () => {
    // 2 values → 1 dequeue
    const steps = generateQueueSteps([0.5, 0.3]);
    const descriptions = steps.map((s) => s.description);
    const hasDequeueDescription = descriptions.some((d) =>
      d.toLowerCase().includes('dequeueing'),
    );
    expect(hasDequeueDescription).toBe(true);
  });

  it('enqueue descriptions mention enqueueing', () => {
    const steps = generateQueueSteps([0.5, 0.3]);
    const descriptions = steps.map((s) => s.description);
    const hasEnqueueDescription = descriptions.some((d) =>
      d.toLowerCase().includes('enqueueing'),
    );
    expect(hasEnqueueDescription).toBe(true);
  });
});

// ── edge cases ────────────────────────────────────────────────────────────────

describe('generateQueueSteps — edge cases', () => {
  it('generates steps for a single-element array', () => {
    const steps = generateQueueSteps([0.5]);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('last step is done for a single-element array', () => {
    const steps = generateQueueSteps([0.5]);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('generates steps for a medium-size input (5 elements)', () => {
    const steps = generateQueueSteps([0.1, 0.3, 0.5, 0.7, 0.9]);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('only uses the first 8 elements even for larger arrays', () => {
    const large = Array.from({ length: 20 }, (_, i) => (i + 1) / 20);
    const small = large.slice(0, 8);
    const stepsLarge = generateQueueSteps(large);
    const stepsSmall = generateQueueSteps(small);
    expect(stepsLarge.length).toBe(stepsSmall.length);
  });
});

// ── step type validity ───────────────────────────────────────────────────────

describe('generateQueueSteps — step type validity', () => {
  const validTypes = new Set(['compare', 'swap', 'sorted', 'done']);

  it('all step types are valid AnimationStep types', () => {
    const steps = generateQueueSteps(SAMPLE);
    for (const step of steps) {
      expect(validTypes.has(step.type)).toBe(true);
    }
  });
});
