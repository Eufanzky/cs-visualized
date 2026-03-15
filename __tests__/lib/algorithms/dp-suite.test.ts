import { generateFibonacciSteps } from '@/lib/algorithms/fibonacci';
import { generateFibonacciTreeSteps } from '@/lib/algorithms/fibonacci-tree';
import { generateKnapsackSteps } from '@/lib/algorithms/knapsack';
import { generateLCSSteps } from '@/lib/algorithms/lcs';
import { isStepResult } from '@/lib/algorithms';
import type { AnimationStep, StepResult } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

const STANDARD_ARRAY = [0.5, 0.3, 0.8, 0.1, 0.9];
const SMALL_ARRAY = [0.5];
const EMPTY_ARRAY: number[] = [];

type DPGenerator = (arr: number[]) => AnimationStep[] | StepResult;

function getSteps(result: AnimationStep[] | StepResult): AnimationStep[] {
  return isStepResult(result) ? result.steps : result;
}

// ── algorithm definitions ───────────────────────────────────────────────────

interface DPAlgoEntry {
  name: string;
  generate: DPGenerator;
  expectedSceneType: string;
}

const DP_ALGORITHMS: DPAlgoEntry[] = [
  { name: 'Fibonacci', generate: generateFibonacciSteps, expectedSceneType: 'dp-grid' },
  { name: 'Fibonacci Tree', generate: generateFibonacciTreeSteps, expectedSceneType: 'recursion-tree' },
  { name: 'Knapsack', generate: generateKnapsackSteps, expectedSceneType: 'dp-grid' },
  { name: 'LCS', generate: generateLCSSteps, expectedSceneType: 'dp-grid' },
];

// ── parametrized tests ──────────────────────────────────────────────────────

describe.each(DP_ALGORITHMS)('$name', ({ generate, expectedSceneType }) => {
  it('produces steps', () => {
    const result = generate(STANDARD_ARRAY);
    const steps = getSteps(result);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('handles small input without crashing', () => {
    expect(() => generate(SMALL_ARRAY)).not.toThrow();
  });

  it('handles empty array without crashing', () => {
    expect(() => generate(EMPTY_ARRAY)).not.toThrow();
  });

  it('ends with done step', () => {
    const result = generate(STANDARD_ARRAY);
    const steps = getSteps(result);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('returns StepResult with correct scene type', () => {
    const result = generate(STANDARD_ARRAY);
    expect(isStepResult(result)).toBe(true);
    if (isStepResult(result)) {
      expect(result.initialScene).toBeDefined();
      expect(result.initialScene.type).toBe(expectedSceneType);
    }
  });

  it('every step has a non-empty description', () => {
    const result = generate(STANDARD_ARRAY);
    const steps = getSteps(result);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});
