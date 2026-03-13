import type { AnimationStep, NeuronScene, TrainingPoint, StepResult } from '../animation-engine';

/**
 * Generates a StepResult for single-neuron Perceptron training on the AND gate.
 *
 * Returns:
 *   - initialScene: a NeuronScene with initial weights/bias and all 4 training points
 *   - steps: each step carries a full sceneUpdate with updated weights, current
 *            training point highlighted, and decision boundary redrawn
 *
 * Steps produced:
 *   compare → forward pass: computing weighted sum (no weight change)
 *   swap    → weight update step (misprediction)
 *   sorted  → correct prediction or epoch convergence
 *   done    → training complete
 */

interface TrainingExample {
  x1: number;
  x2: number;
  label: number;
}

const TRAINING_DATA: TrainingExample[] = [
  { x1: 0, x2: 0, label: 0 },
  { x1: 0, x2: 1, label: 0 },
  { x1: 1, x2: 0, label: 0 },
  { x1: 1, x2: 1, label: 1 },
];

const MAX_EPOCHS = 20;
const LEARNING_RATE = 0.1;

function activate(sum: number): number {
  return sum >= 0 ? 1 : 0;
}

const TRAINING_POINTS: TrainingPoint[] = TRAINING_DATA.map(ex => ({
  x: ex.x1,
  y: ex.x2,
  label: ex.label,
}));

function makeScene(
  w1: number,
  w2: number,
  bias: number,
  x1: number,
  x2: number,
  weightedSum: number,
  output: number,
  currentExample: number,
): NeuronScene {
  return {
    type: 'neuron',
    inputs: [x1, x2],
    weights: [w1, w2],
    bias,
    weightedSum,
    output,
    currentExample,
    decisionBoundary: { w1, w2, bias },
    trainingPoints: TRAINING_POINTS,
  };
}

export function generatePerceptronSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];

  // Seed weights from arr values, or use small defaults
  let w1 = arr.length > 0 ? (arr[0] - 0.5) * 0.4 : 0.1;
  let w2 = arr.length > 1 ? (arr[1] - 0.5) * 0.4 : 0.1;
  let bias = arr.length > 2 ? (arr[2] - 0.5) * 0.4 : -0.15;

  const fmt = (v: number) => v.toFixed(3);

  // Initial scene (before any training step)
  const initialScene: NeuronScene = {
    type: 'neuron',
    inputs: [0, 0],
    weights: [w1, w2],
    bias,
    weightedSum: 0,
    output: 0,
    currentExample: undefined,
    decisionBoundary: { w1, w2, bias },
    trainingPoints: TRAINING_POINTS,
  };

  // Intro step
  const initSum = w1 * 0 + w2 * 0 + bias;
  steps.push({
    type: 'compare',
    indices: [0],
    description: `Perceptron init — w1=${fmt(w1)}, w2=${fmt(w2)}, bias=${fmt(bias)}, lr=${LEARNING_RATE}. Training on AND gate (4 examples).`,
    sceneUpdate: makeScene(w1, w2, bias, 0, 0, initSum, activate(initSum), 0),
  });

  let converged = false;

  for (let epoch = 0; epoch < MAX_EPOCHS && !converged; epoch++) {
    let errorsThisEpoch = 0;

    for (let i = 0; i < TRAINING_DATA.length; i++) {
      const { x1, x2, label } = TRAINING_DATA[i];

      // Forward pass
      const weightedSum = w1 * x1 + w2 * x2 + bias;
      const output = activate(weightedSum);

      steps.push({
        type: 'compare',
        indices: [i],
        description: `Epoch ${epoch + 1}, example ${i + 1}: input [${x1},${x2}], weights [${fmt(w1)},${fmt(w2)}], bias ${fmt(bias)} → sum=${fmt(weightedSum)}, output=${output}, label=${label}`,
        sceneUpdate: makeScene(w1, w2, bias, x1, x2, weightedSum, output, i),
      });

      if (output !== label) {
        // Misprediction — apply perceptron update rule
        const error = label - output;
        const prevW1 = w1, prevW2 = w2, prevBias = bias;

        w1   += LEARNING_RATE * error * x1;
        w2   += LEARNING_RATE * error * x2;
        bias += LEARNING_RATE * error;

        steps.push({
          type: 'swap',
          indices: [i],
          values: [w1, w2, bias],
          description: `Misprediction (output=${output} ≠ label=${label}) — updating weights: w1 ${fmt(prevW1)}→${fmt(w1)}, w2 ${fmt(prevW2)}→${fmt(w2)}, bias ${fmt(prevBias)}→${fmt(bias)}`,
          // After update: re-compute sum with new weights for the same input
          sceneUpdate: makeScene(
            w1, w2, bias,
            x1, x2,
            w1 * x1 + w2 * x2 + bias,
            activate(w1 * x1 + w2 * x2 + bias),
            i,
          ),
        });

        errorsThisEpoch++;
      } else {
        // Correct prediction
        steps.push({
          type: 'sorted',
          indices: [i],
          description: `Correct prediction (output=${output} = label=${label}) — no weight update needed`,
          sceneUpdate: makeScene(w1, w2, bias, x1, x2, weightedSum, output, i),
        });
      }
    }

    if (errorsThisEpoch === 0) {
      converged = true;
      // Show all points, no specific current example
      const convergenceScene: NeuronScene = {
        type: 'neuron',
        inputs: [1, 1],
        weights: [w1, w2],
        bias,
        weightedSum: w1 + w2 + bias,
        output: activate(w1 + w2 + bias),
        currentExample: undefined,
        decisionBoundary: { w1, w2, bias },
        trainingPoints: TRAINING_POINTS,
      };
      steps.push({
        type: 'sorted',
        indices: Array.from({ length: TRAINING_DATA.length }, (_, idx) => idx),
        description: `Epoch ${epoch + 1} complete with 0 errors — perceptron has converged! Final weights: w1=${fmt(w1)}, w2=${fmt(w2)}, bias=${fmt(bias)}`,
        sceneUpdate: convergenceScene,
      });
    }
  }

  const finalScene: NeuronScene = {
    type: 'neuron',
    inputs: [1, 1],
    weights: [w1, w2],
    bias,
    weightedSum: w1 + w2 + bias,
    output: activate(w1 + w2 + bias),
    currentExample: undefined,
    decisionBoundary: { w1, w2, bias },
    trainingPoints: TRAINING_POINTS,
  };

  steps.push({
    type: 'done',
    indices: [],
    description: converged
      ? `Training complete — perceptron converged. Decision boundary: ${fmt(w1)}·x1 + ${fmt(w2)}·x2 + ${fmt(bias)} = 0`
      : `Training stopped after ${MAX_EPOCHS} epochs. Final weights: w1=${fmt(w1)}, w2=${fmt(w2)}, bias=${fmt(bias)}`,
    sceneUpdate: finalScene,
  });

  return { steps, initialScene };
}
