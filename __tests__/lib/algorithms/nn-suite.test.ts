import { generatePerceptronSteps } from '@/lib/algorithms/perceptron';
import { generateBackpropagationSteps } from '@/lib/algorithms/backpropagation';
import { generateCNNSteps } from '@/lib/algorithms/cnn';
import { generateGradientDescentSteps } from '@/lib/algorithms/gradient-descent';
import { isStepResult } from '@/lib/algorithms';
import type { AnimationStep, StepResult, NeuronScene } from '@/lib/animation-engine';

// ── helpers ─────────────────────────────────────────────────────────────────

const STANDARD_ARRAY = [0.5, 0.3, 0.8, 0.1, 0.9];
const SMALL_ARRAY = [0.5];
const EMPTY_ARRAY: number[] = [];

type NNGenerator = (arr: number[]) => AnimationStep[] | StepResult;

function getSteps(result: AnimationStep[] | StepResult): AnimationStep[] {
  return isStepResult(result) ? result.steps : result;
}

// ── algorithm definitions ───────────────────────────────────────────────────

interface NNAlgoEntry {
  name: string;
  generate: NNGenerator;
}

const NN_ALGORITHMS: NNAlgoEntry[] = [
  { name: 'Perceptron', generate: generatePerceptronSteps },
  { name: 'Backpropagation', generate: generateBackpropagationSteps },
  { name: 'CNN', generate: generateCNNSteps },
  { name: 'Gradient Descent', generate: generateGradientDescentSteps },
];

// ── parametrized tests ──────────────────────────────────────────────────────

describe.each(NN_ALGORITHMS)('$name', ({ generate }) => {
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

  it('returns StepResult with NeuronScene', () => {
    const result = generate(STANDARD_ARRAY);
    expect(isStepResult(result)).toBe(true);
    if (isStepResult(result)) {
      expect(result.initialScene).toBeDefined();
      expect(result.initialScene.type).toBe('neuron');
    }
  });

  it('NeuronScene has required fields', () => {
    const result = generate(STANDARD_ARRAY);
    if (isStepResult(result)) {
      const scene = result.initialScene as NeuronScene;
      expect(Array.isArray(scene.inputs)).toBe(true);
      expect(Array.isArray(scene.weights)).toBe(true);
      expect(typeof scene.bias).toBe('number');
      expect(typeof scene.weightedSum).toBe('number');
      expect(typeof scene.output).toBe('number');
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
