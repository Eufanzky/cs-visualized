import { generateStackSteps } from '@/lib/algorithms/stack';
import { generateQueueSteps } from '@/lib/algorithms/queue';
import { generateLinkedListSteps } from '@/lib/algorithms/linked-list';
import { generateBinaryTreeSteps } from '@/lib/algorithms/binary-tree';
import { generateHashTableSteps } from '@/lib/algorithms/hash-table';
import { generateArraySteps } from '@/lib/algorithms/array';
import { generateHeapSteps } from '@/lib/algorithms/heap';
import { generateGraphDSSteps } from '@/lib/algorithms/graph-ds';
import { isStepResult } from '@/lib/algorithms';
import type { AnimationStep, StepResult } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

const STANDARD_ARRAY = [0.5, 0.3, 0.8, 0.1, 0.9];
const SMALL_ARRAY = [0.5];
const EMPTY_ARRAY: number[] = [];

type DSGenerator = (arr: number[]) => AnimationStep[] | StepResult;

function getSteps(result: AnimationStep[] | StepResult): AnimationStep[] {
  return isStepResult(result) ? result.steps : result;
}

// ── algorithm definitions ───────────────────────────────────────────────────

interface DSAlgoEntry {
  name: string;
  generate: DSGenerator;
  expectedSceneType: string;
}

const DS_ALGORITHMS: DSAlgoEntry[] = [
  { name: 'Stack', generate: generateStackSteps, expectedSceneType: 'linear' },
  { name: 'Queue', generate: generateQueueSteps, expectedSceneType: 'linear' },
  { name: 'Linked List', generate: generateLinkedListSteps, expectedSceneType: 'linear' },
  { name: 'Binary Tree', generate: generateBinaryTreeSteps, expectedSceneType: 'tree' },
  { name: 'Hash Table', generate: generateHashTableSteps, expectedSceneType: 'hash-table' },
  { name: 'Array', generate: generateArraySteps, expectedSceneType: 'linear' },
  { name: 'Heap', generate: generateHeapSteps, expectedSceneType: 'tree' },
  { name: 'Graph (DS)', generate: generateGraphDSSteps, expectedSceneType: 'graph' },
];

// ── parametrized tests ──────────────────────────────────────────────────────

describe.each(DS_ALGORITHMS)('$name', ({ generate, expectedSceneType }) => {
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

  it('every step has an indices array', () => {
    const result = generate(STANDARD_ARRAY);
    const steps = getSteps(result);
    for (const step of steps) {
      expect(Array.isArray(step.indices)).toBe(true);
    }
  });
});
