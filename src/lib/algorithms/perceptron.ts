import type { AnimationStep } from '../animation-engine';

/**
 * Generates AnimationSteps for single-neuron Perceptron training.
 *
 * A 2-input perceptron is trained on a linearly separable AND dataset.
 * The `arr` parameter seeds the initial random weights via its values.
 *
 * Steps produced:
 *   - compare  → computing the weighted sum for an input example
 *   - swap     → applying a weight update (misprediction detected)
 *   - sorted   → correct prediction — no weight update needed
 *   - done     → training converged (or max epochs reached)
 *
 * `indices` carries [exampleIndex] (0-based position in the training set)
 * so renderers can highlight the current training point on a scatter plot.
 * `values` on swap steps carries [w0, w1, bias] after the update.
 */

interface TrainingExample {
  x1: number;
  x2: number;
  label: number; // 0 or 1
}

// 2-input AND function — linearly separable, convergence guaranteed.
const TRAINING_DATA: TrainingExample[] = [
  { x1: 0, x2: 0, label: 0 },
  { x1: 0, x2: 1, label: 0 },
  { x1: 1, x2: 0, label: 0 },
  { x1: 1, x2: 1, label: 1 },
];

const MAX_EPOCHS = 20;
const LEARNING_RATE = 0.1;

/** Step activation: returns 1 if sum >= 0, else 0. */
function activate(sum: number): number {
  return sum >= 0 ? 1 : 0;
}

export function generatePerceptronSteps(arr: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];

  // Seed weights from arr values, or use small defaults
  let w1 = arr.length > 0 ? (arr[0] - 0.5) * 0.4 : 0.1;
  let w2 = arr.length > 1 ? (arr[1] - 0.5) * 0.4 : 0.1;
  let bias = arr.length > 2 ? (arr[2] - 0.5) * 0.4 : -0.15;

  const fmt = (v: number) => v.toFixed(3);

  steps.push({
    type: 'compare',
    indices: [0],
    description: `Perceptron init — w1=${fmt(w1)}, w2=${fmt(w2)}, bias=${fmt(bias)}, lr=${LEARNING_RATE}. Training on AND gate (4 examples).`,
  });

  let converged = false;

  for (let epoch = 0; epoch < MAX_EPOCHS && !converged; epoch++) {
    let errorsThisEpoch = 0;

    for (let i = 0; i < TRAINING_DATA.length; i++) {
      const { x1, x2, label } = TRAINING_DATA[i];

      // Forward pass: weighted sum
      const weightedSum = w1 * x1 + w2 * x2 + bias;
      const output = activate(weightedSum);

      steps.push({
        type: 'compare',
        indices: [i],
        description: `Epoch ${epoch + 1}, example ${i + 1}: input [${x1},${x2}], weights [${fmt(w1)},${fmt(w2)}], bias ${fmt(bias)} → sum=${fmt(weightedSum)}, output=${output}, label=${label}`,
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
        });

        errorsThisEpoch++;
      } else {
        // Correct prediction
        steps.push({
          type: 'sorted',
          indices: [i],
          description: `Correct prediction (output=${output} = label=${label}) — no weight update needed`,
        });
      }
    }

    if (errorsThisEpoch === 0) {
      converged = true;
      steps.push({
        type: 'sorted',
        indices: Array.from({ length: TRAINING_DATA.length }, (_, i) => i),
        description: `Epoch ${epoch + 1} complete with 0 errors — perceptron has converged! Final weights: w1=${fmt(w1)}, w2=${fmt(w2)}, bias=${fmt(bias)}`,
      });
    }
  }

  steps.push({
    type: 'done',
    indices: [],
    description: converged
      ? `Training complete — perceptron converged. Decision boundary: ${fmt(w1)}·x1 + ${fmt(w2)}·x2 + ${fmt(bias)} = 0`
      : `Training stopped after ${MAX_EPOCHS} epochs. Final weights: w1=${fmt(w1)}, w2=${fmt(w2)}, bias=${fmt(bias)}`,
  });

  return steps;
}
