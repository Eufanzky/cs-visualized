import type { AnimationStep, NeuronScene, NeuronLayerEdge, StepResult } from '../animation-engine';

/**
 * Generates a StepResult for backpropagation training on a simple 2→3→1 network.
 *
 * Steps produced:
 *   compare → forward pass through a layer (computing activations)
 *   swap    → backward pass / weight update (gradient computation + weight change)
 *   sorted  → loss computation or convergence checkpoint
 *   done    → training complete
 */

const LAYERS = [2, 3, 1];
const LEARNING_RATE = 0.5;
const MAX_ITERATIONS = 8;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function sigmoidDerivative(output: number): number {
  return output * (1 - output);
}

const fmt = (v: number) => v.toFixed(3);

interface NetworkState {
  weights: number[][][]; // weights[layer][toNode][fromNode]
  biases: number[][];    // biases[layer][node]
  activations: number[][];
  gradients: number[][][];
}

function initNetwork(seed: number[]): NetworkState {
  const weights: number[][][] = [];
  const biases: number[][] = [];
  const activations: number[][] = [];
  const gradients: number[][][] = [];

  // Use seed values to deterministically create weights
  let seedIdx = 0;
  const nextSeed = () => {
    const v = seedIdx < seed.length ? seed[seedIdx] : Math.random();
    seedIdx++;
    return (v - 0.5) * 2;
  };

  for (let l = 0; l < LAYERS.length; l++) {
    activations[l] = new Array(LAYERS[l]).fill(0);
    if (l > 0) {
      weights[l] = [];
      biases[l] = new Array(LAYERS[l]).fill(0).map(() => nextSeed() * 0.25);
      gradients[l] = [];
      for (let j = 0; j < LAYERS[l]; j++) {
        weights[l][j] = [];
        gradients[l][j] = [];
        for (let i = 0; i < LAYERS[l - 1]; i++) {
          weights[l][j][i] = nextSeed();
          gradients[l][j][i] = 0;
        }
      }
    }
  }

  return { weights, biases, activations, gradients };
}

function makeScene(
  net: NetworkState,
  currentExample: number | undefined,
  phase: string = 'idle',
  loss?: number,
): NeuronScene {
  // Flatten all weights across all layers for visualization
  const allWeights: number[] = [];
  for (let l = 1; l < LAYERS.length; l++) {
    for (let j = 0; j < LAYERS[l]; j++) {
      for (let i = 0; i < LAYERS[l - 1]; i++) {
        allWeights.push(net.weights[l][j][i]);
      }
    }
  }

  // Build layer definitions with activation values
  const layers = LAYERS.map((size, l) => {
    const nodes = [...net.activations[l]];
    const labels: string[] = [];
    if (l === 0) {
      for (let i = 0; i < size; i++) labels.push(`x${i + 1}`);
    } else if (l === LAYERS.length - 1) {
      for (let i = 0; i < size; i++) labels.push('out');
    } else {
      for (let i = 0; i < size; i++) labels.push(`h${i + 1}`);
    }
    return { nodes, labels };
  });

  // Build edges between layers
  const layerEdges: NeuronLayerEdge[] = [];
  for (let l = 1; l < LAYERS.length; l++) {
    for (let j = 0; j < LAYERS[l]; j++) {
      for (let i = 0; i < LAYERS[l - 1]; i++) {
        const isHighlighted = phase === 'backward'
          ? Math.abs(net.gradients[l]?.[j]?.[i] ?? 0) > 0.01
          : phase === 'forward';
        layerEdges.push({
          from: [l - 1, i],
          to: [l, j],
          weight: net.weights[l][j][i],
          highlighted: isHighlighted,
        });
      }
    }
  }

  return {
    type: 'neuron',
    variant: 'multilayer',
    inputs: [...net.activations[0]],
    weights: allWeights,
    bias: net.biases[1]?.[0] ?? 0,
    weightedSum: net.activations[LAYERS.length - 1][0],
    output: net.activations[LAYERS.length - 1][0],
    currentExample,
    layers,
    layerEdges,
    networkPhase: phase,
    loss,
  };
}

export function generateBackpropagationSteps(arr: number[]): StepResult {
  const steps: AnimationStep[] = [];
  const net = initNetwork(arr);

  // Training examples: XOR-like pattern (requires hidden layer)
  const trainingData = [
    { x1: 0.1, x2: 0.1, target: 0.05 },
    { x1: 0.1, x2: 0.9, target: 0.95 },
    { x1: 0.9, x2: 0.1, target: 0.95 },
    { x1: 0.9, x2: 0.9, target: 0.05 },
  ];

  const initialScene = makeScene(net, undefined, 'idle');

  // Intro step
  steps.push({
    type: 'compare',
    indices: [0],
    description: `Backpropagation init — network ${LAYERS.join('→')}, lr=${LEARNING_RATE}. Training on XOR pattern.`,
    sceneUpdate: makeScene(net, 0, 'idle'),
  });

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    for (let ex = 0; ex < trainingData.length; ex++) {
      const { x1, x2, target } = trainingData[ex];

      // Set inputs
      net.activations[0][0] = x1;
      net.activations[0][1] = x2;

      // === FORWARD PASS ===
      for (let l = 1; l < LAYERS.length; l++) {
        for (let j = 0; j < LAYERS[l]; j++) {
          let sum = net.biases[l][j];
          for (let i = 0; i < LAYERS[l - 1]; i++) {
            sum += net.weights[l][j][i] * net.activations[l - 1][i];
          }
          net.activations[l][j] = sigmoid(sum);
        }

        const layerName = l === LAYERS.length - 1 ? 'output' : 'hidden';
        const activationStr = net.activations[l].map(a => fmt(a)).join(', ');
        steps.push({
          type: 'compare',
          indices: [ex],
          description: `Iter ${iter + 1}, ex ${ex + 1}: forward → ${layerName} layer activations [${activationStr}]`,
          sceneUpdate: makeScene(net, ex, 'forward'),
        });
      }

      // === COMPUTE LOSS ===
      const output = net.activations[LAYERS.length - 1][0];
      const loss = 0.5 * (target - output) * (target - output);

      steps.push({
        type: 'sorted',
        indices: [ex],
        description: `Loss = ${fmt(loss)} — output ${fmt(output)}, target ${fmt(target)}, error ${fmt(target - output)}`,
        sceneUpdate: makeScene(net, ex, 'idle', loss),
      });

      // === BACKWARD PASS ===
      // Output layer gradients
      const L = LAYERS.length - 1;
      const outputError = (output - target) * sigmoidDerivative(output);

      for (let i = 0; i < LAYERS[L - 1]; i++) {
        net.gradients[L][0][i] = outputError * net.activations[L - 1][i];
      }

      steps.push({
        type: 'swap',
        indices: [ex],
        description: `Backward → output layer: δ=${fmt(outputError)}, gradients computed via chain rule`,
        sceneUpdate: makeScene(net, ex, 'backward', loss),
      });

      // Hidden layer gradients
      for (let l = L - 1; l >= 1; l--) {
        for (let j = 0; j < LAYERS[l]; j++) {
          const a = net.activations[l][j];
          let upstream = 0;
          for (let k = 0; k < LAYERS[l + 1]; k++) {
            // For simplicity with our small network
            const upstreamDelta = l + 1 === L ? outputError : 0;
            upstream += upstreamDelta * net.weights[l + 1][k][j];
          }
          const hiddenDelta = upstream * sigmoidDerivative(a);
          for (let i = 0; i < LAYERS[l - 1]; i++) {
            net.gradients[l][j][i] = hiddenDelta * net.activations[l - 1][i];
          }
        }

        steps.push({
          type: 'swap',
          indices: [ex],
          description: `Backward → hidden layer ${l}: propagating error gradients back through weights`,
          sceneUpdate: makeScene(net, ex, 'backward', loss),
        });
      }

      // === UPDATE WEIGHTS ===
      const prevWeightSample = fmt(net.weights[1][0][0]);
      for (let l = 1; l < LAYERS.length; l++) {
        for (let j = 0; j < LAYERS[l]; j++) {
          for (let i = 0; i < LAYERS[l - 1]; i++) {
            net.weights[l][j][i] -= LEARNING_RATE * net.gradients[l][j][i];
          }
          // Update bias using the node's delta (simplified)
          const delta = l === L
            ? outputError
            : net.gradients[l][j][0] / (net.activations[l - 1][0] || 1);
          net.biases[l][j] -= LEARNING_RATE * delta;
        }
      }
      const newWeightSample = fmt(net.weights[1][0][0]);

      steps.push({
        type: 'swap',
        indices: [ex],
        description: `Weights updated: w[1][0][0] ${prevWeightSample}→${newWeightSample}, loss=${fmt(loss)}`,
        sceneUpdate: makeScene(net, ex, 'update', loss),
      });
    }

    // Epoch summary: compute average loss
    let totalLoss = 0;
    for (const { x1, x2, target } of trainingData) {
      net.activations[0][0] = x1;
      net.activations[0][1] = x2;
      for (let l = 1; l < LAYERS.length; l++) {
        for (let j = 0; j < LAYERS[l]; j++) {
          let sum = net.biases[l][j];
          for (let i = 0; i < LAYERS[l - 1]; i++) {
            sum += net.weights[l][j][i] * net.activations[l - 1][i];
          }
          net.activations[l][j] = sigmoid(sum);
        }
      }
      const out = net.activations[LAYERS.length - 1][0];
      totalLoss += 0.5 * (target - out) * (target - out);
    }
    const avgLoss = totalLoss / trainingData.length;

    steps.push({
      type: 'sorted',
      indices: Array.from({ length: trainingData.length }, (_, i) => i),
      description: `Iteration ${iter + 1} complete — avg loss=${fmt(avgLoss)}`,
      sceneUpdate: makeScene(net, undefined, 'idle', avgLoss),
    });
  }

  // Done
  steps.push({
    type: 'done',
    indices: [],
    description: `Backpropagation training complete after ${MAX_ITERATIONS} iterations on ${LAYERS.join('→')} network.`,
    sceneUpdate: makeScene(net, undefined, 'idle'),
  });

  return { steps, initialScene };
}
