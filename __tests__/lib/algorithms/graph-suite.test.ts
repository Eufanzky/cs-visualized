import { generateDijkstraSteps } from '@/lib/algorithms/dijkstra';
import { generateKruskalSteps } from '@/lib/algorithms/kruskal';
import { generatePrimSteps } from '@/lib/algorithms/prim';
import { generateTopologicalSortSteps } from '@/lib/algorithms/topological-sort';
import { isStepResult } from '@/lib/algorithms';
import type { AnimationStep, StepResult, GraphScene } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

const STANDARD_ARRAY = [0.5, 0.3, 0.8, 0.1, 0.9];
const SMALL_ARRAY = [0.5];
const EMPTY_ARRAY: number[] = [];

type GraphGenerator = (arr: number[]) => AnimationStep[] | StepResult;

function getSteps(result: AnimationStep[] | StepResult): AnimationStep[] {
  return isStepResult(result) ? result.steps : result;
}

// ── algorithm definitions ───────────────────────────────────────────────────

interface GraphAlgoEntry {
  name: string;
  generate: GraphGenerator;
}

const GRAPH_ALGORITHMS: GraphAlgoEntry[] = [
  { name: 'Dijkstra', generate: generateDijkstraSteps },
  { name: 'Kruskal', generate: generateKruskalSteps },
  { name: 'Prim', generate: generatePrimSteps },
  { name: 'Topological Sort', generate: generateTopologicalSortSteps },
];

// ── parametrized tests ──────────────────────────────────────────────────────

describe.each(GRAPH_ALGORITHMS)('$name', ({ generate }) => {
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

  it('returns StepResult with GraphScene', () => {
    const result = generate(STANDARD_ARRAY);
    expect(isStepResult(result)).toBe(true);
    if (isStepResult(result)) {
      expect(result.initialScene).toBeDefined();
      expect(result.initialScene.type).toBe('graph');
    }
  });

  it('all node IDs in scene are valid', () => {
    const result = generate(STANDARD_ARRAY);
    if (isStepResult(result)) {
      const scene = result.initialScene as GraphScene;
      const nodeIds = new Set(scene.nodes.map(n => n.id));

      // Every edge should reference valid node IDs
      for (const edge of scene.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      }

      // Every nodeState key should be a valid node ID
      for (const idStr of Object.keys(scene.nodeStates)) {
        expect(nodeIds.has(Number(idStr))).toBe(true);
      }
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
