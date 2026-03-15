import { generateBinarySearchSteps } from '@/lib/algorithms/binary-search';
import { generateBFSSteps } from '@/lib/algorithms/bfs';
import { generateDFSSteps } from '@/lib/algorithms/dfs';
import { generateBFSMazeSteps } from '@/lib/algorithms/bfs-maze';
import { generateDFSMazeSteps } from '@/lib/algorithms/dfs-maze';
import { generateAStarSteps } from '@/lib/algorithms/a-star';
import { isStepResult } from '@/lib/algorithms';
import type { AnimationStep, StepResult } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

const STANDARD_ARRAY = [0.5, 0.3, 0.8, 0.1, 0.9];
const SMALL_ARRAY = [0.5];
const EMPTY_ARRAY: number[] = [];

type SearchGenerator = (arr: number[]) => AnimationStep[] | StepResult;

function getSteps(result: AnimationStep[] | StepResult): AnimationStep[] {
  return isStepResult(result) ? result.steps : result;
}

// ── algorithm definitions ───────────────────────────────────────────────────

interface SearchAlgoEntry {
  name: string;
  generate: SearchGenerator;
  isSceneBased: boolean;
  expectedSceneType: string | null;
}

const SEARCH_ALGORITHMS: SearchAlgoEntry[] = [
  { name: 'Binary Search', generate: generateBinarySearchSteps, isSceneBased: false, expectedSceneType: null },
  { name: 'BFS (graph)', generate: generateBFSSteps, isSceneBased: true, expectedSceneType: 'graph' },
  { name: 'DFS (graph)', generate: generateDFSSteps, isSceneBased: true, expectedSceneType: 'graph' },
  { name: 'BFS Maze', generate: generateBFSMazeSteps, isSceneBased: true, expectedSceneType: 'maze' },
  { name: 'DFS Maze', generate: generateDFSMazeSteps, isSceneBased: true, expectedSceneType: 'maze' },
  { name: 'A* Search', generate: generateAStarSteps, isSceneBased: true, expectedSceneType: 'maze' },
];

// ── parametrized tests ──────────────────────────────────────────────────────

describe.each(SEARCH_ALGORITHMS)('$name', ({ generate, isSceneBased, expectedSceneType }) => {
  it('produces steps', () => {
    const result = generate(STANDARD_ARRAY);
    const steps = getSteps(result);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('handles small input', () => {
    expect(() => generate(SMALL_ARRAY)).not.toThrow();
    const result = generate(SMALL_ARRAY);
    const steps = getSteps(result);
    expect(steps.length).toBeGreaterThan(0);
  });

  it('handles empty array without crashing', () => {
    expect(() => generate(EMPTY_ARRAY)).not.toThrow();
  });

  it('ends with a done step', () => {
    const result = generate(STANDARD_ARRAY);
    const steps = getSteps(result);
    expect(steps[steps.length - 1].type).toBe('done');
  });

  it('every step has a non-empty description', () => {
    const result = generate(STANDARD_ARRAY);
    const steps = getSteps(result);
    for (const step of steps) {
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  if (isSceneBased) {
    it('returns StepResult with initialScene', () => {
      const result = generate(STANDARD_ARRAY);
      expect(isStepResult(result)).toBe(true);
      if (isStepResult(result)) {
        expect(result.initialScene).toBeDefined();
      }
    });

    it(`scene type matches expected renderer type (${expectedSceneType})`, () => {
      const result = generate(STANDARD_ARRAY);
      if (isStepResult(result)) {
        expect(result.initialScene.type).toBe(expectedSceneType);
      }
    });
  }
});
